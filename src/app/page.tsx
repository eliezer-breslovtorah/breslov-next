import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, Search } from "lucide-react";
import { getLessons, getCollections, getTeachers } from "@/lib/catalog";
import { homepage } from "@/lib/homepage";
import { FeaturedTeaching, ShortClips } from "@/components/home-media";
import { LessonCard } from "@/components/lesson-card";
export const dynamic = "force-dynamic";
export default function Home() {
  const lessons = getLessons({ pageSize: 4 }).items;
  const collections = getCollections();
  const teachers = getTeachers();
  return (
    <div className="page-wrap">
      <section className="learning-hero" aria-label="Start learning">
        <div className="featured-column">
          <p className="eyebrow">START LEARNING RIGHT HERE</p>
          <FeaturedTeaching item={homepage.featured} />
        </div>
        <div className="learning-welcome">
          <p className="eyebrow">THE TEACHINGS OF REBBE NACHMAN</p>
          <h1>
            A moment of Torah.
            <br />
            <em>A path for your day.</em>
          </h1>
          <p>
            Listen, find inspiration, and bring the wisdom of Breslov into
            everyday life. Begin with a class or find your own path.
          </p>
          <form className="home-search hero-search" action="/library">
            <Search aria-hidden="true" size={20} />
            <label className="sr-only" htmlFor="home-query">
              Search lessons
            </label>
            <input
              id="home-query"
              name="q"
              placeholder="What would you like to learn?"
            />
            <button
              className="search-go"
              type="submit"
              aria-label="Search lessons"
            >
              <ArrowRight size={20} />
            </button>
          </form>
          <div className="discovery-actions">
            <Link className="button" href="/library">
              Browse all classes <ArrowRight size={17} />
            </Link>
            <Link className="button button-secondary" href="/courses">
              Start a course <BookOpen size={17} />
            </Link>
          </div>
          <p className="welcome-note">
            <Headphones size={16} /> A few minutes can change your day.
          </p>
        </div>
      </section>
      <section className="section quick-listen">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A LITTLE TIME. LASTING INSPIRATION.</p>
            <h2>Have a few minutes?</h2>
            <p>Press play and take a teaching with you.</p>
          </div>
          <Link href="/library">
            Browse the library <ArrowRight size={16} />
          </Link>
        </div>
        <ShortClips items={homepage.clips} />
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
          {homepage.courseSlugs
            .map((slug) => collections.find((c) => c.slug === slug))
            .filter((c) => c !== undefined)
            .map((c, i) => (
              <Link
                className={`collection-card collection-${i}`}
                href={
                  homepage.firstLessons[c.slug]
                    ? `/lessons/${homepage.firstLessons[c.slug]}`
                    : `/courses/${c.slug}`
                }
                key={c.slug}
              >
                <BookOpen size={28} />
                <span className="eyebrow">GUIDED LEARNING</span>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <span>
                  {homepage.firstLessons[c.slug]
                    ? "Start with lesson 1"
                    : "Explore this course"}{" "}
                  <ArrowRight size={18} />
                </span>
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
      <section className="community-banner">
        <div>
          <p className="eyebrow">HELP KEEP TORAH ACCESSIBLE</p>
          <h2>Share the light of Breslov.</h2>
          <p>
            Support the preservation and sharing of these teachings for
            generations to come.
          </p>
        </div>
        <a className="button" href="/donate">
          Support our work <ArrowRight size={18} />
        </a>
      </section>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={16} />;
}
