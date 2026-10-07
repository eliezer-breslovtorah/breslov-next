import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { inquiriesDb } from "@/lib/inquiries";
import { dataDirectory } from "@/lib/store";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if ((await getCurrentUser())?.role !== "admin")
    return new Response("Forbidden", { status: 403 });
  const item = inquiriesDb()
    .prepare("SELECT path,mime FROM inquiry_attachments WHERE inquiry_id=?")
    .get((await params).id) as { path: string; mime: string } | undefined;
  if (!item) return new Response("Not found", { status: 404 });
  try {
    if (!/^[a-f0-9-]+\.(jpg|png)$/.test(item.path)) throw Error("Invalid path");
    const root = await realpath(
      path.join(dataDirectory, "inquiry-attachments"),
    );
    const file = await realpath(path.join(root, item.path));
    if (!file.startsWith(root + path.sep)) throw Error("Invalid path");
    return new Response(await readFile(file), {
      headers: {
        "Content-Type": item.mime,
        "Content-Disposition": `attachment; filename="matchmaking-photo.${item.mime === "image/png" ? "png" : "jpg"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
