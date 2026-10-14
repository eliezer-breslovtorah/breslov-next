import { LearningConnection } from "@/components/learning-connection";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Search,
  CalendarDays,
  Heart,
} from "lucide-react";
import { getCollections } from "@/lib/catalog";
import {
  courseGroups,
  courseGroupFor,
  courseCollectionLabel,
  type CourseFamily,
  type CourseGroup,
} from "@/lib/course-organization";
import "@/app/course-directory.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Courses and series" };
const legacyLabels: Record<string, string> = {
  courses: "Themed courses",
  series: "Text series",
  parshios: "Weekly Torah",
  parshas: "Weekly Torah videos",
  types: "Video subjects",
};
function FamilyCard({
  family,
  group,
}: {
  family: CourseFamily;
  group: CourseGroup;
}) {
  const first = family.items[0];
  const Icon =
    group.id === "calendar"
      ? CalendarDays
      : group.id === "topics"
        ? Heart
        : BookOpen;
  return (
    <article className="course-family-card">
      <Icon size={24} aria-hidden="true" />
      <h3>
        <Link
          href={`/courses/${encodeURIComponent(first.slug)}`}
          prefetch={false}
        >
          {family.title}
        </Link>
      </h3>
      <p>{family.description}</p>
      <ul aria-label={`${family.title} collections`}>
        {family.items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/courses/${encodeURIComponent(item.slug)}`}
              prefetch={false}
            >
              {courseCollectionLabel(item)}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    group?: string;
    page?: string;
  }>;
}) {
  const {
    q = "",
    type = "",
    group = "",
    page: requestedPage = "1",
  } = await searchParams;
  const all = getCollections();
  const groups = courseGroups(all);
  const selected = groups.find((item) => item.id === group);
  const directory = group === "all" || Boolean(q || type);
  const overview = !directory && !selected;
  const raw = all.filter(
    (item) =>
      (!type || item.taxonomy === type) &&
      (!selected || courseGroupFor(item, all) === selected.id) &&
      (!q ||
        `${item.title} ${item.description} ${item.hebrewTitle || ""}`
          .toLocaleLowerCase()
          .includes(q.toLocaleLowerCase())),
  );
  const pageSize = 36;
  const pages = Math.max(1, Math.ceil(raw.length / pageSize));
  const page = Math.min(pages, Math.max(1, parseInt(requestedPage, 10) || 1));
  function pageUrl(next: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (group) params.set("group", group);
    else params.set("group", "all");
    if (next > 1) params.set("page", String(next));
    return `/courses?${params}`;
  }
  const primary = groups.filter((item) =>
    ["texts", "calendar", "topics"].includes(item.id),
  );
  const visibleGroups = selected ? [selected] : primary;
  return (
    <div className="page-wrap course-directory">
      <header className="page-heading">
        <p className="eyebrow">ONE LESSON AT A TIME</p>
        <h1>Courses &amp; series</h1>
        <p>
          Learn a Breslov text, prepare for the Jewish calendar, or explore a
          subject that speaks to you.
        </p>
      </header>
      <nav className="course-category-nav" aria-label="Course categories">
        <Link href="/courses" aria-current={overview ? "page" : undefined}>
          Overview
        </Link>
        {primary.map((item) => (
          <Link
            key={item.id}
            href={`/courses?group=${item.id}`}
            aria-current={selected?.id === item.id ? "page" : undefined}
          >
            {
              {
                texts: "Breslov texts",
                calendar: "Jewish calendar",
                topics: "Life topics",
              }[item.id as "texts" | "calendar" | "topics"]
            }
          </Link>
        ))}
        <Link
          href="/courses?group=all"
          aria-current={directory && !selected ? "page" : undefined}
        >
          All collections
        </Link>
      </nav>
      <form className="collection-search" method="get">
        <Search size={20} aria-hidden="true" />
        <label className="sr-only" htmlFor="course-query">
          Find a course or series
        </label>
        <input
          id="course-query"
          name="q"
          defaultValue={q}
          placeholder="Find a text, holiday, or subject…"
        />
        <input type="hidden" name="group" value={selected?.id || "all"} />
        {directory && (
          <>
            <label className="sr-only" htmlFor="course-type">
              Collection type
            </label>
            <select id="course-type" name="type" defaultValue={type}>
              <option value="">All collection types</option>
              {Object.entries(legacyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </>
        )}
        <button className="button">Search</button>
      </form>
      {directory ? (
        <section aria-label="Collection results">
          <p className="collection-count">
            {raw.length.toLocaleString()} collections
            {selected ? ` in ${selected.title}` : ""}
            {q ? ` matching “${q}”` : ""}
          </p>
          {raw.length ? (
            <div className="collection-grid">
              {raw.slice((page - 1) * pageSize, page * pageSize).map((item) => (
                <Link
                  className="collection-card"
                  key={item.slug}
                  href={`/courses/${encodeURIComponent(item.slug)}`}
                  prefetch={false}
                >
                  <BookOpen size={24} />
                  <span className="collection-kind">
                    {groups.find((g) => g.id === courseGroupFor(item, all))
                      ?.title || "Collection"}
                  </span>
                  <h2>{courseCollectionLabel(item)}</h2>
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
                    Explore collection
                    <ArrowRight size={18} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No collections found</h2>
              <Link className="button" href="/courses">
                Explore courses
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
                <span aria-disabled="true" className="pagination-disabled">
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
                <span aria-disabled="true" className="pagination-disabled">
                  Next →
                </span>
              )}
            </nav>
          )}
        </section>
      ) : (
        visibleGroups.map((item) => (
          <section
            className="course-group-section"
            key={item.id}
            aria-labelledby={`course-group-${item.id}`}
          >
            <div className="course-group-heading">
              <div>
                <h2 id={`course-group-${item.id}`}>{item.title}</h2>
                <p>{item.description}</p>
              </div>
              {overview && (
                <Link href={`/courses?group=${item.id}`}>
                  Explore {item.title.toLowerCase()} <ArrowRight size={16} />
                </Link>
              )}
            </div>
            {overview && item.id === "calendar" ? (
              <div className="course-calendar-links">
                {item.families.map((family) => (
                  <Link
                    key={family.id}
                    href={`/courses/${encodeURIComponent(family.items[0].slug)}`}
                    prefetch={false}
                  >
                    <CalendarDays size={18} />
                    <span>
                      <strong>{family.title}</strong>
                      <small>{family.description.split(" · ")[0]}</small>
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="course-family-grid">
                {(overview ? item.families.slice(0, 3) : item.families).map(
                  (family) => (
                    <FamilyCard key={family.id} family={family} group={item} />
                  ),
                )}
              </div>
            )}
          </section>
        ))
      )}
      <section className="course-more-ways" aria-label="More ways to learn">
        <h2>More ways to learn</h2>
        <div className="topics">
          {groups
            .filter(
              (item) =>
                !["texts", "calendar", "topics"].includes(item.id) &&
                item.families.length,
            )
            .map((item) => (
              <Link
                key={item.id}
                className="topic-pill"
                href={`/courses?group=${item.id}`}
              >
                {item.title} →
              </Link>
            ))}
          <Link className="topic-pill" href="/courses?group=all">
            Browse every collection →
          </Link>
        </div>
      </section>
      <LearningConnection subject="Choosing a Breslov learning path" />
    </div>
  );
}
