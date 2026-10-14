"use client";
import { useEffect, useState } from "react";
export function TopicFinder({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<
    { slug: string; title: string; count: number }[]
  >([]);
  const [active, setActive] = useState(-1);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    setItems([]);
    setActive(-1);
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          "/api/tag-autocomplete?q=" + encodeURIComponent(query),
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const { tags } = await response.json();
        if (!controller.signal.aborted) setItems(tags);
      } catch {}
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  useEffect(() => {
    if (active >= 0)
      document
        .getElementById(`all-tag-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const open = focused && items.length > 0;
  function choose(title: string) {
    onSelect(title);
    setQuery("");
    setFocused(false);
  }
  return (
    <div className="topic-finder">
      <label htmlFor="all-tag-query">Find any tag</label>
      <input
        id="all-tag-query"
        value={query}
        placeholder="Search all lesson tags…"
        maxLength={200}
        role="combobox"
        aria-expanded={open}
        aria-controls="all-tag-options"
        aria-autocomplete="list"
        aria-activedescendant={
          open && active >= 0 ? `all-tag-${active}` : undefined
        }
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && open) {
            e.preventDefault();
            setActive((active + 1) % items.length);
          }
          if (e.key === "ArrowUp" && open) {
            e.preventDefault();
            setActive((active - 1 + items.length) % items.length);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setFocused(false);
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (open && active >= 0) choose(items[active].title);
          }
        }}
      />
      {open && (
        <ul
          id="all-tag-options"
          role="listbox"
          aria-label="Matching lesson tags"
        >
          {items.map((item, index) => (
            <li key={item.slug}>
              <button
                type="button"
                id={`all-tag-${index}`}
                role="option"
                aria-selected={active === index}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item.title)}
              >
                <span>{item.title}</span>
                <small>{item.count.toLocaleString()} lessons</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && <small>Selected: {selected}</small>}
    </div>
  );
}
