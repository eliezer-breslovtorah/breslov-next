import { mediaRoot } from "@/lib/store";
import { streamStoredFile } from "@/lib/media-stream";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const excerpts: Record<string, string> = {
  "the-first-step.mp3":
    "media/courses/mini-clips/btmc-2021-10-18-the-first-step-when-seeking-help.mp3",
  "you-are-not-alone.mp3":
    "media/courses/mini-clips/btmc-2021-10-21-you-are-not-alone.mp3",
  "every-good-thought-counts.mp3":
    "media/courses/mini-clips/btmc-2021-10-25-every-good-thought-counts.mp3",
  "hidden-creation-of-water.mp3":
    "media/parsha/rnm-ps-01-bereishis-lh3-oc3-100704CLIP-creation-water-hidden-with-music-intro-outro.mp3",
};
async function serve(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const path = Object.hasOwn(excerpts, file) ? excerpts[file] : undefined;
  if (!path) return new Response("Recording not found", { status: 404 });
  return streamStoredFile(request, {
    root: mediaRoot,
    path,
    mime: "audio/mpeg",
    filename: file,
  });
}
export const GET = serve;
export const HEAD = serve;
