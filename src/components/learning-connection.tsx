import Link from "next/link";
import "@/app/learning-connection.css";

export function LearningConnection({ subject }: { subject?: string }) {
  const questionSubject = subject
    ? `Question for Rav Nasan: ${subject}`.slice(0, 200)
    : "Question for Rav Nasan";
  return (
    <section
      className="learning-connection"
      aria-label="Connect with Rav Nasan and Breslov"
    >
      <div>
        <p className="eyebrow">KEEP THE CONVERSATION GOING</p>
        <h2>Ask Rav Nasan</h2>
        <p>
          Have a question about a teaching or about bringing it into your life?
          Everyone is welcome to ask.
        </p>
        <Link
          className="button button-secondary"
          href={`/contact?subject=${encodeURIComponent(questionSubject)}`}
        >
          Ask a question →
        </Link>
      </div>
      <div>
        <p className="eyebrow">PUT THE TEACHINGS INTO ACTION</p>
        <h2>Connect through giving</h2>
        <p>
          Rav Nasan supports a wide variety of Breslov organizations and
          activities. Giving tzedakah is one of the best ways to connect: help
          sustain Torah learning and support families and community life.
        </p>
        <div className="learning-connection-actions">
          <Link className="button" href="/donate">
            Give tzedakah →
          </Link>
          <Link className="learning-connection-link" href="/projects">
            Explore the projects →
          </Link>
        </div>
      </div>
    </section>
  );
}
