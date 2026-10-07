"use client";
import { useState } from "react";
export function ServiceForm({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="service-form">
      <p>
        Complete your form below. Payments are handled securely by Breslov
        Torah’s donation service.
      </p>
      <div className="service-actions">
        <a className="button" href={url} target="_blank" rel="noreferrer">
          Open secure checkout in a new tab ↗
        </a>
        <button
          className="button button-secondary"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? "Hide form" : "Show form"}
        </button>
      </div>
      {open && (
        <>
          <p>
            If your browser blocks the form or payment window, use the Open link
            above.
          </p>
          <iframe
            title={title}
            src={url}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="external-form"
          />
        </>
      )}
    </section>
  );
}
