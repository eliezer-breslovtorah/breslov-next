import "server-only";
import { resolve } from "node:path";
import { getMedia, dataDirectory, mediaRoot } from "./store";
import { storedFileAvailability, type MediaAvailability } from "./media-stream";
/** Returns storage status only; original locations never enter page props. */
export async function getLessonMediaAvailability(
  lessonId: string,
): Promise<MediaAvailability> {
  const media = getMedia(lessonId);
  if (!media) return "missing";
  return storedFileAvailability({
    root:
      media.kind === "upload" ? resolve(dataDirectory, "uploads") : mediaRoot,
    path: media.path,
  });
}
