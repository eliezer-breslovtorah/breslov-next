"use client";
import { useState } from "react";
export function NewsletterForm() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);
  return sent ? (
    <p role="status">
      Your subscription request has been received. The team will add you to the
      Breslov Bridge mailing list.
    </p>
  ) : (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const form = new FormData(e.currentTarget);
          const r = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.get("name"),
              email: form.get("email"),
              consent: form.get("consent") === "on",
              website: form.get("website"),
            }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setSent(true);
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Please try again",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Name
        <input name="name" required maxLength={120} autoComplete="name" />
      </label>
      <label>
        Email
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <label className="consent-label">
        <input type="checkbox" name="consent" required />I would like to receive
        the Breslov Bridge newsletter.
      </label>
      <label hidden style={{ display: "none" }}>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {message && <p role="alert">{message}</p>}
      <button className="button" disabled={busy}>
        {busy ? "Submitting…" : "Request a subscription"}
      </button>
    </form>
  );
}
