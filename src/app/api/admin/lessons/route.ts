import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { requireAdmin, assertSameOrigin } from "@/lib/auth";
import {
  saveLesson,
  getLessonById,
  getCollections,
  getTeachers,
  dataDirectory,
  logAudit,
} from "@/lib/store";
import type { Lesson } from "@/lib/content";
import type { MediaRecord } from "@/lib/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let uploaded: string | undefined;
  try {
    assertSameOrigin(request);
    const user = await requireAdmin();
    const form = await request.formData(),
      value = (key: string) => String(form.get(key) || "").trim();
    const id = value("id"),
      old = id ? getLessonById(id, true) : undefined;
    if (id && !old) throw Error("Lesson not found");
    const categorySlugs = value("categories")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      collections = getCollections();
    if (categorySlugs.some((slug) => !collections.some((c) => c.slug === slug)))
      throw Error(
        "Unknown category. Create it in Categories and teachers first.",
      );
    const categories = collections
      .filter((c) => categorySlugs.includes(c.slug))
      .map((c) => ({
        id: c.sourceId || 0,
        slug: c.slug,
        title: c.title,
        taxonomy: c.taxonomy || "courses",
        parentId: c.parentId || 0,
      }));
    const tagsValue = form.get("tags");
    const tags =
      tagsValue === null
        ? (old?.categories || []).filter((t) => t.taxonomy === "post_tag")
        : String(tagsValue)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 40)
            .map((title, index) => {
              const slug = title
                .toLowerCase()
                .normalize("NFKD")
                .replace(/[^\p{L}\p{N}]+/gu, "-")
                .replace(/^-|-$/g, "");
              return {
                id: 1000000 + index,
                slug,
                title: title.slice(0, 120),
                taxonomy: "post_tag",
                parentId: 0,
              };
            });
    categories.push(...tags);
    const lesson: Lesson = {
      ...old,
      id: old?.id || randomUUID(),
      slug: value("slug"),
      title: value("title"),
      speaker: value("speaker"),
      collection: value("collection"),
      topic: value("topic"),
      description: value("description").slice(0, 10000),
      bodyText: value("bodyText").slice(0, 100000),
      duration: value("duration"),
      format: value("format") as Lesson["format"],
      status: value("status") as Lesson["status"],
      access: value("access") as Lesson["access"],
      dedication: value("dedication").slice(0, 3000),
      categories,
      collectionSlugs: categorySlugs,
      image:
        old?.speaker === value("speaker")
          ? old.image
          : getTeachers().find((t) => t.name === value("speaker"))?.image ||
            "/images/logo.png",
      legacyUrl: old?.legacyUrl || "",
      videoEmbedUrl: value("videoEmbedUrl"),
    };
    if (!lesson.speaker || !lesson.description)
      throw Error("Enter a teacher and description");
    if (lesson.videoEmbedUrl) {
      const url = new URL(lesson.videoEmbedUrl);
      if (
        url.protocol !== "https:" ||
        ![
          "player.vimeo.com",
          "www.youtube.com",
          "www.youtube-nocookie.com",
        ].includes(url.hostname)
      )
        throw Error("Use an HTTPS Vimeo or YouTube embed URL");
    }
    let media: MediaRecord | undefined;
    const file = form.get("media");
    if (file instanceof File && file.size) {
      if (file.size > 200 * 1024 * 1024)
        throw Error("Maximum upload size is 200 MB");
      const buffer = Buffer.from(await file.arrayBuffer());
      const mp3 =
          buffer.subarray(0, 3).toString() === "ID3" ||
          (buffer[0] === 255 && (buffer[1] & 224) === 224),
        mp4 = buffer.subarray(4, 8).toString() === "ftyp";
      if (!mp3 && !mp4)
        throw Error("Upload a valid MP3 audio or MP4 video file");
      if (
        (lesson.format === "Audio" && !mp3) ||
        (lesson.format === "Video" && !mp4)
      )
        throw Error("Upload type must match the lesson format");
      const filename = `${randomUUID()}.${mp3 ? "mp3" : "mp4"}`;
      const directory = resolve(dataDirectory, "uploads");
      await mkdir(directory, { recursive: true, mode: 0o700 });
      uploaded = resolve(directory, filename);
      await writeFile(uploaded, buffer, { mode: 0o600, flag: "wx" });
      media = {
        id: randomUUID(),
        lessonId: lesson.id!,
        kind: "upload",
        path: filename,
        mime: mp3 ? "audio/mpeg" : "video/mp4",
        access: lesson.access || "members",
        filename: file.name.replace(/[\r\n]/g, "").slice(0, 200),
      };
      lesson.hasMedia = true;
    }
    const saved = saveLesson(lesson, media);
    logAudit(user.id, "save_lesson", saved.id!);
    return Response.json({ ok: true, slug: saved.slug, id: saved.id });
  } catch (e) {
    if (uploaded) await unlink(uploaded).catch(() => {});
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to save lesson" },
      { status: 400 },
    );
  }
}
