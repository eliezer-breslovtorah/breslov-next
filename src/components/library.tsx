"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Headphones,
} from "lucide-react";
import type { Lesson } from "@/lib/content";
export function Library({
  lessons,
  initialQuery = "",
}: {
  lessons: Lesson[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [speaker, setSpeaker] = useState("");
  const [collection, setCollection] = useState("");
  const [format, setFormat] = useState("");
  const [sort, setSort] = useState("default");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const result = lessons.filter(
      (l) =>
        (!query ||
          `${l.title} ${l.description} ${l.topic} ${l.collection} ${l.speaker}`
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!speaker || l.speaker === speaker) &&
        (!collection || l.collection === collection) &&
        (!format || l.format === format),
    );
    return sort === "title"
      ? result.sort((a, b) => a.title.localeCompare(b.title))
      : result;
  }, [lessons, query, speaker, collection, format, sort]);
  const reset = () => {
    setQuery("");
    setSpeaker("");
    setCollection("");
    setFormat("");
    setPage(1);
  };
  const change = (fn: (v: string) => void, v: string) => {
    fn(v);
    setPage(1);
  };
  return (
    <>
      <div className="library-search">
        <Search size={21} />
        <label className="sr-only" htmlFor="library-query">
          Search the library
        </label>
        <input
          id="library-query"
          value={query}
          onChange={(e) => change(setQuery, e.target.value)}
          placeholder="Search lessons, teachers, or topics…"
        />
        <button
          className="filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="library-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={18} /> Filters
        </button>
      </div>
      <div className="library-layout">
        <aside
          id="library-filters"
          className={`filters ${filtersOpen ? "filters-open" : ""}`}
        >
          <div className="filter-heading">
            <h2>Refine your search</h2>
            <button onClick={reset}>Reset</button>
          </div>
          <label htmlFor="teacher-filter">
            Teacher
            <select
              id="teacher-filter"
              value={speaker}
              onChange={(e) => change(setSpeaker, e.target.value)}
            >
              <option value="">All teachers</option>
              {Array.from(new Set(lessons.map((l) => l.speaker))).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label htmlFor="collection-filter">
            Course or series
            <select
              id="collection-filter"
              value={collection}
              onChange={(e) => change(setCollection, e.target.value)}
            >
              <option value="">All collections</option>
              {Array.from(new Set(lessons.map((l) => l.collection))).map(
                (v) => (
                  <option key={v}>{v}</option>
                ),
              )}
            </select>
          </label>
          <label htmlFor="format-filter">
            Format
            <select
              id="format-filter"
              value={format}
              onChange={(e) => change(setFormat, e.target.value)}
            >
              <option value="">All formats</option>
              <option>Audio</option>
              <option>Video</option>
            </select>
          </label>
          <div className="filter-tip">
            <Headphones size={22} />
            <h3>Find your next lesson</h3>
            <p>
              Explore a teacher, follow a course, or search for a topic that
              speaks to you.
            </p>
          </div>
        </aside>
        <div>
          <div className="results-bar">
            <p aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "lesson" : "lessons"}
            </p>
            <label>
              Sort by{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Featured</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            filtered.slice((page - 1) * 6, page * 6).map((l) => (
              <Link
                className="lesson-row"
                href={`/lessons/${l.slug}`}
                key={l.slug}
              >
                <img src={l.image} alt="" />
                <div>
                  <span className="eyebrow">{l.collection}</span>
                  <h2>{l.title}</h2>
                  <p>{l.speaker}</p>
                  <div className="meta">
                    <span>
                      <Headphones size={14} />
                      {l.format}
                    </span>
                    {l.duration && <span>{l.duration}</span>}
                    <span>{l.topic}</span>
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
              <button className="button" onClick={reset}>
                Clear filters
              </button>
            </div>
          )}
          {filtered.length > 6 && (
            <nav aria-label="Library pages" className="pagination">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {page} of {Math.ceil(filtered.length / 6)}
              </span>
              <button
                disabled={page * 6 >= filtered.length}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
