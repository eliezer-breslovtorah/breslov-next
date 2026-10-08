import "server-only";
import { getCollections, getDb } from "./store";
import type { Lesson } from "./content";

// Use explicit course/series membership, never topic tags or the speaker name.
// Calendar, audience and language groupings are browsing categories, not sequences.
const browsingCourses = new Set([
  "courses-calendar",
  "courses-women",
  "courses-hebrew-and-yiddish",
  "courses-music",
]);
export function getLessonSeries(lesson: Lesson, requestedPage?: string) {
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
  for (const collection of specific) {
    const from = `FROM lessons l WHERE l.status='publish' AND EXISTS(SELECT 1 FROM lesson_terms t WHERE t.lesson_id=l.id AND t.term_id=? AND t.taxonomy=?)`;
    const values = [collection.sourceId!, collection.taxonomy!] as const;
    const total = Number(
      (db.prepare(`SELECT COUNT(*) n ${from}`).get(...values) as { n: number })
        .n,
    );
    if (total < 2) continue;
    const currentPosition = Number(
      (
        db
          .prepare(
            `SELECT COUNT(*) n ${from} AND (l.published_at < ? OR (l.published_at=? AND l.id<=?))`,
          )
          .get(
            ...values,
            lesson.publishedAt || "",
            lesson.publishedAt || "",
            lesson.id || "",
          ) as { n: number }
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
        `SELECT l.slug,l.title,l.speaker,l.format,json_extract(l.payload,'$.duration') duration ${from} ORDER BY l.published_at ASC,l.id ASC LIMIT ? OFFSET ?`,
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
          `SELECT l.slug,l.title ${from} AND (l.published_at ${operator} ? OR (l.published_at=? AND l.id ${operator} ?)) ORDER BY l.published_at ${order},l.id ${order} LIMIT 1`,
        )
        .get(
          ...values,
          lesson.publishedAt || "",
          lesson.publishedAt || "",
          lesson.id || "",
        ) as { slug: string; title: string } | undefined;
    };
    return {
      collection,
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
