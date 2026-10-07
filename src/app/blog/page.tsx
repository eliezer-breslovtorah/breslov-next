import Link from "next/link";
import { getArticles } from "@/lib/articles";
export const metadata = { title: "Articles & inspiration" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: requested = "1" } = await searchParams;
  const articles = getArticles();
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(articles.length / pageSize));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(requested, 10) || 1),
  );
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">BRESLOV TORAH</p>
        <h1>Articles &amp; inspiration</h1>
        <p>
          Torah insights, holiday teachings and reflections from our archive.
        </p>
      </header>
      <div className="collection-grid">
        {articles
          .slice((page - 1) * pageSize, page * pageSize)
          .map((article) => (
            <article className="collection-card" key={article.id}>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
              <h2>
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h2>
              <p>{article.excerpt}</p>
              <Link href={`/blog/${article.slug}`}>Read article →</Link>
            </article>
          ))}
      </div>
      <nav className="pagination" aria-label="Article pages">
        {page > 1 && <Link href={`/blog?page=${page - 1}`}>← Previous</Link>}
        <span>
          Page {page} of {pages}
        </span>
        {page < pages && <Link href={`/blog?page=${page + 1}`}>Next →</Link>}
      </nav>
    </div>
  );
}
