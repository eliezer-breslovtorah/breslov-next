import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeachers, getLessons } from "@/lib/catalog";
import { Library, type BrowseQuery } from "@/components/library";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getTeachers().find((item) => item.slug === slug);
  return {
    title: item?.name || "Teaching collection",
    description: item?.description.slice(0, 160),
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const teacher = getTeachers().find((item) => item.slug === slug);
  if (!teacher) notFound();
  const raw = await searchParams;
  const query: BrowseQuery = Object.fromEntries(
    ["q", "category", "topic", "format", "sort", "page"].map((key) => [
      key,
      typeof raw[key] === "string" ? raw[key] : undefined,
    ]),
  );
  const result = getLessons({ ...query, teacher: teacher.name });
  return (
    <div className="page-wrap">
      <nav className="breadcrumb" aria-label="Breadcrumb">
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
          <p>{result.total.toLocaleString()} teachings in the library</p>
        </div>
      </header>
      <section className="section">
        <div className="section-heading">
          <h2>Explore the teachings</h2>
        </div>
        <Library
          result={result}
          query={query}
          basePath={`/teachers/${encodeURIComponent(slug)}`}
          fixedTeacher={teacher.name}
        />
      </section>
    </div>
  );
}
