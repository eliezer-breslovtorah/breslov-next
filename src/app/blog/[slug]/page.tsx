import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getArticles } from "@/lib/articles";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article?.title || "Article", description: article?.excerpt };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const all = getArticles();
  const index = all.findIndex((item) => item.slug === slug);
  const previous = all[index - 1];
  const next = all[index + 1];
  return (
    <div className="page-wrap">
      <Link href="/blog">← All articles</Link>
      <header className="page-heading">
        <h1>{article.title}</h1>
        <time dateTime={article.publishedAt}>
          {new Date(article.publishedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}
        </time>
      </header>
      {article.images.length > 0 && (
        <div className="article-original-images">
          {article.images.map((image, index) => (
            <img
              key={index}
              src={image.src}
              alt={image.alt}
              loading="lazy"
              style={{ maxWidth: "100%", height: "auto", borderRadius: 12 }}
            />
          ))}
        </div>
      )}
      {!article.bodyText && (
        <p className="prose">
          This archive entry contains no article text.{" "}
          <Link href={`/library?q=${encodeURIComponent(article.title)}`}>
            Search related teachings in the library →
          </Link>
        </p>
      )}
      <article className="prose imported-copy">
        {article.bodyText
          .split(/\n+/)
          .filter(Boolean)
          .map((text, index) => (
            <p key={index}>{text}</p>
          ))}
      </article>
      {article.links.length > 0 && (
        <section className="section">
          <h2>Resources</h2>
          <div className="page-resource-links">
            {article.links.map((link, index) =>
              link.href.startsWith("/") ? (
                <Link key={index} href={link.href}>
                  {link.label} →
                </Link>
              ) : (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label} ↗
                </a>
              ),
            )}
          </div>
        </section>
      )}
      <nav className="pagination blog-article-nav" aria-label="More articles">
        {previous && (
          <Link href={`/blog/${previous.slug}`}>← {previous.title}</Link>
        )}
        {next && <Link href={`/blog/${next.slug}`}>{next.title} →</Link>}
      </nav>
    </div>
  );
}
