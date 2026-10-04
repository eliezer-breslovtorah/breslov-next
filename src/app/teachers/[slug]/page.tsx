import Link from "next/link";
import { notFound } from "next/navigation";
import { teachers, lessons } from "@/lib/catalog";
import { LessonCard } from "@/components/lesson-card";
export function generateStaticParams() {
  return teachers.map((t) => ({ slug: t.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const teacher = teachers.find((t) => t.slug === slug);
  if (!teacher) notFound();
  return (
    <div className="page-wrap">
      <nav className="breadcrumb">
        <Link href="/teachers">Teachers</Link>
        <span>/</span>
        <span>{teacher.name}</span>
      </nav>
      <header className="teacher-profile">
        <img src={teacher.image} alt={teacher.name} />
        <div>
          <p className="eyebrow">OUR TEACHERS</p>
          <h1>{teacher.name}</h1>
          <p>{teacher.description}</p>
          <a className="button button-secondary" href={teacher.legacyUrl}>
            Visit the complete archive ↗
          </a>
        </div>
      </header>
      <section className="section">
        <div className="section-heading">
          <h2>Explore the teachings</h2>
        </div>
        <div className="card-grid">
          {lessons
            .filter((l) => l.speaker === teacher.name)
            .map((l) => (
              <LessonCard key={l.slug} lesson={l} />
            ))}
        </div>
      </section>
    </div>
  );
}
