import { LearningConnection } from "@/components/learning-connection";
import { readBrowseQuery } from "@/lib/browse-query";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { legacyDestination } from "@/lib/page-navigation";
import { getCollection, getCollections, getLessons } from "@/lib/catalog";
import { Library, type BrowseQuery } from "@/components/library";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getCollection(slug);
  return {
    title: item?.title || "Teaching collection",
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
  const collection = getCollection(slug);
  if (!collection) {
    const target = legacyDestination(`/courses/${slug}`);
    if (target && target !== `/courses/${slug}`) redirect(target);
    notFound();
  }
  const raw = await searchParams;
  const query: BrowseQuery = readBrowseQuery(raw, ["category", "collection"]);
  query.sort = query.sort || "oldest";
  const result = getLessons({ ...query, category: slug });
  const all = getCollections();
  const parent = collection.parentId
    ? all.find((item) => item.sourceId === collection.parentId)
    : undefined;
  const children = all.filter(
    (item) => collection.sourceId && item.parentId === collection.sourceId,
  );
  return (
    <div className="page-wrap">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/courses">Courses</Link>
        <span>/</span>
        {parent && (
          <>
            <Link href={`/courses/${encodeURIComponent(parent.slug)}`}>
              {parent.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span>{collection.title}</span>
      </nav>
      <header className="page-heading">
        <p className="eyebrow">GUIDED LEARNING</p>
        <h1>{collection.title}</h1>
        {collection.hebrewTitle && (
          <p lang="he" dir="rtl" className="collection-hebrew">
            {collection.hebrewTitle}
          </p>
        )}
        <p>
          {collection.description ||
            "Explore this collection of Breslov teachings."}
        </p>
      </header>
      {children.length > 0 && (
        <section
          className="collection-children"
          aria-label="Sections in this collection"
        >
          <h2>Explore a section</h2>
          <div className="topics">
            {children.map((item) => (
              <Link
                className="topic-pill"
                key={item.slug}
                href={`/courses/${encodeURIComponent(item.slug)}`}
              >
                {item.title} →
              </Link>
            ))}
          </div>
        </section>
      )}
      <p>
        <Link
          className="button button-secondary"
          href={`/courses/${encodeURIComponent(slug)}?sort=sequence`}
        >
          Study in text / lesson order →
        </Link>
      </p>
      <Library
        result={result}
        query={query}
        basePath={`/courses/${encodeURIComponent(slug)}`}
        fixedCategory={slug}
      />
      <LearningConnection subject={collection.title} />
    </div>
  );
}
