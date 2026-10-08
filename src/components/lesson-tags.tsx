import Link from "next/link";
import type { TermRef } from "@/lib/content";
import "@/app/lesson-tags.css";

const visibleTagCount = 4;

/** Keep every distinct category available, with course/series context first. */
export function LessonTags({ categories = [] }: { categories?: TermRef[] }) {
  const seenSlugs = new Set<string>();
  const seenTitles = new Set<string>();
  const tags = categories
    .filter((tag) => {
      const slug = tag.slug.trim().toLowerCase();
      const title = tag.title.trim().normalize("NFKC").toLowerCase();
      if (
        tag.taxonomy === "authors" ||
        !slug ||
        !title ||
        seenSlugs.has(slug) ||
        seenTitles.has(title)
      ) {
        return false;
      }
      seenSlugs.add(slug);
      seenTitles.add(title);
      return true;
    })
    .sort(
      (a, b) =>
        Number(a.taxonomy === "post_tag") - Number(b.taxonomy === "post_tag"),
    );
  if (!tags.length) return null;
  const renderTag = (tag: TermRef) => (
    <Link
      className="lesson-tag-link"
      key={`${tag.taxonomy}-${tag.id}`}
      href={`/library?category=${encodeURIComponent(tag.slug)}`}
      prefetch={false}
    >
      {tag.title.trim()}
    </Link>
  );
  const remaining = tags.slice(visibleTagCount);
  return (
    <nav className="lesson-tags" aria-label="Lesson topics and categories">
      <div className="lesson-tags-preview">
        {tags.slice(0, visibleTagCount).map(renderTag)}
      </div>
      {remaining.length > 0 && (
        <details className="lesson-tags-more">
          <summary>
            <span className="lesson-tags-expand">
              +{remaining.length} more tags
            </span>
            <span className="lesson-tags-collapse">Show fewer tags</span>
          </summary>
          <div className="lesson-tags-expanded">{remaining.map(renderTag)}</div>
        </details>
      )}
    </nav>
  );
}
