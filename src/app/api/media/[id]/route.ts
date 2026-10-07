import { resolve } from "node:path";
import { getLessonById, getMedia } from "@/lib/catalog";
import { dataDirectory, mediaRoot } from "@/lib/store";
import { getCurrentUser, canAccessMembers } from "@/lib/auth";
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
