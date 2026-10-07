"use client";
import { useState } from "react";
import type { Lesson, Collection } from "@/lib/content";
export function AdminEditor({
  lesson,
  collections,
}: {
  lesson?: Lesson;
  collections: Collection[];
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-editor"
      encType="multipart/form-data"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const response = await fetch("/api/admin/lessons", {
              method: "POST",
              body: new FormData(e.currentTarget),
            }),
            data = await response.json();
          if (!response.ok) throw Error(data.error);
          window.location.assign(`/admin/lessons/${data.id}`);
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Unable to save");
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="id" value={lesson?.id || ""} />
      <label>
        Title
        <input
          name="title"
          required
          maxLength={600}
          defaultValue={lesson?.title}
        />
      </label>
      <label>
        URL slug
        <input
          name="slug"
          required
          maxLength={240}
          defaultValue={lesson?.slug}
        />
      </label>
      <div className="admin-fields">
        <label>
          Teacher
          <input name="speaker" required defaultValue={lesson?.speaker} />
        </label>
        <label>
          Primary collection
          <input name="collection" defaultValue={lesson?.collection} />
        </label>
        <label>
          Topic
          <input name="topic" defaultValue={lesson?.topic} />
        </label>
        <label>
          Duration
          <input
            name="duration"
            placeholder="25:30"
            defaultValue={lesson?.duration}
          />
        </label>
        <label>
          Format
          <select name="format" defaultValue={lesson?.format || "Audio"}>
            <option>Audio</option>
            <option>Video</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={lesson?.status || "draft"}>
            <option value="draft">Draft</option>
            <option value="publish">Published</option>
          </select>
        </label>
        <label>
          Access
          <select name="access" defaultValue={lesson?.access || "members"}>
            <option value="public">Public</option>
            <option value="members">Members</option>
            <option value="legacy">Existing WordPress access</option>
          </select>
        </label>
      </div>
      <label>
        Category slugs, separated by commas
        <input
          name="categories"
          list="collection-slugs"
          defaultValue={lesson?.collectionSlugs?.join(", ")}
        />
        <datalist id="collection-slugs">
          {collections.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </datalist>
      </label>
      <label>
        Tags, separated by commas
        <input
          name="tags"
          defaultValue={lesson?.categories
            ?.filter((t) => t.taxonomy === "post_tag")
            .map((t) => t.title)
            .join(", ")}
        />
      </label>
      <label>
        Short description
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={lesson?.description}
        />
      </label>
      <label>
        Full lesson description
        <textarea name="bodyText" rows={8} defaultValue={lesson?.bodyText} />
      </label>
      <label>
        Dedication
        <textarea
          name="dedication"
          rows={3}
          defaultValue={lesson?.dedication}
        />
      </label>
      <label>
        Video embed URL
        <input
          name="videoEmbedUrl"
          type="url"
          placeholder="https://player.vimeo.com/video/…"
          defaultValue={lesson?.videoEmbedUrl}
        />
      </label>
      <label>
        Upload or replace media
        <input
          name="media"
          type="file"
          accept="audio/mpeg,video/mp4,.mp3,.mp4"
        />
      </label>
      <p>
        MP3 or MP4, up to 200 MB. Uploaded files follow the lesson’s access
        setting. Existing recordings stay in their original directory.
      </p>
      {message && <p role="alert">{message}</p>}
      <button className="button primary" disabled={busy}>
        {busy ? "Saving…" : "Save lesson"}
      </button>
    </form>
  );
}
export function MemberEditor({
  id,
  role,
  until,
}: {
  id: string;
  role: string;
  until?: string;
}) {
  const [message, setMessage] = useState("");
  return (
    <form
      className="member-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.currentTarget));
        const r = await fetch("/api/admin/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        setMessage(r.ok ? "Updated" : d.error);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <label>
        Access
        <select name="role" defaultValue={role}>
          <option value="user">Learner</option>
          <option value="member">Member</option>
        </select>
      </label>
      <label>
        Expires
        <input
          name="memberUntil"
          type="date"
          defaultValue={until?.slice(0, 10) || ""}
        />
      </label>
      <button className="button">Save</button>
      {message && <span role="status">{message}</span>}
    </form>
  );
}

export function SetupForm({ token }: { token: string }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const body = {
          ...Object.fromEntries(new FormData(e.currentTarget)),
          token,
        };
        const r = await fetch("/api/admin/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (r.ok) window.location.assign("/admin");
        else {
          setMessage(d.error);
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={12}
          maxLength={256}
          required
          autoComplete="new-password"
        />
      </label>
      {message && <p role="alert">{message}</p>}
      <button className="button primary" disabled={busy}>
        {busy ? "Setting up…" : "Create administrator"}
      </button>
    </form>
  );
}

export function ResetLinkButton({ id }: { id: string }) {
  const [message, setMessage] = useState("");
  return (
    <div>
      <button
        className="button"
        onClick={async () => {
          try {
            const r = await fetch("/api/admin/password-reset", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const d = await r.json();
            setMessage(r.ok ? d.url : d.error);
          } catch {
            setMessage("Unable to generate link");
          }
        }}
      >
        Generate password reset link
      </button>
      {message && (
        <p role="status" style={{ overflowWrap: "anywhere" }}>
          {message}
        </p>
      )}
      <p>
        Share privately after verifying identity. Link expires in 30 minutes.
      </p>
    </div>
  );
}
