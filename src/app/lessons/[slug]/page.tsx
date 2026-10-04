import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, ArrowRight, BookOpen } from "lucide-react";
import { lessons } from "@/lib/catalog";
import { LessonCard } from "@/components/lesson-card";
export function generateStaticParams() {
  return lessons.map((l) => ({ slug: l.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = lessons.find((l) => l.slug === slug);
  if (!lesson) notFound();
  return (
    <div className="page-wrap">
      <nav className="breadcrumb">
        <Link href="/library">Library</Link>
        <span>/</span>
        <span>{lesson.collection}</span>
      </nav>
      <section className="detail-grid">
        <div>
          <p className="eyebrow">{lesson.collection}</p>
          <h1>{lesson.title}</h1>
          <p className="detail-teacher">{lesson.speaker}</p>
          <div className="meta">
            <span>
              <Headphones size={16} />
              {lesson.format}
            </span>
            {lesson.duration && <span>{lesson.duration}</span>}
            <span>{lesson.topic}</span>
          </div>
          <div className="prose">
            <h2>About this lesson</h2>
            <p>{lesson.description}</p>
          </div>
          <div className="playback-panel">
            <Headphones size={28} />
            <h2>Listen to this teaching</h2>
            <p>
              During the site transition, playback and member access remain
              available through the existing lesson page.
            </p>
            <a className="button" href={lesson.legacyUrl}>
              Open lesson &amp; listen <ArrowRight size={18} />
            </a>
          </div>
        </div>
        <aside className="lesson-aside">
          <img src={lesson.image} alt={lesson.speaker} />
          <div>
            <BookOpen size={24} />
            <h2>Learning that stays with you</h2>
            <p>
              Take a moment to reflect, revisit the teaching, and bring it into
              your day.
            </p>
            <a
              href={`https://donate.breslovtorah.com/dedications/torah-shiur?shiurname=${encodeURIComponent(lesson.title)}`}
            >
              Dedicate a shiur ↗
            </a>
          </div>
        </aside>
      </section>
      <section className="section">
        <div className="section-heading">
          <h2>Continue exploring</h2>
          <Link href="/library">
            Browse the library <ArrowRight size={16} />
          </Link>
        </div>
        <div className="card-grid">
          {lessons
            .filter((l) => l.slug !== slug)
            .slice(0, 4)
            .map((l) => (
              <LessonCard key={l.slug} lesson={l} />
            ))}
        </div>
      </section>
    </div>
  );
}
