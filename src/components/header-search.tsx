"use client";
import { useEffect, useRef, useState, useId } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import "@/app/header-search.css";
type Tag = { slug: string; title: string; count: number };
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const close = (restore = false) => {
    setOpen(false);
    if (restore) trigger.current?.focus();
  };
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    setTags([]);
    setActive(-1);
    setFailed(false);
    if (!open || query.trim().length < 2) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/tag-autocomplete?q=${encodeURIComponent(query.trim().slice(0, 200))}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setTags(data.tags);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);
  useEffect(() => {
    if (active >= 0)
      document
        .getElementById(`${id}-tag-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, id]);
  const navigate = (tag?: Tag) => {
    if (!tag && !query.trim()) return;
    close(true);
    router.push(
      tag
        ? `/library?topic=${encodeURIComponent(tag.title)}`
        : `/library?q=${encodeURIComponent(query.trim().slice(0, 200))}`,
    );
  };
  return (
    <div className="header-search" ref={root}>
      <button
        type="button"
        className="header-search-trigger search-link"
        ref={trigger}
        aria-label="Search the library"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => (open ? close(true) : setOpen(true))}
      >
        <Search size={20} />
      </button>
      {open && (
        <section
          id={`${id}-panel`}
          className="header-search-panel"
          aria-label="Library search"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close(true);
            }
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              navigate(tags[active]);
            }}
          >
            <label htmlFor={`${id}-query`}>Search lessons and tags</label>
            <div className="header-search-field">
              <Search size={18} />
              <input
                ref={input}
                id={`${id}-query`}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={tags.length > 0}
                aria-controls={`${id}-tags`}
                aria-activedescendant={
                  active >= 0 ? `${id}-tag-${active}` : undefined
                }
                placeholder="Search a topic or lesson…"
                value={query}
                maxLength={200}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    (event.key === "ArrowDown" || event.key === "ArrowUp") &&
                    tags.length
                  ) {
                    event.preventDefault();
                    setActive((current) =>
                      event.key === "ArrowDown"
                        ? (current + 1) % tags.length
                        : current <= 0
                          ? tags.length - 1
                          : current - 1,
                    );
                  }
                }}
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => close(true)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="header-search-hint">
              Choose a tag, or press Enter to search all lessons.
            </p>
            {tags.length > 0 && (
              <ul id={`${id}-tags`} role="listbox" aria-label="Lesson tags">
                {tags.map((tag, index) => (
                  <li
                    id={`${id}-tag-${index}`}
                    key={tag.slug}
                    role="option"
                    aria-selected={index === active}
                    className={index === active ? "selected" : ""}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => navigate(tag)}
                  >
                    <span>{tag.title}</span>
                    <small>{tag.count.toLocaleString()} lessons</small>
                  </li>
                ))}
              </ul>
            )}
            <p className="header-search-status" role="status">
              {loading
                ? "Finding tags…"
                : failed
                  ? "Tag suggestions are unavailable. Press Enter to search lessons."
                  : query.trim().length >= 2 && !tags.length
                    ? "No matching tags. Press Enter to search lessons."
                    : ""}
            </p>
          </form>
        </section>
      )}
    </div>
  );
}
