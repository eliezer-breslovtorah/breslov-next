import "server-only";
import { getDb } from "./store";
const registered = new WeakSet<object>();
const normalize = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
export function autocompleteTags(query: string) {
  const words =
    normalize(query.trim().slice(0, 200))
      .match(/[\p{L}\p{N}]+/gu)
      ?.slice(0, 12) || [];
  if (query.trim().length < 2 || !words.length) return [];
  const db = getDb();
  if (!registered.has(db)) {
    db.function("normalize_tag", { deterministic: true }, (value) =>
      normalize(String(value || "")),
    );
    registered.add(db);
  }
  const where = words
    .map(() => "instr(normalize_tag(t.title || ' ' || t.slug), ?) > 0")
    .join(" AND ");
  return db
    .prepare(
      `SELECT t.slug, MIN(t.title) AS title, COUNT(DISTINCT t.lesson_id) AS count
    FROM lesson_terms t JOIN lessons l ON l.id=t.lesson_id
    WHERE t.taxonomy='post_tag' AND l.status='publish' AND ${where}
    GROUP BY t.slug ORDER BY count DESC, title COLLATE NOCASE LIMIT 20`,
    )
    .all(...words) as { slug: string; title: string; count: number }[];
}
