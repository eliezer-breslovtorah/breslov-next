import "server-only";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { Lesson, Collection, Teacher } from "./content";
import {
  lessons as fallbackLessons,
  collections as fallbackCollections,
  teachers as fallbackTeachers,
} from "./content";
export type MediaRecord = {
  id: string;
  lessonId: string;
  kind: "original" | "upload";
  path: string;
  mime: string;
  access: "public" | "members" | "legacy";
  filename: string;
};
export type PublicPage = {
  slug: string;
  title: string;
  bodyText: string;
  legacyUrl: string;
};
export const dataDirectory = resolve(process.env.APP_DATA_DIR || "data");
export const mediaRoot = process.env.MEDIA_ROOT
  ? resolve(process.env.MEDIA_ROOT)
  : "";
let connection: DatabaseSync | undefined;
export function getDb(): DatabaseSync {
  if (connection) return connection;
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(resolve(dataDirectory, "breslov.sqlite"), {
    timeout: 5000,
  });
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS lessons (id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,title TEXT NOT NULL,speaker TEXT NOT NULL,collection TEXT NOT NULL,format TEXT NOT NULL,status TEXT NOT NULL,published_at TEXT NOT NULL,payload TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS lessons_public ON lessons(status,published_at DESC);
    CREATE TABLE IF NOT EXISTS collections (slug TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS teachers (slug TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pages (slug TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS lesson_terms (lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,slug TEXT NOT NULL,title TEXT NOT NULL,taxonomy TEXT NOT NULL,term_id INTEGER NOT NULL,PRIMARY KEY(lesson_id,taxonomy,term_id));
    CREATE INDEX IF NOT EXISTS terms_lookup ON lesson_terms(slug,taxonomy,lesson_id);
    CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY,lesson_id TEXT NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,payload TEXT NOT NULL);
    CREATE VIRTUAL TABLE IF NOT EXISTS lesson_search USING fts5(lesson_id UNINDEXED,title,speaker,category,body,tokenize='unicode61 remove_diacritics 2');
    CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,subject TEXT NOT NULL);
  `);
  connection = db;
  if (
    !(db.prepare("SELECT COUNT(*) AS n FROM lessons").get() as { n: number }).n
  ) {
    const seedPath = resolve(
      process.env.CATALOG_SEED_PATH || "content/catalog.json",
    );
    const seed = existsSync(seedPath)
      ? JSON.parse(readFileSync(seedPath, "utf8"))
      : {
          lessons: fallbackLessons,
          collections: fallbackCollections,
          teachers: fallbackTeachers,
          pages: [],
        };
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const c of seed.collections || [])
        db.prepare("INSERT OR REPLACE INTO collections VALUES (?,?)").run(
          c.slug,
          JSON.stringify(c),
        );
      for (const t of seed.teachers || fallbackTeachers)
        db.prepare("INSERT OR REPLACE INTO teachers VALUES (?,?)").run(
          t.slug,
          JSON.stringify(t),
        );
      for (const p of seed.pages || [])
        db.prepare("INSERT OR REPLACE INTO pages VALUES (?,?)").run(
          p.slug,
          JSON.stringify(p),
        );
      for (const l of seed.lessons) persistLesson(db, l);
      const manifest = resolve(
        process.env.MEDIA_MANIFEST_PATH ||
          resolve(dataDirectory, "import-media.json"),
      );
      if (existsSync(manifest)) {
        const source = JSON.parse(readFileSync(manifest, "utf8"));
        for (const m of Array.isArray(source) ? source : source.media || []) {
          if (db.prepare("SELECT id FROM lessons WHERE id=?").get(m.lessonId))
            db.prepare("INSERT OR REPLACE INTO media VALUES (?,?,?)").run(
              m.id,
              m.lessonId,
              JSON.stringify(m),
            );
        }
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      connection = undefined;
      db.close();
      throw e;
    }
  }
  return db;
}
function persistLesson(db: DatabaseSync, input: Lesson): Lesson {
  const l = {
    ...input,
    id: input.id || randomUUID(),
    status: input.status || "publish",
    publishedAt: input.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const existing = Boolean(
    db.prepare("SELECT id FROM lessons WHERE id=?").get(l.id),
  );
  db.prepare(
    "INSERT INTO lessons VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,speaker=excluded.speaker,collection=excluded.collection,format=excluded.format,status=excluded.status,published_at=excluded.published_at,payload=excluded.payload",
  ).run(
    l.id,
    l.slug,
    l.title,
    l.speaker,
    l.collection,
    l.format,
    l.status,
    l.publishedAt,
    JSON.stringify(l),
  );
  if (existing)
    db.prepare("DELETE FROM lesson_terms WHERE lesson_id=?").run(l.id);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO lesson_terms VALUES (?,?,?,?,?)",
  );
  for (const t of l.categories || [])
    insert.run(l.id, t.slug, t.title, t.taxonomy, t.id);
  if (existing)
    db.prepare("DELETE FROM lesson_search WHERE lesson_id=?").run(l.id);
  db.prepare("INSERT INTO lesson_search VALUES (?,?,?,?,?)").run(
    l.id,
    l.title,
    l.speaker,
    [l.collection, l.topic, ...(l.categories || []).map((t) => t.title)].join(
      " ",
    ),
    [l.description, l.bodyText, l.dedication].filter(Boolean).join(" "),
  );
  return l;
}
export function saveLesson(input: Lesson, media?: MediaRecord): Lesson {
  const db = getDb();
  if (!/^[\p{L}\p{M}\p{N}_%-]+$/u.test(input.slug) || input.slug.length > 240)
    throw Error("Use a valid, unique lesson slug");
  if (!input.title.trim() || input.title.length > 600)
    throw Error("Enter a lesson title");
  if (!["Audio", "Video"].includes(input.format))
    throw Error("Choose audio or video");
  if (input.access && !["public", "members", "legacy"].includes(input.access))
    throw Error("Choose a valid access policy");
  if (input.status && !["draft", "publish"].includes(input.status))
    throw Error("Choose a valid publication status");
  const old = getLesson(input.slug, { includeDrafts: true });
  if (old && old.id !== input.id) throw Error("A lesson already uses this URL");
  db.exec("BEGIN IMMEDIATE");
  try {
    const l = persistLesson(db, input);
    if (media) {
      const m = { ...media, lessonId: l.id!, access: l.access || "members" };
      db.prepare(
        "INSERT INTO media VALUES (?,?,?) ON CONFLICT(lesson_id) DO UPDATE SET id=excluded.id,payload=excluded.payload",
      ).run(m.id, l.id!, JSON.stringify(m));
    }
    if (!media) {
      const current = getMedia(l.id!);
      if (current) {
        const m = { ...current, access: l.access || current.access };
        db.prepare("UPDATE media SET payload=? WHERE lesson_id=?").run(
          JSON.stringify(m),
          l.id!,
        );
      }
    }
    db.exec("COMMIT");
    return l;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
function hydrateLesson(payload: string): Lesson {
  const lesson = JSON.parse(payload) as Lesson & { embedUrl?: string };
  if (lesson.access === "public" && !lesson.videoEmbedUrl && lesson.embedUrl) {
    lesson.videoEmbedUrl = lesson.embedUrl;
  }
  delete lesson.embedUrl;
  return lesson;
}
export function getLesson(
  slug: string,
  options: { includeDrafts?: boolean } = {},
): Lesson | undefined {
  const row = getDb()
    .prepare(
      `SELECT payload FROM lessons WHERE slug=? ${options.includeDrafts ? "" : "AND status='publish'"}`,
    )
    .get(slug) as { payload: string } | undefined;
  return row ? hydrateLesson(row.payload) : undefined;
}
/** Resolve a legacy URL by its original post type, not a possibly collided new slug. */
export function getLegacyLesson(
  slug: string,
  postType: "shiurim" | "videos",
): Lesson | undefined {
  const path = "/" + postType + "/" + encodeURIComponent(slug) + "/";
  const format = postType === "videos" ? "Video" : "Audio";
  const urls = [
    "https://www.breslovtorah.com" + path,
    "https://breslovtorah.com" + path,
  ];
  const row = getDb()
    .prepare(
      "SELECT payload FROM lessons WHERE status='publish' AND format=? AND json_extract(payload,'$.legacyUrl') IN (?,?) LIMIT 1",
    )
    .get(format, ...urls) as { payload: string } | undefined;
  if (row) return hydrateLesson(row.payload);
  const native = getLesson(slug);
  return native?.format === format ? native : undefined;
}
export function getLessonById(
  id: string,
  includeDrafts = false,
): Lesson | undefined {
  const row = getDb()
    .prepare(
      `SELECT payload FROM lessons WHERE id=? ${includeDrafts ? "" : "AND status='publish'"}`,
    )
    .get(id) as { payload: string } | undefined;
  return row ? hydrateLesson(row.payload) : undefined;
}
export function getMedia(id: string): MediaRecord | undefined {
  const row = getDb()
    .prepare("SELECT payload FROM media WHERE id=? OR lesson_id=?")
    .get(id, id) as { payload: string } | undefined;
  return row ? JSON.parse(row.payload) : undefined;
}
export function getCollections(): Collection[] {
  return (
    getDb().prepare("SELECT payload FROM collections ORDER BY slug").all() as {
      payload: string;
    }[]
  ).map((r) => {
    const c = JSON.parse(r.payload) as Collection & {
      hebrewTranslation?: string;
    };
    return { ...c, hebrewTitle: c.hebrewTitle || c.hebrewTranslation };
  });
}
export function getCollection(slug: string): Collection | undefined {
  return getCollections().find((c) => c.slug === slug);
}
export function getTeachers(): Teacher[] {
  return (
    getDb().prepare("SELECT payload FROM teachers").all() as {
      payload: string;
    }[]
  ).map((r) => JSON.parse(r.payload));
}
export function getPublicPages(): PublicPage[] {
  return (
    getDb().prepare("SELECT payload FROM pages ORDER BY slug").all() as {
      payload: string;
    }[]
  )
    .map((r) => JSON.parse(r.payload))
    .filter(
      (p) =>
        !/(?:^|[-])(team-management|error-message|new-courses-page|wishlist-member|log-in|free-registration|membership-cancelled|oops-wrong-membership-level|welcome-new-member|this-content-is-for-premium-members-only|thank-you)(?:$|[-])/.test(
          p.slug,
        ),
    );
}
export type SearchQuery = {
  q?: string;
  page?: number | string;
  pageSize?: number;
  teacher?: string;
  category?: string;
  collection?: string;
  topic?: string;
  format?: string;
  sort?: string;
  includeDrafts?: boolean;
};
export function getLessons(query: SearchQuery = {}) {
  const db = getDb();
  const params: (string | number)[] = [];
  const where: string[] = [];
  let search = false;
  if (!query.includeDrafts) where.push("l.status='publish'");
  const words =
    (query.q || "")
      .slice(0, 200)
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .match(/[\p{L}\p{N}]+/gu) || [];
  if (words.length) {
    search = true;
    where.push("lesson_search MATCH ?");
    params.push(
      words
        .slice(0, 12)
        .map((w) => `"${w}"*`)
        .join(" AND "),
    );
  }
  if (query.teacher) {
    where.push("l.speaker=?");
    params.push(query.teacher);
  }
  if (query.format && ["Audio", "Video"].includes(query.format)) {
    where.push("l.format=?");
    params.push(query.format);
  }
  const category = query.category || query.collection;
  if (category) {
    const collection = getCollection(category);
    const cs = getCollections();
    const ids = new Set<number>();
    if (collection?.sourceId) ids.add(collection.sourceId);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of cs)
        if (
          c.sourceId &&
          c.parentId &&
          ids.has(c.parentId) &&
          !ids.has(c.sourceId)
        ) {
          ids.add(c.sourceId);
          changed = true;
        }
    }
    if (ids.size) {
      where.push(
        `EXISTS(SELECT 1 FROM lesson_terms t WHERE t.lesson_id=l.id AND t.term_id IN (${[...ids].map(() => "?").join(",")}))`,
      );
      params.push(...ids);
    } else {
      where.push(
        "(l.collection=? OR EXISTS(SELECT 1 FROM lesson_terms t WHERE t.lesson_id=l.id AND t.slug=?))",
      );
      params.push(collection?.title || category, category);
    }
  }
  if (query.topic) {
    where.push(
      "EXISTS(SELECT 1 FROM lesson_terms t WHERE t.lesson_id=l.id AND (t.slug=? OR t.title=?))",
    );
    params.push(query.topic, query.topic);
  }
  const from = `FROM lessons l ${search ? "JOIN lesson_search ON lesson_search.lesson_id=l.id" : ""} ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const total = Number(
    (db.prepare(`SELECT COUNT(*) n ${from}`).get(...params) as { n: number }).n,
  );
  const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
  const page = Math.min(
    Math.max(1, parseInt(String(query.page || 1)) || 1),
    Math.max(1, Math.ceil(total / pageSize)),
  );
  const order =
    query.sort === "title"
      ? "l.title COLLATE NOCASE"
      : query.sort === "oldest"
        ? "l.published_at ASC,l.id ASC"
        : search &&
            (!query.sort ||
              query.sort === "relevance" ||
              query.sort === "default")
          ? "bm25(lesson_search,0,6,2,3,1),l.published_at DESC"
          : "l.published_at DESC,l.id DESC";
  const items = (
    db
      .prepare(`SELECT l.payload ${from} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .all(...params, pageSize, (page - 1) * pageSize) as { payload: string }[]
  ).map((r) =>
    (() => {
      const l = hydrateLesson(r.payload);
      if (!query.includeDrafts && l.access !== "public") delete l.videoEmbedUrl;
      return l;
    })(),
  );
  const teachers = (
    db
      .prepare(
        "SELECT DISTINCT speaker FROM lessons WHERE status='publish' ORDER BY speaker",
      )
      .all() as { speaker: string }[]
  ).map((r) => r.speaker);
  const topics = (
    db
      .prepare(
        "SELECT title,COUNT(*) n FROM lesson_terms WHERE taxonomy IN ('parshios','parshas','post_tag') GROUP BY title ORDER BY n DESC LIMIT 80",
      )
      .all() as { title: string }[]
  ).map((r) => r.title);
  return {
    items,
    total,
    page,
    pageSize,
    facets: { teachers, collections: getCollections(), topics },
  };
}
export function catalogStats() {
  const db = getDb();
  return {
    lessons: Number(
      (
        db
          .prepare("SELECT COUNT(*) n FROM lessons WHERE status='publish'")
          .get() as { n: number }
      ).n,
    ),
    drafts: Number(
      (
        db
          .prepare("SELECT COUNT(*) n FROM lessons WHERE status='draft'")
          .get() as { n: number }
      ).n,
    ),
    collections: getCollections().length,
    teachers: getTeachers().length,
  };
}
export function logAudit(actor: string, action: string, subject: string) {
  getDb()
    .prepare("INSERT INTO audit_log(at,actor,action,subject) VALUES (?,?,?,?)")
    .run(new Date().toISOString(), actor, action, subject);
}
export function saveCollection(c: Collection): Collection {
  if (!/^[\p{L}\p{M}\p{N}_%-]+$/u.test(c.slug) || !c.title.trim())
    throw Error("Enter a valid collection title and slug");
  const db = getDb();
  const old = getCollection(c.slug);
  const max = getCollections().reduce(
    (n, c) => Math.max(n, c.sourceId || 0),
    0,
  );
  const saved = {
    ...old,
    ...c,
    sourceId: old?.sourceId || c.sourceId || max + 1,
    parentId: c.parentId || 0,
    taxonomy: c.taxonomy || "courses",
    image: c.image || "/images/logo.png",
    legacyUrl: c.legacyUrl || "",
  };
  if (saved.parentId === saved.sourceId)
    throw Error("A collection cannot be its own parent");
  let parent = getCollections().find((p) => p.sourceId === saved.parentId);
  const seen = new Set<number>();
  while (parent) {
    if (parent.sourceId === saved.sourceId || seen.has(parent.sourceId!))
      throw Error("Collection hierarchy cannot contain a cycle");
    seen.add(parent.sourceId!);
    parent = getCollections().find((p) => p.sourceId === parent?.parentId);
  }
  db.prepare("INSERT OR REPLACE INTO collections VALUES(?,?)").run(
    saved.slug,
    JSON.stringify(saved),
  );
  return saved;
}
export function saveTeacher(t: Teacher): Teacher {
  if (!/^[\p{L}\p{M}\p{N}_%-]+$/u.test(t.slug) || !t.name.trim())
    throw Error("Enter a valid teacher name and slug");
  if (!t.image.startsWith("/images/")) throw Error("Use a local teacher image");
  getDb()
    .prepare("INSERT OR REPLACE INTO teachers VALUES(?,?)")
    .run(t.slug, JSON.stringify(t));
  return t;
}
