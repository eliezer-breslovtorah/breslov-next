"use client";
import { useState } from "react";
export function ContactForm({
  initialSubject = "",
}: {
  initialSubject?: string;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);
  if (sent)
    return (
      <div role="status">
        <h2>Thank you for your message</h2>
        <p>Your message has been received by the Breslov Torah team.</p>
      </div>
    );
  return (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const r = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              Object.fromEntries(new FormData(e.currentTarget)),
            ),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setSent(true);
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Please try again");
          setBusy(false);
        }
      }}
    >
      <label>
        Your name or initials
        <input name="name" required maxLength={120} autoComplete="name" />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <label>
        Subject
        <input
          name="subject"
          required
          maxLength={200}
          defaultValue={initialSubject}
        />
      </label>
      <label>
        Message
        <textarea name="message" maxLength={10000} rows={7} />
      </label>
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px" }}
      >
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {message && <p role="alert">{message}</p>}
      <button className="button primary" disabled={busy}>
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
export function InquiryStatus({ id, status }: { id: string; status: string }) {
  const [message, setMessage] = useState("");
  return (
    <form
      className="member-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await fetch("/api/admin/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            status: new FormData(e.currentTarget).get("status"),
          }),
        });
        const d = await r.json();
        setMessage(r.ok ? "Updated" : d.error);
      }}
    >
      <label>
        Status
        <select name="status" defaultValue={status}>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <button className="button">Update</button>
      {message && <span role="status">{message}</span>}
    </form>
  );
}
