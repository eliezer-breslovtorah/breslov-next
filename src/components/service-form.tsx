"use client";
import { useState } from "react";
export function ServiceForm({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="service-form">
      <p>Your form is handled by the existing Breslov Torah service.</p>
      <div className="service-actions">
        <a className="button" href={url} target="_blank" rel="noreferrer">
          Open {title} ↗
        </a>
        <button
          className="button button-secondary"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? "Close embedded form" : "Fill out form here"}
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
