import Link from "next/link";
import { STARTER_STEPS, RAV_NASAN_SAMPLES } from "@/lib/learning-paths";
import { ShortClips } from "@/components/home-media";
import { LearningConnection } from "@/components/learning-connection";
import "@/app/learning-journeys.css";
export const metadata = { title: "Start learning Breslov" };
export default function Page() {
  return (
    <div className="page-wrap learning-journeys">
      <header className="page-heading">
        <p className="eyebrow">NEW TO BRESLOV?</p>
        <h1>Start with one small step.</h1>
        <p>
          No background is needed. Listen to a short introduction, then explore
          finding the good, personal prayer, and joy at your own pace.
        </p>
      </header>
      <section className="journey-note" aria-label="About Breslov learning">
        <p>
          Breslov learning draws on the teachings of Rebbe Nachman and his
          student Rav Nosson. Begin with practical ideas about finding good,
          personal prayer, and joy, then connect them with your own daily life.
        </p>
      </section>
      <section aria-label="Your first Breslov teaching">
        <ShortClips items={RAV_NASAN_SAMPLES.slice(0, 1)} />
      </section>
      <section className="section" aria-labelledby="starter-heading">
        <h2 id="starter-heading">A path from the beginning</h2>
        <p>
          Follow these four steps. Each opens an existing lesson, with its full
          course available when you want to continue.
        </p>
        <ol className="starter-steps">
          {STARTER_STEPS.map((step, index) => (
            <li key={step.lessonSlug}>
              <span className="step-number" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <small>
                  {step.lessonTitle} · {step.duration}
                </small>
                <div className="journey-actions">
                  <Link
                    className="button"
                    href={`/lessons/${step.lessonSlug}?seriesOrder=sequence&seriesCourse=${encodeURIComponent(step.courseSlug)}`}
                  >
                    Open this lesson →
                  </Link>
                  <Link href={`/courses/${step.courseSlug}?sort=sequence`}>
                    Continue the course →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <LearningConnection subject="Beginning Breslov" />
    </div>
  );
}
