import { resolve } from "node:path";
import { getLessonById, getMedia } from "@/lib/catalog";
import { dataDirectory, mediaRoot } from "@/lib/store";
import { getCurrentUser, canAccessMembers, rateLimit } from "@/lib/auth";
import { streamStoredFile } from "@/lib/media-stream";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function serve(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const media = getMedia(id);
  const lesson = media ? getLessonById(media.lessonId) : undefined;
  if (!media || !lesson)
    return new Response("Recording not found", { status: 404 });
  if (media.access === "legacy" || lesson.access === "legacy")
    return new Response("Use the original lesson for this recording", {
      status: 403,
    });
  if (
    (media.access === "members" || lesson.access === "members") &&
    !canAccessMembers(await getCurrentUser())
  )
    return new Response("Membership required", {
      status: 403,
      headers: { "Cache-Control": "private, no-store" },
    });
  // Apache overwrites this header with the actual connected client address.
  // Keep public lessons public, while bounding bulk transfers across recordings.
  if (request.method === "GET") {
    const client = request.headers.get("x-breslov-client-ip") || "direct";
    try {
      rateLimit(`media-requests:${client}`, 120);
      if (!request.headers.has("range") || new URL(request.url).searchParams.has("download"))
        rateLimit(`media-downloads:${client}`, 20);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith("Too many attempts"))
        throw error;
      return new Response("Download limit reached. Please try again in 15 minutes.", {
        status: 429,
        headers: { "Retry-After": "900", "Cache-Control": "private, no-store" },
      });
    }
  }
  return streamStoredFile(request, {
    root:
      media.kind === "upload" ? resolve(dataDirectory, "uploads") : mediaRoot,
    path: media.path,
    mime: media.mime,
    filename: media.filename,
  });
}
export const GET = serve;
export const HEAD = serve;
