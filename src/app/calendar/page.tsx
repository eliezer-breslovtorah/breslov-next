import Link from "next/link";
import { publicPageLinks } from "@/lib/page-navigation";
import { getCollections, getPublicPages } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default function Page() {
  const calendar = getCollections().find((c) => c.sourceId === 352);
  const months = getCollections()
    .filter((c) => c.parentId === calendar?.sourceId)
    .sort((a, b) => (a.sourceId || 0) - (b.sourceId || 0));
  const schedule = getPublicPages().find(
    (p) => p.slug === "rabbi-nasan-maimons-weekly-class-schedule",
  );
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">LEARN THROUGH THE YEAR</p>
        <h1>Torah for the Jewish calendar</h1>
        <p>Explore teachings for each month, holiday, and season.</p>
      </header>
      <div className="support-grid">
        {months.map((month) => (
          <Link
            className="support-card"
            href={`/courses/${encodeURIComponent(month.slug)}`}
            key={month.slug}
          >
            <h2>{month.title}</h2>
            <p>
              {month.description || "Discover the teachings for this month."}
            </p>
            <span>Explore teachings →</span>
          </Link>
        ))}
      </div>
      <section className="section">
        <h2>Live classes &amp; weekly schedule</h2>
        {publicPageLinks("rabbi-nasan-maimons-weekly-class-schedule")
          .filter((l) => l.href.startsWith("https://"))
          .map((l) => (
            <p key={l.href}>
              <a
                className="button"
                href={l.href}
                target="_blank"
                rel="noreferrer"
              >
                Join the scheduled live class ↗
              </a>
            </p>
          ))}
        <article className="prose imported-copy">{schedule?.bodyText}</article>
        <p>
          <Link
            className="button"
            href="/pages/rabbi-nasan-maimons-weekly-class-schedule"
          >
            View class details →
          </Link>
        </p>
        <p>
          <Link href="/contact?subject=Live%20class%20schedule">
            Ask about class times
          </Link>
        </p>
      </section>
    </div>
  );
}
