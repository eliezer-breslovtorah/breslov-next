"use client";
import { useState } from "react";
import type { Collection, Teacher } from "@/lib/content";
export function TaxonomyEditor({
  collections,
  teachers,
}: {
  collections: Collection[];
  teachers: Teacher[];
}) {
  const [kind, setKind] = useState("collection"),
    [selected, setSelected] = useState(""),
    [message, setMessage] = useState("");
  const item =
    kind === "teacher"
      ? teachers.find((t) => t.slug === selected)
      : collections.find((c) => c.slug === selected);
  return (
    <>
      <label>
        Edit existing or create new
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">New entry</option>
          {(kind === "teacher" ? teachers : collections).map((i) => (
            <option key={i.slug} value={i.slug}>
              {"title" in i ? i.title : i.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Entry type
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setSelected("");
          }}
        >
          <option value="collection">Category or course</option>
          <option value="teacher">Teacher</option>
        </select>
      </label>
      <form
        className="admin-editor"
        key={kind + selected}
        onSubmit={async (e) => {
          e.preventDefault();
          setMessage("");
          const body = {
            ...Object.fromEntries(new FormData(e.currentTarget)),
            kind,
          };
          const r = await fetch("/api/admin/taxonomy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const d = await r.json();
          if (r.ok) window.location.reload();
          else setMessage(d.error);
        }}
      >
        <label>
          Name
          <input
            name="title"
            required
            defaultValue={
              item ? ("title" in item ? item.title : item.name) : ""
            }
          />
        </label>
        <label>
          Slug
          <input
            name="slug"
            required
            readOnly={!!item}
            defaultValue={item?.slug}
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows={6}
            defaultValue={item?.description}
          />
        </label>
        <label>
          Local image path
          <input
            name="image"
            defaultValue={item?.image || "/images/logo.png"}
          />
        </label>
        {kind === "collection" && (
          <>
            <label>
              Taxonomy
              <select
                name="taxonomy"
                defaultValue={
                  item && "taxonomy" in item ? item.taxonomy : "courses"
                }
              >
                <option value="courses">Courses</option>
                <option value="series">Series</option>
                <option value="parshios">Parsha</option>
                <option value="parshas">Video parsha</option>
                <option value="types">Lesson types</option>
              </select>
            </label>
            <label>
              Parent
              <select
                name="parentId"
                defaultValue={item && "parentId" in item ? item.parentId : 0}
              >
                <option value="0">No parent</option>
                {collections
                  .filter((c) => c.slug !== selected)
                  .map((c) => (
                    <option key={c.slug} value={c.sourceId}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </label>
          </>
        )}
        {message && <p role="alert">{message}</p>}
        <button className="button primary">Save</button>
      </form>
    </>
  );
}
