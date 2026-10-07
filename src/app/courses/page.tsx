import Link from "next/link";
import { BookOpen, ArrowRight, Search } from "lucide-react";
import { getCollections } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = { title: "Courses and series" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const { q = "", type = "", page: requestedPage = "1" } = await searchParams;
  const all = getCollections();
  const collections = all.filter(
    (item) =>
      (!type || item.taxonomy === type) &&
      (!q ||
        `${item.title} ${item.description} ${item.hebrewTitle || ""}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  const pageSize = 36;
  const pages = Math.max(1, Math.ceil(collections.length / pageSize));
  const page = Math.min(pages, Math.max(1, parseInt(requestedPage, 10) || 1));
  function pageUrl(next: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (next > 1) params.set("page", String(next));
    return `/courses${params.size ? `?${params}` : ""}`;
  }
  const labels: Record<string, string> = {
    courses: "Courses",
    series: "Text series",
    parshios: "Parsha",
    parshas: "Video parsha",
    types: "Video topics",
  };
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">ONE LESSON AT A TIME</p>
        <h1>Courses &amp; series</h1>
        <p>Build a deeper understanding through a focused path of learning.</p>
      </header>
      <form className="collection-search" method="get">
        <Search size={20} />
        <label className="sr-only" htmlFor="course-query">
          Find a course or series
        </label>
        <input
          id="course-query"
          name="q"
          defaultValue={q}
          placeholder="Find a course or series…"
        />
        <label className="sr-only" htmlFor="course-type">
          Collection type
        </label>
        <select id="course-type" name="type" defaultValue={type}>
          <option value="">All collections</option>
          {Array.from(
            new Set(all.map((item) => item.taxonomy).filter(Boolean)),
          ).map((value) => (
            <option key={value} value={value}>
              {labels[value!] || value}
            </option>
          ))}
        </select>
        <button className="button">Search</button>
      </form>
      <p className="collection-count">
        {collections.length.toLocaleString()} collections
      </p>
      {collections.length ? (
        <div className="collection-grid">
          {collections
            .slice((page - 1) * pageSize, page * pageSize)
            .map((item, index) => (
              <Link
                className={`collection-card collection-${index % 3}`}
                key={item.slug}
                href={`/courses/${encodeURIComponent(item.slug)}`}
              >
                <BookOpen size={28} />
                <span className="collection-kind">
                  {labels[item.taxonomy || ""] || "Collection"}
                </span>
                <h2>{item.title}</h2>
                {item.hebrewTitle && (
                  <p lang="he" dir="rtl">
                    {item.hebrewTitle}
                  </p>
                )}
                <p>
                  {item.description ||
                    "Explore the lessons in this collection."}
                </p>
                <span>
                  {typeof item.count === "number"
                    ? `${item.count.toLocaleString()} lessons`
                    : "Explore collection"}
                  <ArrowRight size={18} />
                </span>
              </Link>
            ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No collections found</h2>
          <Link className="button" href="/courses">
            Show all collections
          </Link>
        </div>
      )}
      {pages > 1 && (
        <nav
          className="pagination collection-pagination"
          aria-label="Collection pages"
        >
          {page > 1 ? (
            <Link href={pageUrl(page - 1)} rel="prev">
              ← Previous
            </Link>
          ) : (
            <span className="pagination-disabled" aria-disabled="true">
              ← Previous
            </span>
          )}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageUrl(page + 1)} rel="next">
              Next →
            </Link>
          ) : (
            <span className="pagination-disabled" aria-disabled="true">
              Next →
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
