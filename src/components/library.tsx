"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Headphones,
  Video,
  LockKeyhole,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Lesson, Collection } from "@/lib/content";
export type BrowseQuery = {
  q?: string;
  teacher?: string;
  category?: string;
  collection?: string;
  topic?: string;
  format?: string;
  sort?: string;
  page?: string | number;
};
export type BrowseResult = {
  items: Lesson[];
  total: number;
  page: number;
  pageSize: number;
  facets: { teachers: string[]; collections: Collection[]; topics: string[] };
};
export function Library({
  result,
  query = {},
  basePath = "/library",
  fixedTeacher,
  fixedCategory,
}: {
  result: BrowseResult;
  query?: BrowseQuery;
  basePath?: string;
  fixedTeacher?: string;
  fixedCategory?: string;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  function pageUrl(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value && key !== "page") params.set(key, String(value));
    if (page > 1) params.set("page", String(page));
    return basePath + (params.size ? `?${params}` : "");
  }
  return (
    <div className="catalog-browser">
      <form action={basePath} method="get" className="catalog-search-form">
        <div className="library-search">
          <Search size={21} />
          <label className="sr-only" htmlFor="library-query">
            Search the library
          </label>
          <input
            key={query.q || ""}
            id="library-query"
            name="q"
            defaultValue={query.q || ""}
            placeholder="Search lessons, teachers, or topics…"
            maxLength={200}
          />
          <button className="button catalog-search-submit" type="submit">
            Search
          </button>
          <button
            type="button"
            className="filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="library-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>
        <div className="catalog-filter-panel">
          <aside
            id="library-filters"
            className={`filters ${filtersOpen ? "filters-open" : ""}`}
          >
            <div className="filter-heading">
              <h2>Refine your search</h2>
              <Link href={basePath}>Reset</Link>
            </div>
            {!fixedTeacher && (
              <label htmlFor="teacher-filter">
                Teacher
                <select
                  key={query.teacher || ""}
                  id="teacher-filter"
                  name="teacher"
                  defaultValue={query.teacher || ""}
                >
                  <option value="">All teachers</option>
                  {result.facets.teachers.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!fixedCategory && (
              <label htmlFor="collection-filter">
                Course or series
                <select
                  key={query.category || query.collection || ""}
                  id="collection-filter"
                  name="category"
                  defaultValue={query.category || query.collection || ""}
                >
                  <option value="">All collections</option>
                  {result.facets.collections.map((value) => (
                    <option key={value.slug} value={value.slug}>
                      {value.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label htmlFor="topic-filter">
              Topic or parsha
              <select
                key={query.topic || ""}
                id="topic-filter"
                name="topic"
                defaultValue={query.topic || ""}
              >
                <option value="">All topics</option>
                {result.facets.topics.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="format-filter">
              Format
              <select
                key={query.format || ""}
                id="format-filter"
                name="format"
                defaultValue={query.format || ""}
              >
                <option value="">All formats</option>
                <option>Audio</option>
                <option>Video</option>
              </select>
            </label>
            <label htmlFor="sort-filter">
              Sort by
              <select
                key={query.sort || ""}
                id="sort-filter"
                name="sort"
                defaultValue={query.sort || (query.q ? "relevance" : "newest")}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A–Z</option>
                <option value="relevance">Search relevance</option>
              </select>
            </label>
            <button type="submit" className="button">
              Apply filters
            </button>
          </aside>
        </div>
      </form>
      <div className="catalog-results">
        <div className="results-bar">
          <p aria-live="polite">
            <strong>{result.total.toLocaleString()}</strong>{" "}
            {result.total === 1 ? "lesson" : "lessons"}
            {query.q && <> matching “{query.q}”</>}
          </p>
          {result.total > 0 && (
            <span>
              Showing{" "}
              {((result.page - 1) * result.pageSize + 1).toLocaleString()}–
              {Math.min(
                result.page * result.pageSize,
                result.total,
              ).toLocaleString()}
            </span>
          )}
        </div>
        {result.items.length ? (
          result.items.map((lesson) => (
            <Link
              className="lesson-row"
              href={`/lessons/${encodeURIComponent(lesson.slug)}`}
              key={lesson.id || lesson.slug}
            >
              <img src={lesson.image} alt="" loading="lazy" />
              <div>
                <span className="eyebrow">{lesson.collection}</span>
                <h2>{lesson.title}</h2>
                <p>{lesson.speaker}</p>
                <div className="meta">
                  <span>
                    {lesson.format === "Video" ? (
                      <Video size={14} />
                    ) : (
                      <Headphones size={14} />
                    )}
                    {lesson.format}
                  </span>
                  {lesson.duration && <span>{lesson.duration}</span>}
                  {lesson.topic && <span>{lesson.topic}</span>}
                  {lesson.access === "members" && (
                    <span>
                      <LockKeyhole size={12} /> Members
                    </span>
                  )}
                </div>
              </div>
              <ArrowUpRight className="row-arrow" size={23} />
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <Search size={28} />
            <h2>No lessons found</h2>
            <p>Try a different topic or clear your filters.</p>
            <Link className="button" href={basePath}>
              Clear filters
            </Link>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Library pages" className="pagination">
            {result.page > 1 ? (
              <Link href={pageUrl(result.page - 1)} rel="prev">
                <ChevronLeft size={16} /> Previous
              </Link>
            ) : (
              <span aria-disabled="true" className="pagination-disabled">
                <ChevronLeft size={16} /> Previous
              </span>
            )}
            <span>
              Page {result.page.toLocaleString()} of {pages.toLocaleString()}
            </span>
            {result.page < pages ? (
              <Link href={pageUrl(result.page + 1)} rel="next">
                Next <ChevronRight size={16} />
              </Link>
            ) : (
              <span aria-disabled="true" className="pagination-disabled">
                Next <ChevronRight size={16} />
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
