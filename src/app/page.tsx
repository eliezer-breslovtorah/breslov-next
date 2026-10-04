import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, Search } from "lucide-react";
import { lessons, collections, teachers } from "@/lib/catalog";
import { LessonCard } from "@/components/lesson-card";
export default function Home() {
  return (
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">THE TEACHINGS OF REBBE NACHMAN</p>
          <h1>
            Timeless wisdom.
            <br />
            <em>For everyday life.</em>
          </h1>
          <p>
            Find inspiration, deepen your learning, and discover a path of joy
            through the teachings of Breslov.
          </p>
          <Link className="button" href="/library">
            Explore the library <ArrowRight size={18} />
          </Link>
          <Link className="hero-secondary" href="/courses">
            Find a course <BookOpen size={17} />
          </Link>
          <div className="hero-note">
            <Headphones size={16} />
            <span>Learn at your own pace. Wherever you are.</span>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/images/rabbi-nasan-maimon.jpg" alt="Rabbi Nasan Maimon" />
          <div className="portrait-caption">
            <span>YOUR GUIDE TO BRESLOV</span>
            <strong>Rabbi Nasan Maimon</strong>
          </div>
        </div>
      </section>
      <form className="home-search" action="/library">
        <Search aria-hidden="true" size={22} />
        <label className="sr-only" htmlFor="home-query">
          Search lessons
        </label>
        <input
          id="home-query"
          name="q"
          placeholder="What would you like to learn today?"
        />
        <button className="button" type="submit">
          Search <ArrowRight size={16} />
        </button>
      </form>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A PLACE TO BEGIN</p>
            <h2>Discover the teachings</h2>
          </div>
          <Link href="/library">
            Browse all lessons <ArrowRight size={16} />
          </Link>
        </div>
        <div className="card-grid">
          {lessons
            .filter(
              (lesson, index) => index === 0 || index >= lessons.length - 3,
            )
            .slice(0, 4)
            .filter(Boolean)
            .map((lesson) => (
              <LessonCard key={lesson.slug} lesson={lesson} />
            ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MAKE LEARNING A JOURNEY</p>
            <h2>Go deeper with a course</h2>
          </div>
          <Link href="/courses">
            All courses <ArrowRight size={16} />
          </Link>
        </div>
        <div className="collection-grid">
          {collections.slice(0, 3).map((c, i) => (
            <Link
              className={`collection-card collection-${i}`}
              href={`/courses/${c.slug}`}
              key={c.slug}
            >
              <BookOpen size={28} />
              <span className="eyebrow">GUIDED LEARNING</span>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              <span>
                Explore course <ArrowRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="topic-section">
        <div>
          <p className="eyebrow">WISDOM FOR EVERY PART OF LIFE</p>
          <h2>What’s on your mind?</h2>
        </div>
        <div className="topics">
          {[
            "Faith",
            "Joy",
            "Prayer",
            "Family peace",
            "Rebbe Nachman",
            "Parsha",
          ].map((t) => (
            <Link
              className="topic-pill"
              href={`/library?q=${encodeURIComponent(t)}`}
              key={t}
            >
              {t}
              <ArrowUpRightIcon />
            </Link>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A LIVING TRADITION</p>
            <h2>Learn from our teachers</h2>
          </div>
          <Link href="/teachers">
            Meet the teachers <ArrowRight size={16} />
          </Link>
        </div>
        <div className="teacher-grid">
          {teachers.map((t) => (
            <Link
              className="teacher-card"
              href={`/teachers/${t.slug}`}
              key={t.slug}
            >
              <img src={t.image} alt={t.name} />
              <div>
                <h3>{t.name}</h3>
                <p>{t.description}</p>
                <span>
                  Explore teachings <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="community-banner">
        <div>
          <p className="eyebrow">HELP KEEP TORAH ACCESSIBLE</p>
          <h2>Share the light of Breslov.</h2>
          <p>
            Support the preservation and sharing of these teachings for
            generations to come.
          </p>
        </div>
        <a className="button" href="https://donate.breslovtorah.com/">
          Support our work <ArrowRight size={18} />
        </a>
      </section>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={16} />;
}
