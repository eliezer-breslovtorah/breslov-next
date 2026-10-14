import "server-only";
import { getCollections, getDb } from "./store";
import type { Collection, Lesson } from "./content";
import { publicLessonSql } from "./lesson-visibility";
import { lessonSequenceKey } from "./lesson-order";
import {
  getLessonPass,
  lessonPassLabel,
  LESSON_PASS_COLLECTIONS,
} from "./lesson-pass";

// Use explicit course/series membership, never topic tags or the speaker name.
// Calendar, audience and language groupings are browsing categories, not sequences.
const browsingCourses = new Set([
  "courses-calendar",
  "courses-women",
  "courses-hebrew-and-yiddish",
  "courses-music",
]);
export function getLessonSeries(
  lesson: Lesson,
  requestedPage?: string,
  order: "sequence" | "oldest" = "oldest",
  requestedCollectionSlug?: string,
) {
  const collections = getCollections();
  const memberships = new Set(
    (lesson.categories || [])
      .filter((t) => t.taxonomy === "series" || t.taxonomy === "courses")
      .map((t) => t.id),
  );
  const candidates = collections.filter(
    (c) =>
      c.sourceId &&
      memberships.has(c.sourceId) &&
      (c.taxonomy === "series" ||
        (c.taxonomy === "courses" &&
          c.parentId !== 352 &&
          !browsingCourses.has(c.slug))),
  );
  const specific = candidates.filter(
    (c) => !candidates.some((child) => child.parentId === c.sourceId),
  );
  specific.sort(
    (a, b) =>
      Number(b.taxonomy === "series") - Number(a.taxonomy === "series") ||
      (a.count || 0) - (b.count || 0) ||
      a.slug.localeCompare(b.slug),
  );
  const db = getDb();
  const pass = getLessonPass(lesson);
  const sortKey =
    order === "sequence" ? "lesson_sequence(l.title)" : "l.published_at";
  const currentKey =
    order === "sequence" ? lessonSequenceKey(lesson) : lesson.publishedAt || "";
  type Scope = {
    collection: Collection;
    from: string;
    values: (string | number)[];
    virtualPass: boolean;
    contextSlug?: string;
  };
  const scopes: Scope[] = [];
  const requested = collections.find(
    (collection) =>
      collection.slug === requestedCollectionSlug &&
      (collection.taxonomy === "series" || collection.taxonomy === "courses"),
  );
  if (requested) {
    const group = LESSON_PASS_COLLECTIONS.find(
      (item) => item.slug === requested.slug,
    );
    let condition = "";
    const values: (string | number)[] = [];
    if (group) {
      // Virtual pass collections cover every matching chapter, not one imported term.
      condition = "lesson_pass(l.payload)=?";
      values.push(group.pass);
    } else if (requested.sourceId) {
      const ids = new Set([requested.sourceId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const collection of collections) {
          if (
            collection.sourceId &&
            collection.parentId &&
            ids.has(collection.parentId) &&
            !ids.has(collection.sourceId)
          ) {
            ids.add(collection.sourceId);
            changed = true;
          }
        }
      }
      condition = `EXISTS(SELECT 1 FROM lesson_terms t WHERE t.lesson_id=l.id AND t.term_id IN (${[...ids].map(() => "?").join(",")}))`;
      values.push(...ids);
      if (pass) {
        condition += " AND lesson_pass(l.payload)=?";
        values.push(pass);
      }
    } else {
      condition =
        "(l.collection=? OR EXISTS(SELECT 1 FROM lesson_terms t WHERE t.lesson_id=l.id AND t.slug=?))";
      values.push(requested.title, requested.slug);
    }
    const from = `FROM lessons l WHERE ${publicLessonSql()} AND ${condition}`;
    // The URL is navigation context, never permission to link unrelated lessons.
    const containsCurrent = db
      .prepare(`SELECT 1 ${from} AND l.id=? LIMIT 1`)
      .get(...values, lesson.id || "");
    if (containsCurrent)
      scopes.push({
        collection: requested,
        from,
        values,
        virtualPass: Boolean(group),
        contextSlug: requested.slug,
      });
  }
  for (const collection of specific) {
    const from = `FROM lessons l WHERE ${publicLessonSql()} AND EXISTS(SELECT 1 FROM lesson_terms t WHERE t.lesson_id=l.id AND t.term_id=? AND t.taxonomy=?) ${pass ? "AND lesson_pass(l.payload)=?" : ""}`;
    const values: (string | number)[] = [
      collection.sourceId!,
      collection.taxonomy!,
    ];
    if (pass) values.push(pass);
    scopes.push({ collection, from, values, virtualPass: false });
  }
  for (const { collection, from, values, virtualPass, contextSlug } of scopes) {
    const total = Number(
      (db.prepare(`SELECT COUNT(*) n ${from}`).get(...values) as { n: number })
        .n,
    );
    if (total < 2) continue;
    const currentPosition = Number(
      (
        db
          .prepare(
            `SELECT COUNT(*) n ${from} AND (${sortKey} < ? OR (${sortKey}=? AND l.id<=?))`,
          )
          .get(...values, currentKey, currentKey, lesson.id || "") as {
          n: number;
        }
      ).n,
    );
    const pageSize = 20;
    const pages = Math.ceil(total / pageSize);
    const currentPage = Math.max(1, Math.ceil(currentPosition / pageSize));
    const parsed = Number(requestedPage);
    const page =
      requestedPage && Number.isSafeInteger(parsed) && parsed > 0
        ? Math.min(parsed, pages)
        : currentPage;
    // Select only display metadata: protected playback URLs never enter this list.
    const items = db
      .prepare(
        `SELECT l.slug,l.title,l.speaker,l.format,json_extract(l.payload,'$.duration') duration ${from} ORDER BY ${sortKey} ASC,l.id ASC LIMIT ? OFFSET ?`,
      )
      .all(...values, pageSize, (page - 1) * pageSize) as {
      slug: string;
      title: string;
      speaker: string;
      format: string;
      duration: string | null;
    }[];
    const neighbor = (direction: "previous" | "next") => {
      const operator = direction === "previous" ? "<" : ">";
      const order = direction === "previous" ? "DESC" : "ASC";
      return db
        .prepare(
          `SELECT l.slug,l.title ${from} AND (${sortKey} ${operator} ? OR (${sortKey}=? AND l.id ${operator} ?)) ORDER BY ${sortKey} ${order},l.id ${order} LIMIT 1`,
        )
        .get(...values, currentKey, currentKey, lesson.id || "") as
        { slug: string; title: string } | undefined;
    };
    return {
      collection:
        pass && !virtualPass
          ? {
              ...collection,
              title: `${collection.title} · ${lessonPassLabel(pass)}`,
            }
          : collection,
      order,
      contextSlug,
      total,
      page,
      pages,
      pageSize,
      currentPage,
      items,
      previous: neighbor("previous"),
      next: neighbor("next"),
    };
  }
  return undefined;
}
