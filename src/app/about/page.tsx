import Link from "next/link";
export const metadata = { title: "About Breslov Torah" };
export default function Page() {
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">WELCOME TO BRESLOV TORAH</p>
        <h1>A path of wisdom, faith, and joy.</h1>
      </header>
      <div className="detail-grid">
        <article className="prose">
          <h2>The teachings of Rebbe Nachman</h2>
          <p>
            Breslov Torah is Rabbi Nasan Maimon’s online community and resource
            for the teachings of Rebbe Nachman of Breslov. Its existing archive
            offers thousands of authoritative, text-based classes.
          </p>
          <p>
            Our purpose is to make these teachings easier to discover, study,
            and bring into everyday life, preserving the voices and tradition
            that make this library special.
          </p>
          <h2>Begin wherever you are</h2>
          <p>
            Explore a topic, follow a course, or learn from our teachers.
            Whether you have a few minutes or want to study in depth, there is a
            place to begin.
          </p>
          <Link className="button" href="/library">
            Explore the library →
          </Link>
          <h2>Connect with Rabbi Maimon</h2>
          <p>
            Send your questions or requests for guidance to the Breslov Torah
            team.
          </p>
          <Link className="button button-secondary" href="/contact">
            Contact Rabbi Maimon →
          </Link>
        </article>
        <aside className="lesson-aside">
          <img src="/images/rabbi-nasan-maimon.jpg" alt="Rabbi Nasan Maimon" />
        </aside>
      </div>
    </div>
  );
}
