import Link from "next/link";
import { ArrowRight, BookOpen, Headphones } from "lucide-react";
import { getLessons } from "@/lib/catalog";
import { LIFE_TOPICS } from "@/lib/learning-paths";
import { getTimelyTeachingWindow } from "@/lib/timely-teachings";
import { LearningConnection } from "@/components/learning-connection";
import { homepage } from "@/lib/homepage";
import { FeaturedTeaching, ShortClips } from "@/components/home-media";
import { HeaderSearch } from "@/components/header-search";
import { LessonCard } from "@/components/lesson-card";
export const dynamic = "force-dynamic";
export default function Home() {
  const lessons = getLessons({ pageSize: 4, sort: "newest" }).items;
  const timely = getTimelyTeachingWindow();
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
          <HeaderSearch inline />
          <div className="discovery-actions">
            <Link className="button" href="/library">
              Browse all classes <ArrowRight size={17} />
            </Link>
            <Link className="button button-secondary" href="/courses">
              Start a course <BookOpen size={17} />
            </Link>
          </div>
          <div className="journey-actions">
            <Link href="/start">New to Breslov? Start here →</Link>
            <Link href="/meet-rav-nasan">Meet Rav Nasan →</Link>
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
        <p className="journey-note">
          Ready for a course?{" "}
          <Link href="/lessons/azamra-lesson-1-lm1-torah-282-part-1">
            Start with lesson 1
          </Link>{" "}
          of Azamra, finding the good in yourself and others.
        </p>
      </section>
      <section className="section" aria-labelledby="learning-paths-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR WAY INTO BRESLOV</p>
            <h2 id="learning-paths-heading">Where would you like to begin?</h2>
          </div>
        </div>
        <div className="journey-grid">
          {[
            [
              "New to Breslov",
              "A gentle path from the first step to finding good, prayer, and joy.",
              "/start",
              "Start from the beginning",
            ],
            [
              "Meet Rav Nasan",
              "Hear his teaching in less than five minutes, then get to know his work.",
              "/meet-rav-nasan",
              "Listen and meet Rav Nasan",
            ],
            [
              "Find your next lesson",
              "Search teachers, texts, tags, formats, dates, and the time you have available.",
              "/library#library-query",
              "Explore the lesson library",
            ],
            [
              "Study a text systematically",
              "Choose a sefer and continue through its lessons in text order.",
              "/study",
              "Choose a text",
            ],
            [
              "Torah for everyday life",
              "Explore joy, relationships, parenting, prayer, and faith.",
              "/courses?group=topics",
              "Explore life subjects",
            ],
            [
              "Learn with the season",
              "Find the Jewish calendar’s current and upcoming teachings.",
              "/calendar",
              "See timely teachings",
            ],
          ].map(([title, description, href, label]) => (
            <article className="journey-card" key={href}>
              <h3>{title}</h3>
              <p>{description}</p>
              <Link href={href}>
                {label} <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="section" aria-labelledby="life-topics-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TORAH FOR EVERYDAY LIFE</p>
            <h2 id="life-topics-heading">What’s on your mind?</h2>
            <p>
              Begin with a life question. These paths lead to real courses, with
              recordings ready to explore.
            </p>
          </div>
          <Link href="/courses?group=topics">All life subjects →</Link>
        </div>
        <div className="journey-grid">
          {LIFE_TOPICS.map((topic) => (
            <article className="journey-card" key={topic.href}>
              <h3>{topic.label}</h3>
              <p>{topic.description}</p>
              <Link href={topic.href}>Explore teachings →</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="section" aria-labelledby="timely-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LEARN WITH THE JEWISH YEAR</p>
            <h2 id="timely-heading">Timely teachings</h2>
          </div>
          <Link href="/calendar">Explore the calendar →</Link>
        </div>
        <div className="journey-grid">
          {[timely.currentMonth, timely.nextMonth].map((month, index) => (
            <article className="journey-card" key={`${month.slug}-${index}`}>
              <p className="eyebrow">
                {index === 0 ? "THIS MONTH" : "COMING NEXT"}
              </p>
              <h3>{month.label}</h3>
              <p>{month.theme}</p>
              <Link href={month.href}>Explore {month.label} teachings →</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="section" aria-labelledby="latest-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KEEP YOUR LEARNING GOING</p>
            <h2 id="latest-heading">Latest lessons</h2>
            <p>Recently published in the library.</p>
          </div>
          <Link href="/library?sort=newest">See all recent lessons →</Link>
        </div>
        <div className="card-grid">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.slug} lesson={lesson} />
          ))}
        </div>
      </section>
      <LearningConnection />
    </div>
  );
}
