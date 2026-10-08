"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [draft, setDraft] = useState<BrowseQuery>(query);
  const draftRef = useRef<BrowseQuery>(query);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingQuery = useRef<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { title: string; detail: string; href: string }[]
  >([]);
  const text = draft.q || "";
  function paramsFor(value: BrowseQuery) {
    const params = new URLSearchParams();
    for (const key of [
      "q",
      "teacher",
      "category",
      "collection",
      "topic",
      "format",
      "sort",
      "page",
    ] as const)
      if (value[key]) params.set(key, String(value[key]));
    return params;
  }
  const queryKey = paramsFor(query).toString();
  useEffect(() => {
    if (pendingQuery.current && queryKey !== pendingQuery.current) return;
    pendingQuery.current = null;
    draftRef.current = query;
    setDraft(query);
  }, [queryKey]);
  useEffect(() => {
    const restore = () => {
      clearTimeout(timer.current);
      pendingQuery.current = null;
      const value = Object.fromEntries(
        new URLSearchParams(window.location.search),
      ) as BrowseQuery;
      if (fixedCategory && !value.sort) value.sort = "oldest";
      draftRef.current = value;
      setDraft(value);
      setFocused(false);
    };
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener("popstate", restore);
      clearTimeout(timer.current);
    };
  }, [fixedCategory]);
  function navigate(value: BrowseQuery) {
    clearTimeout(timer.current);
    const params = paramsFor(value);
    pendingQuery.current = params.toString();
    startTransition(() =>
      router.replace(basePath + (params.size ? `?${params}` : ""), {
        scroll: false,
      }),
    );
  }
  function change(key: keyof BrowseQuery, value: string) {
    const next = { ...draftRef.current, [key]: value, page: undefined };
    draftRef.current = next;
    pendingQuery.current = paramsFor(next).toString();
    setDraft(next);
    clearTimeout(timer.current);
    if (key === "q")
      timer.current = setTimeout(() => navigate(draftRef.current), 300);
    else navigate(next);
  }
  useEffect(() => {
    setActive(-1);
    setSuggestions([]);
    if (!focused || text.trim().length < 2) {
      setSuggestionsLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await fetch(
          `/api/autocomplete?q=${encodeURIComponent(text)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Suggestions unavailable");
        const data = await response.json();
        if (controller.signal.aborted) return;
        const items = [
          ...(data.lessons || [])
            .slice(0, 6)
            .map((item: { slug: string; title: string; speaker: string }) => ({
              title: item.title,
              detail: `Lesson · ${item.speaker}`,
              href: `/lessons/${encodeURIComponent(item.slug)}`,
            })),
          ...(data.teachers || [])
            .slice(0, 3)
            .map((item: { slug: string; name: string }) => ({
              title: item.name,
              detail: "Teacher",
              href: `/teachers/${encodeURIComponent(item.slug)}`,
            })),
          ...(data.collections || [])
            .slice(0, 3)
            .map((item: { slug: string; title: string }) => ({
              title: item.title,
              detail: "Course or series",
              href: `/courses/${encodeURIComponent(item.slug)}`,
            })),
        ];
        setSuggestions(items);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [text, focused]);
  function choose(href: string) {
    clearTimeout(timer.current);
    setFocused(false);
    router.push(href);
  }
  const showSuggestions = focused && suggestions.length > 0;
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
      <form
        action={basePath}
        method="get"
        className="catalog-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(draftRef.current);
          setFocused(false);
        }}
      >
        <div className="library-search">
          <Search size={21} />
          <label className="sr-only" htmlFor="library-query">
            Search the library
          </label>
          <input
            id="library-query"
            name="q"
            value={text}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="library-suggestions"
            aria-activedescendant={
              showSuggestions && active >= 0
                ? `suggestion-${active}`
                : undefined
            }
            autoComplete="off"
            onChange={(event) => {
              change("q", event.target.value);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setFocused(false);
                setActive(-1);
              } else if (
                showSuggestions &&
                (event.key === "ArrowDown" || event.key === "ArrowUp")
              ) {
                event.preventDefault();
                setActive((value) =>
                  event.key === "ArrowDown"
                    ? (value + 1) % suggestions.length
                    : (value - 1 + suggestions.length) % suggestions.length,
                );
              } else if (
                event.key === "Enter" &&
                showSuggestions &&
                active >= 0
              ) {
                event.preventDefault();
                choose(suggestions[active].href);
              }
            }}
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
          {showSuggestions && (
            <div
              id="library-suggestions"
              role="listbox"
              aria-label="Search suggestions"
              className="search-suggestions"
            >
              {suggestions.map((item, index) => (
                <button
                  type="button"
                  key={item.href}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={active === index}
                  className={active === index ? "suggestion-active" : ""}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item.href)}
                >
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {pending
            ? "Updating lessons…"
            : suggestionsLoading
              ? "Finding suggestions…"
              : showSuggestions
                ? `${suggestions.length} suggestions available. Use arrow keys to explore.`
                : ""}
        </span>
        <div className="catalog-filter-panel">
          <aside
            id="library-filters"
            className={`filters ${filtersOpen ? "filters-open" : ""}`}
          >
            <div className="filter-heading">
              <h2>Refine your search</h2>
              <button
                type="button"
                onClick={() => {
                  const next = { sort: fixedCategory ? "oldest" : undefined };
                  draftRef.current = next;
                  setDraft(next);
                  navigate(next);
                }}
              >
                Reset
              </button>
            </div>
            {!fixedTeacher && (
              <label htmlFor="teacher-filter">
                Teacher
                <select
                  id="teacher-filter"
                  name="teacher"
                  value={draft.teacher || ""}
                  onChange={(event) => change("teacher", event.target.value)}
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
                  id="collection-filter"
                  name="category"
                  value={draft.category || draft.collection || ""}
                  onChange={(event) => {
                    const next = { ...draftRef.current, collection: undefined };
                    draftRef.current = next;
                    change("category", event.target.value);
                  }}
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
                id="topic-filter"
                name="topic"
                value={draft.topic || ""}
                onChange={(event) => change("topic", event.target.value)}
              >
                <option value="">All topics</option>
                {draft.topic && !result.facets.topics.includes(draft.topic) && (
                  <option value={draft.topic}>{draft.topic}</option>
                )}
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
                id="format-filter"
                name="format"
                value={draft.format || ""}
                onChange={(event) => change("format", event.target.value)}
              >
                <option value="">All formats</option>
                <option>Audio</option>
                <option>Video</option>
              </select>
            </label>
            <label htmlFor="sort-filter">
              Sort by
              <select
                id="sort-filter"
                name="sort"
                value={draft.sort || (draft.q ? "relevance" : "newest")}
                onChange={(event) => change("sort", event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A–Z</option>
                <option value="relevance">Search relevance</option>
              </select>
            </label>
          </aside>
        </div>
      </form>
      <div className="catalog-results" aria-busy={pending}>
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
