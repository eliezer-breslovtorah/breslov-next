import Link from "next/link";
import { notFound } from "next/navigation";
import { collections, lessons } from "@/lib/catalog";
import { LessonCard } from "@/components/lesson-card";
export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = collections.find((c) => c.slug === slug);
  if (!c) notFound();
  const items = lessons.filter((l) => l.collection === c.title);
  return (
    <div className="page-wrap">
      <nav className="breadcrumb">
        <Link href="/courses">Courses</Link>
        <span>/</span>
        <span>{c.title}</span>
      </nav>
      <header className="page-heading">
        <p className="eyebrow">GUIDED LEARNING</p>
        <h1>{c.title}</h1>
        <p>{c.description}</p>
      </header>
      <div className="card-grid">
        {items.map((l) => (
          <LessonCard key={l.slug} lesson={l} />
        ))}
      </div>
      <div className="migration-note">
        <p>
          This preview includes a selection from the existing collection. The
          complete archive is available on Breslov Torah during the transition.
        </p>
        <a className="button button-secondary" href={c.legacyUrl}>
          Visit the full collection ↗
        </a>
      </div>
    </div>
  );
}
