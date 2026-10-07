import "server-only";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
export type StoredFile = {
  root: string;
  path: string;
  mime: string;
  filename: string;
};
export type MediaAvailability = "available" | "missing" | "unconfigured";
async function resolveStoredFile(
  file: Pick<StoredFile, "root" | "path">,
): Promise<{ path: string; size: number } | undefined> {
  if (!file.root) return undefined;
  try {
    const root = await realpath(file.root);
    const path = await realpath(resolve(root, file.path));
    if (!path.startsWith(root + sep)) return undefined;
    const info = await stat(path);
    if (!info.isFile() || !Number.isSafeInteger(info.size)) return undefined;
    return { path, size: info.size };
  } catch {
    return undefined;
  }
}
export async function storedFileAvailability(
  file: Pick<StoredFile, "root" | "path">,
): Promise<MediaAvailability> {
  if (!file.root) return "unconfigured";
  const stored = await resolveStoredFile(file);
  return stored && stored.size > 0 ? "available" : "missing";
}
export async function streamStoredFile(
  request: Request,
  file: StoredFile,
): Promise<Response> {
  if (!file.root)
    return new Response("Media storage has not been configured", {
      status: 503,
    });
  const stored = await resolveStoredFile(file);
  if (!stored) return new Response("Recording not found", { status: 404 });
  const { path, size } = stored;
  let start = 0,
    end = size - 1,
    status = 200;
  const unsatisfiable = () =>
    new Response(null, {
      status: 416,
      headers: {
        "Content-Range": "bytes */" + size,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
      },
    });
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2]) || !size) return unsatisfiable();
    if (!match[1]) {
      const suffix = Number(match[2]);
      if (!Number.isSafeInteger(suffix) || suffix <= 0) return unsatisfiable();
      start = Math.max(0, size - suffix);
    } else {
      start = Number(match[1]);
      if (match[2]) {
        const requestedEnd = Number(match[2]);
        if (!Number.isSafeInteger(requestedEnd)) return unsatisfiable();
        end = Math.min(end, requestedEnd);
      }
    }
    if (!Number.isSafeInteger(start) || start > end || start >= size)
      return unsatisfiable();
    status = 206;
  }
  const headers: Record<string, string> = {
    "Content-Type": file.mime,
    "Accept-Ranges": "bytes",
    "Content-Length": String(size ? end - start + 1 : 0),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (status === 206)
    headers["Content-Range"] = "bytes " + start + "-" + end + "/" + size;
  if (new URL(request.url).searchParams.has("download"))
    headers["Content-Disposition"] =
      "attachment; filename*=UTF-8''" + encodeURIComponent(file.filename);
  if (request.method === "HEAD" || !size)
    return new Response(null, { status, headers });
  const fileStream = createReadStream(path, { start, end });
  fileStream.pause();
  let closed = false;
  let abort: (() => void) | undefined;
  const cleanup = () => {
    if (abort) request.signal.removeEventListener("abort", abort);
  };
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const finish = () => {
        if (closed) return;
        closed = true;
        cleanup();
        controller.close();
      };
      fileStream.on("data", (chunk: Buffer | string) => {
        if (closed) return;
        controller.enqueue(
          typeof chunk === "string" ? Buffer.from(chunk) : chunk,
        );
        if ((controller.desiredSize ?? 0) <= 0) fileStream.pause();
      });
      fileStream.on("error", (error) => {
        if (closed) return;
        closed = true;
        cleanup();
        controller.error(error);
      });
      fileStream.once("end", finish);
      fileStream.once("close", finish);
      abort = () => {
        if (closed) return;
        closed = true;
        cleanup();
        controller.error(
          new DOMException("Playback request aborted", "AbortError"),
        );
        fileStream.destroy();
      };
      request.signal.addEventListener("abort", abort, { once: true });
      if (request.signal.aborted) abort();
    },
    pull() {
      if (!closed) fileStream.resume();
    },
    cancel() {
      if (closed) return;
      closed = true;
      cleanup();
      fileStream.destroy();
    },
  });
  return new Response(body, { status, headers });
}
