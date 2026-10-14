import { LearningConnection } from "@/components/learning-connection";
import Link from "next/link";
import { publicPageLinks } from "@/lib/page-navigation";
import { getCollections } from "@/lib/catalog";
import { getTimelyTeachingWindow } from "@/lib/timely-teachings";
export const dynamic = "force-dynamic";
export default function Page() {
  const calendar = getCollections().find((c) => c.sourceId === 352);
  const months = getCollections()
    .filter((c) => c.parentId === calendar?.sourceId)
    .sort((a, b) => (a.sourceId || 0) - (b.sourceId || 0));
  const timely = getTimelyTeachingWindow();
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">LEARN THROUGH THE YEAR</p>
        <h1>Torah for the Jewish calendar</h1>
        <p>Explore teachings for each month, holiday, and season.</p>
      </header>
      <section className="section" aria-labelledby="timely-teachings-heading">
        <h2 id="timely-teachings-heading">Teachings for this season</h2>
        <p>Suggested learning for {timely.dateLabel}.</p>
        <div className="support-grid">
          <Link className="support-card" href={timely.currentMonth.href}>
            <p className="eyebrow">THIS MONTH</p>
            <h3>{timely.currentMonth.label}</h3>
            <p>{timely.currentMonth.theme}</p>
            <span>Listen to this month’s teachings →</span>
          </Link>
          <Link className="support-card" href={timely.nextMonth.href}>
            <p className="eyebrow">LOOKING AHEAD</p>
            <h3>{timely.nextMonth.label}</h3>
            <p>{timely.nextMonth.theme}</p>
            <span>Prepare for the coming month →</span>
          </Link>
        </div>
      </section>
      <section className="section" aria-labelledby="all-months-heading">
        <h2 id="all-months-heading">Explore the whole year</h2>
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
      </section>
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
                Open the live-class link ↗
              </a>
            </p>
          ))}
        <p>Please confirm current class times with the team before joining.</p>
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
      <LearningConnection subject="Choosing a Breslov learning path" />
    </div>
  );
}
