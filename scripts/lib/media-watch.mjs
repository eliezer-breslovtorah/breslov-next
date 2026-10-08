import { DatabaseSync } from "node:sqlite";
import { randomUUID, createHash } from "node:crypto";
import { readdir, lstat, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const formats = {
  ".mp3": ["Audio", "audio/mpeg"],
  ".m4a": ["Audio", "audio/mp4"],
  ".aac": ["Audio", "audio/aac"],
  ".ogg": ["Audio", "audio/ogg"],
  ".wav": ["Audio", "audio/wav"],
  ".flac": ["Audio", "audio/flac"],
  ".mp4": ["Video", "video/mp4"],
  ".webm": ["Video", "video/webm"],
  ".mov": ["Video", "video/quicktime"],
  ".m4v": ["Video", "video/mp4"],
};
const within = (root, file) => file.startsWith(root + path.sep);

/** Polling survives missed filesystem events and runs identically on all hosts. */
export async function createMediaWatcher({
  dataDirectory,
  mediaRoot,
  watchDirectory,
  stableMs = 30000,
  now = Date.now,
  logger = () => {},
  access = "members",
  rules = [],
}) {
  if (!["members", "public"].includes(access))
    throw Error("Watcher access must be members or public");
  if (!Number.isFinite(stableMs) || stableMs < 0)
    throw Error("Invalid stability interval");
  const root = await realpath(mediaRoot);
  const watched = await realpath(watchDirectory);
  if (!within(root, watched))
    throw Error("Watch directory must be inside MEDIA_ROOT");
  if (!(await lstat(watched)).isDirectory())
    throw Error("Watch directory is not a directory");
  const database = path.resolve(dataDirectory, "breslov.sqlite");
  if (!existsSync(database))
    throw Error("Start the app first to initialize its library database");
  const db = new DatabaseSync(database, { timeout: 5000 });
  try {
    for (const table of [
      "lessons",
      "collections",
      "lesson_terms",
      "lesson_search",
      "media",
      "audit_log",
    ])
      if (!db.prepare("SELECT name FROM sqlite_master WHERE name=?").get(table))
        throw Error(`Library database is not initialized: ${table}`);
    db.exec(`PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS media_watch_roots(root TEXT PRIMARY KEY,initialized INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS media_watch_files(root TEXT NOT NULL,path TEXT NOT NULL,size INTEGER NOT NULL,mtime REAL NOT NULL,stable_since INTEGER NOT NULL,state TEXT NOT NULL,lesson_id TEXT,PRIMARY KEY(root,path));`);
    if (!Array.isArray(rules)) throw Error("Watcher rules must be an array");
    for (const rule of rules) {
      if (
        rule.speaker !== undefined &&
        (typeof rule.speaker !== "string" ||
          !rule.speaker.trim() ||
          rule.speaker.length > 200)
      )
        throw Error("Rule speaker must be a name of at most 200 characters");
      if (
        rule.collectionSlug !== undefined &&
        typeof rule.collectionSlug !== "string"
      )
        throw Error("Rule collectionSlug must be a string");
      if (
        !rule ||
        typeof rule.prefix !== "string" ||
        rule.prefix.startsWith("/") ||
        rule.prefix.split("/").includes("..")
      )
        throw Error("Rule prefix must be relative to the watch directory");
      if (rule.access && !["members", "public"].includes(rule.access))
        throw Error("Invalid rule access");
      if (
        rule.collectionSlug &&
        !db
          .prepare("SELECT slug FROM collections WHERE slug=?")
          .get(rule.collectionSlug)
      )
        throw Error(`Unknown collection: ${rule.collectionSlug}`);
    }
  } catch (error) {
    db.close();
    throw error;
  }
  let busy = false;
  let closed = false;
  async function inventory(directory, entries) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const filename = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        await inventory(filename, entries);
        continue;
      }
      if (!entry.isFile() || !formats[path.extname(entry.name).toLowerCase()])
        continue;
      try {
        const info = await lstat(filename);
        if (
          !info.isFile() ||
          info.isSymbolicLink() ||
          !within(watched, await realpath(filename))
        )
          continue;
        entries.push({
          filename,
          relative: path.relative(watched, filename).split(path.sep).join("/"),
          mediaPath: path.relative(root, filename).split(path.sep).join("/"),
          size: info.size,
          mtime: info.mtimeMs,
        });
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }
  function metadata(file) {
    const rule =
      [...rules]
        .sort((a, b) => b.prefix.length - a.prefix.length)
        .find(
          (r) =>
            r.prefix === "" ||
            file.relative === r.prefix ||
            file.relative.startsWith(r.prefix.replace(/\/$/, "") + "/"),
        ) || {};
    const collection = rule.collectionSlug
      ? JSON.parse(
          db
            .prepare("SELECT payload FROM collections WHERE slug=?")
            .get(rule.collectionSlug).payload,
        )
      : undefined;
    const basename = path.basename(file.filename);
    const title =
      path
        .basename(basename, path.extname(basename))
        .replace(/[_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 600) || "New recording";
    const digest = createHash("sha256")
      .update(watched + "/" + file.relative)
      .digest("hex")
      .slice(0, 16);
    const slug = `${
      title
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) || "recording"
    }-${digest}`;
    const knownTeacher = file.relative.startsWith("rabbi-maimon/")
      ? ["Rabbi Nasan Maimon", "/images/rabbi-nasan-maimon.jpg"]
      : file.relative.startsWith("rabbi-rosenfeld/")
        ? ["Rabbi Zvi Aryeh Rosenfeld z”l", "/images/rabbi-rosenfeld.jpg"]
        : file.relative.startsWith("rabbi-dorfman/")
          ? ['Rabbi Michel Dorfman z"l', "/images/logo.png"]
          : undefined;
    const categories = collection
      ? [
          {
            id: collection.sourceId,
            slug: collection.slug,
            title: collection.title,
            taxonomy: collection.taxonomy,
            parentId: collection.parentId || 0,
          },
        ].filter((t) => t.id && t.taxonomy)
      : [];
    const timestamp = new Date(now()).toISOString();
    const lesson = {
      id: randomUUID(),
      slug,
      title,
      speaker: rule.speaker || knownTeacher?.[0] || "Speaker to be confirmed",
      collection: collection?.title || "New recordings",
      topic: "",
      format: formats[path.extname(basename).toLowerCase()][0],
      description:
        "New recording. The Breslov Torah team can add the lesson description and categories.",
      bodyText: "",
      legacyUrl: "",
      image: knownTeacher?.[1] || "/images/logo.png",
      status: "publish",
      access: rule.access || access,
      hasMedia: true,
      publishedAt: timestamp,
      updatedAt: timestamp,
      categories,
      collectionSlugs: collection ? [collection.slug] : [],
    };
    return {
      lesson,
      media: {
        id: lesson.id,
        lessonId: lesson.id,
        kind: "original",
        path: file.mediaPath,
        mime: formats[path.extname(basename).toLowerCase()][1],
        access: lesson.access,
        filename: basename,
      },
    };
  }
  async function scan() {
    if (busy || closed) return { added: 0, skipped: true };
    busy = true;
    try {
      const files = [];
      await inventory(watched, files);
      const initialized = !!db
        .prepare("SELECT initialized FROM media_watch_roots WHERE root=?")
        .get(watched);
      const known = new Set(
        db
          .prepare("SELECT payload FROM media")
          .all()
          .map(({ payload }) => JSON.parse(payload))
          .filter((m) => m.kind === "original")
          .map((m) => path.resolve(root, m.path)),
      );
      let added = 0;
      const timestamp = now();
      db.exec("BEGIN IMMEDIATE");
      try {
        for (const file of files) {
          const previous = db
            .prepare("SELECT * FROM media_watch_files WHERE root=? AND path=?")
            .get(watched, file.relative);
          if (previous && previous.state !== "pending") continue;
          if (!initialized || known.has(file.filename)) {
            db.prepare(
              "INSERT INTO media_watch_files VALUES(?,?,?,?,?,?,?) ON CONFLICT(root,path) DO UPDATE SET state=excluded.state",
            ).run(
              watched,
              file.relative,
              file.size,
              file.mtime,
              timestamp,
              "baseline",
              null,
            );
            continue;
          }
          if (
            !previous ||
            previous.size !== file.size ||
            previous.mtime !== file.mtime
          ) {
            db.prepare(
              "INSERT INTO media_watch_files VALUES(?,?,?,?,?,?,?) ON CONFLICT(root,path) DO UPDATE SET size=excluded.size,mtime=excluded.mtime,stable_since=excluded.stable_since,state='pending'",
            ).run(
              watched,
              file.relative,
              file.size,
              file.mtime,
              timestamp,
              "pending",
              null,
            );
            continue;
          }
          if (
            !file.size ||
            timestamp - previous.stable_since < stableMs ||
            timestamp - file.mtime < stableMs
          )
            continue;
          const { lesson, media } = metadata(file);
          db.prepare(
            "INSERT INTO lessons(id,slug,title,speaker,collection,format,status,published_at,payload) VALUES(?,?,?,?,?,?,?,?,?)",
          ).run(
            lesson.id,
            lesson.slug,
            lesson.title,
            lesson.speaker,
            lesson.collection,
            lesson.format,
            lesson.status,
            lesson.publishedAt,
            JSON.stringify(lesson),
          );
          for (const t of lesson.categories)
            db.prepare("INSERT INTO lesson_terms VALUES(?,?,?,?,?)").run(
              lesson.id,
              t.slug,
              t.title,
              t.taxonomy,
              t.id,
            );
          db.prepare("INSERT INTO lesson_search VALUES(?,?,?,?,?)").run(
            lesson.id,
            lesson.title,
            lesson.speaker,
            lesson.collection,
            lesson.description,
          );
          db.prepare("INSERT INTO media VALUES(?,?,?)").run(
            media.id,
            lesson.id,
            JSON.stringify(media),
          );
          db.prepare(
            "INSERT INTO audit_log(at,actor,action,subject) VALUES(?,?,?,?)",
          ).run(
            lesson.publishedAt,
            "media-watcher",
            "import_recording",
            lesson.id,
          );
          db.prepare(
            "UPDATE media_watch_files SET state='imported',lesson_id=? WHERE root=? AND path=?",
          ).run(lesson.id, watched, file.relative);
          added++;
        }
        // Missing pending uploads must become stable again if they reappear.
        const present = new Set(files.map((f) => f.relative));
        for (const row of db
          .prepare(
            "SELECT path FROM media_watch_files WHERE root=? AND state='pending'",
          )
          .all(watched))
          if (!present.has(row.path))
            db.prepare(
              "DELETE FROM media_watch_files WHERE root=? AND path=?",
            ).run(watched, row.path);
        db.prepare("INSERT OR IGNORE INTO media_watch_roots VALUES(?,1)").run(
          watched,
        );
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      logger({
        event: initialized ? "scan" : "baseline",
        files: files.length,
        added,
      });
      return { added, files: files.length, baseline: !initialized };
    } finally {
      busy = false;
    }
  }
  return {
    scan,
    close() {
      if (!closed) {
        closed = true;
        db.close();
      }
    },
  };
}
