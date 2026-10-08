import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
  unlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMediaWatcher } from "../scripts/lib/media-watch.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "breslov-media-watch-"));
  const dataDirectory = join(root, "data");
  const mediaRoot = join(root, "originals");
  const watchDirectory = join(mediaRoot, "media");
  await mkdir(dataDirectory);
  await mkdir(watchDirectory, { recursive: true });
  const db = new DatabaseSync(join(dataDirectory, "breslov.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE lessons(id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,title TEXT NOT NULL,speaker TEXT NOT NULL,collection TEXT NOT NULL,format TEXT NOT NULL,status TEXT NOT NULL,published_at TEXT NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE collections(slug TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE teachers(slug TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE pages(slug TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE lesson_terms(lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,slug TEXT NOT NULL,title TEXT NOT NULL,taxonomy TEXT NOT NULL,term_id INTEGER NOT NULL,PRIMARY KEY(lesson_id,taxonomy,term_id));
    CREATE TABLE media(id TEXT PRIMARY KEY,lesson_id TEXT NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,payload TEXT NOT NULL);
    CREATE VIRTUAL TABLE lesson_search USING fts5(lesson_id UNINDEXED,title,speaker,category,body,tokenize='unicode61 remove_diacritics 2');
    CREATE TABLE audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,subject TEXT NOT NULL);`);
  let clock = Date.now();
  let watcher;
  const options = {
    dataDirectory,
    mediaRoot,
    watchDirectory,
    stableMs: 1000,
    now: () => clock,
    logger: () => {},
  };
  const start = async (overrides = {}) => {
    watcher = await createMediaWatcher({ ...options, ...overrides });
    return watcher;
  };
  t.after(async () => {
    await watcher?.close();
    db.close();
    await rm(root, { recursive: true, force: true });
  });
  return {
    root,
    db,
    mediaRoot,
    watchDirectory,
    start,
    advance: (ms = 2000) => {
      clock += ms;
    },
    file: (name) => join(watchDirectory, name),
    lessons: () => db.prepare("SELECT * FROM lessons").all(),
  };
}

test("baseline ignores existing recordings; stable new recording is searchable and retains original bytes", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("old-recording.mp3"), "existing recording");
  const watcher = await f.start();
  await watcher.scan();
  f.advance();
  await watcher.scan();
  assert.equal(f.lessons().length, 0);
  await mkdir(f.file("new-series"));
  const path = f.file("new-series/01-Meaningful_Lesson.mp3");
  const bytes = Buffer.from("new original media bytes");
  await writeFile(path, bytes);
  await watcher.scan();
  assert.equal(
    f.lessons().length,
    0,
    "first sighting cannot publish an incomplete upload",
  );
  f.advance();
  await watcher.scan();
  const [row] = f.lessons();
  assert.ok(row);
  const lesson = JSON.parse(row.payload);
  assert.equal(row.status, "publish");
  assert.equal(row.format, "Audio");
  assert.equal(lesson.access, "members");
  assert.match(row.id, /^[a-f0-9-]{36}$/);
  const media = JSON.parse(
    f.db.prepare("SELECT payload FROM media WHERE lesson_id=?").get(row.id)
      .payload,
  );
  assert.equal(media.kind, "original");
  assert.equal(media.path, "media/new-series/01-Meaningful_Lesson.mp3");
  assert.equal(media.lessonId, row.id);
  assert.equal(media.access, "members");
  assert.deepEqual(await readFile(path), bytes);
  assert.equal(
    f.db
      .prepare(
        "SELECT count(*) AS n FROM lesson_search WHERE lesson_search MATCH 'Meaningful'",
      )
      .get().n,
    1,
  );
  await watcher.scan();
  assert.equal(f.lessons().length, 1);
});

test("growing upload restarts stability interval and zero-byte files are ignored", async (t) => {
  const f = await fixture(t);
  const watcher = await f.start();
  await watcher.scan();
  await writeFile(f.file("growing.mp4"), "first chunk");
  await writeFile(f.file("empty.mp3"), "");
  await watcher.scan();
  f.advance();
  await writeFile(f.file("growing.mp4"), "first chunk plus second chunk");
  await watcher.scan();
  assert.equal(f.lessons().length, 0);
  f.advance();
  await watcher.scan();
  assert.equal(f.lessons().length, 1);
  assert.equal(f.lessons()[0].format, "Video");
});

test("restart keeps baseline and imports an upload discovered while stopped exactly once", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("old.mp3"), "old bytes");
  let watcher = await f.start();
  await watcher.scan();
  await watcher.close();
  await writeFile(f.file("during-stop.ogg"), "new bytes");
  watcher = await f.start();
  await watcher.scan();
  f.advance();
  await watcher.scan();
  assert.equal(f.lessons().length, 1);
  await watcher.close();
  watcher = await f.start();
  await watcher.scan();
  f.advance();
  await watcher.scan();
  assert.equal(f.lessons().length, 1);
});

test("published metadata survives rescans, changes to originals, deletion, and replacement", async (t) => {
  const f = await fixture(t);
  const watcher = await f.start();
  await watcher.scan();
  await writeFile(f.file("editable.m4a"), "first bytes");
  await watcher.scan();
  f.advance();
  await watcher.scan();
  const row = f.lessons()[0];
  const edited = {
    ...JSON.parse(row.payload),
    title: "Staff edited title",
    status: "draft",
    description: "Carefully reviewed description",
  };
  f.db
    .prepare("UPDATE lessons SET title=?,status=?,payload=? WHERE id=?")
    .run(edited.title, "draft", JSON.stringify(edited), row.id);
  await writeFile(f.file("editable.m4a"), "replacement bytes");
  await watcher.scan();
  f.advance();
  await watcher.scan();
  await unlink(f.file("editable.m4a"));
  await watcher.scan();
  await writeFile(f.file("editable.m4a"), "recreated bytes");
  await watcher.scan();
  f.advance();
  await watcher.scan();
  assert.equal(f.lessons().length, 1);
  assert.deepEqual(JSON.parse(f.lessons()[0].payload), edited);
});

test("unsupported files and symlinks never become lessons", async (t) => {
  const f = await fixture(t);
  const watcher = await f.start();
  await watcher.scan();
  await writeFile(f.file("readme.txt"), "not media");
  await writeFile(join(f.root, "outside.mp3"), "outside");
  await symlink(join(f.root, "outside.mp3"), f.file("outside-link.mp3"));
  await writeFile(f.file("real.mp3"), "real");
  await symlink(f.file("real.mp3"), f.file("inside-link.mp3"));
  await symlink(f.watchDirectory, f.file("loop"));
  await watcher.scan();
  f.advance();
  await watcher.scan();
  assert.equal(f.lessons().length, 1);
  const media = JSON.parse(
    f.db.prepare("SELECT payload FROM media").get().payload,
  );
  assert.equal(media.path, "media/real.mp3");
});

test("recording already registered by another publishing workflow is not duplicated", async (t) => {
  const f = await fixture(t);
  const watcher = await f.start();
  await watcher.scan();
  const lesson = {
    id: "existing",
    slug: "existing",
    title: "Existing",
    speaker: "",
    collection: "",
    format: "Audio",
    status: "publish",
    publishedAt: new Date().toISOString(),
    access: "public",
  };
  f.db
    .prepare("INSERT INTO lessons VALUES(?,?,?,?,?,?,?,?,?)")
    .run(
      lesson.id,
      lesson.slug,
      lesson.title,
      "",
      "",
      "Audio",
      "publish",
      lesson.publishedAt,
      JSON.stringify(lesson),
    );
  const media = {
    id: "existing",
    lessonId: lesson.id,
    kind: "original",
    path: "media/already-registered.flac",
    mime: "audio/flac",
    access: "public",
    filename: "already-registered.flac",
  };
  f.db
    .prepare("INSERT INTO media VALUES(?,?,?)")
    .run(media.id, lesson.id, JSON.stringify(media));
  await writeFile(f.file("already-registered.flac"), "original bytes");
  await watcher.scan();
  f.advance();
  await watcher.scan();
  assert.equal(f.lessons().length, 1);
  assert.deepEqual(
    JSON.parse(f.db.prepare("SELECT payload FROM media").get().payload),
    media,
  );
});

test("all supported formats publish with unique slugs even when filenames normalize alike", async (t) => {
  const f = await fixture(t);
  const watcher = await f.start();
  await watcher.scan();
  const audio = ["mp3", "m4a", "ogg", "wav", "flac", "aac"];
  const video = ["mp4", "webm", "mov", "m4v"];
  for (const extension of [...audio, ...video])
    await writeFile(f.file(`same-lesson.${extension}`), "bytes");
  await watcher.scan();
  f.advance();
  await watcher.scan();
  const lessons = f.lessons();
  assert.equal(lessons.length, audio.length + video.length);
  assert.equal(
    new Set(lessons.map((lesson) => lesson.slug)).size,
    lessons.length,
  );
  assert.equal(
    lessons.filter((lesson) => lesson.format === "Audio").length,
    audio.length,
  );
  assert.equal(
    lessons.filter((lesson) => lesson.format === "Video").length,
    video.length,
  );
  assert.ok(
    lessons.every(
      (lesson) =>
        /^[\p{L}\p{M}\p{N}_%-]+$/u.test(lesson.slug) &&
        lesson.slug.length <= 240,
    ),
  );
});

test("directory rules map new recordings to an existing collection, teacher, and access policy", async (t) => {
  const f = await fixture(t);
  const collection = {
    slug: "existing-course",
    title: "Existing course",
    sourceId: 123,
    taxonomy: "courses",
    parentId: 0,
  };
  f.db
    .prepare("INSERT INTO collections VALUES(?,?)")
    .run(collection.slug, JSON.stringify(collection));
  const watcher = await f.start({
    rules: [
      {
        prefix: "curated",
        speaker: "Configured teacher",
        collectionSlug: collection.slug,
        access: "public",
      },
    ],
  });
  await watcher.scan();
  await mkdir(f.file("curated"));
  await mkdir(f.file("curated-extra"));
  await writeFile(f.file("curated/New lesson.mp3"), "bytes");
  await writeFile(f.file("curated-extra/Other lesson.mp3"), "bytes");
  await watcher.scan();
  f.advance();
  await watcher.scan();
  const selected = f.lessons().find((lesson) => lesson.title === "New lesson");
  const other = f.lessons().find((lesson) => lesson.title === "Other lesson");
  assert.equal(selected.speaker, "Configured teacher");
  const payload = JSON.parse(selected.payload);
  assert.equal(payload.collection, "Existing course");
  assert.equal(payload.access, "public");
  assert.deepEqual(payload.collectionSlugs, ["existing-course"]);
  assert.equal(
    JSON.parse(other.payload).access,
    "members",
    "prefix must match a complete directory component",
  );
  assert.equal(
    f.db
      .prepare("SELECT slug FROM lesson_terms WHERE lesson_id=?")
      .get(selected.id).slug,
    "existing-course",
  );
});

test("watch directory outside configured media root is rejected", async (t) => {
  const f = await fixture(t);
  await mkdir(join(f.root, "outside"));
  await assert.rejects(
    f.start({ watchDirectory: join(f.root, "outside") }),
    /inside MEDIA_ROOT/,
  );
});

test("two watcher instances share durable upload state and publish one lesson", async (t) => {
  const f = await fixture(t);
  const first = await f.start();
  await first.scan();
  const second = await f.start();
  t.after(() => first.close());
  await writeFile(f.file("shared.mp3"), "shared bytes");
  await first.scan();
  await second.scan();
  f.advance();
  await Promise.all([first.scan(), second.scan()]);
  assert.equal(f.lessons().length, 1);
  assert.equal(f.db.prepare("SELECT count(*) AS n FROM media").get().n, 1);
});
