import Link from "next/link";
import { SYSTEMATIC_TEXTS } from "@/lib/learning-paths";
import { LearningConnection } from "@/components/learning-connection";
import "@/app/learning-journeys.css";
export const metadata = { title: "Study a Breslov text in order" };
export default function Page() {
  return (
    <div className="page-wrap learning-journeys">
      <header className="page-heading">
        <p className="eyebrow">ONE LESSON AT A TIME</p>
        <h1>Study a text in order.</h1>
        <p>
          Choose a sefer, start at its numbered beginning, and use the previous
          and next lessons to continue. Likutey Halakhos has separate first- and
          second-pass recordings.
        </p>
      </header>
      <div className="journey-grid">
        {SYSTEMATIC_TEXTS.map((text) => (
          <article className="journey-card" key={text.href}>
            <h2>{text.title}</h2>
            <p>{text.description}</p>
            <div className="journey-actions">
              {"startingLessonSlug" in text && (
                <Link
                  className="button"
                  href={`/lessons/${text.startingLessonSlug}?seriesOrder=sequence&seriesCourse=${encodeURIComponent(text.href.split("/").pop()!)}`}
                >
                  Start at the beginning →
                </Link>
              )}
              <Link href={`${text.href}?sort=sequence`}>
                Browse in text order →
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="journey-note">
        Already following a course? Use <Link href="/account">My learning</Link>{" "}
        to find saved lessons and listening history.
      </p>
      <LearningConnection subject="Studying a Breslov text" />
    </div>
  );
}
