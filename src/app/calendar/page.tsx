import { getPublicPages } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default function Page() {
  const p =
    getPublicPages().find(
      (p) => p.slug === "rabbi-nasan-maimons-weekly-class-schedule",
    ) || getPublicPages().find((p) => p.slug === "calendar");
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">LEARN TOGETHER</p>
        <h1>Class schedule &amp; calendar</h1>
      </header>
      <article className="prose imported-copy">
        {p?.bodyText
          .split(/\n+/)
          .filter(Boolean)
          .map((text, i) => (
            <p key={i}>{text}</p>
          ))}
      </article>
      <section className="service-form">
        <p>
          Check the current calendar for the latest class times and live links.
        </p>
        <a
          className="button"
          href={p?.legacyUrl || "https://www.breslovtorah.com/calendar/"}
          target="_blank"
          rel="noreferrer"
        >
          Open current calendar ↗
        </a>
      </section>
    </div>
  );
}
