import Link from "next/link";
import { publicPageLinks } from "@/lib/page-navigation";
import { NewsletterForm } from "@/components/newsletter-form";
export const metadata = { title: "The Breslov Bridge newsletter" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: raw } = await searchParams;
  const unique = new Map<string, { href: string; label: string }>();
  for (const link of publicPageLinks("parsha-email-the-breslov-bridge"))
    if (link.href.startsWith("https://") && !link.label.includes("CLICK HERE"))
      unique.set(link.href, link);
  const issues = [...unique.values()];
  const pages = Math.max(1, Math.ceil(issues.length / 24));
  const page = Math.min(pages, Math.max(1, parseInt(raw || "1") || 1));
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">THE BRESLOV BRIDGE</p>
        <h1>Torah inspiration in your inbox</h1>
        <p>
          Weekly parsha teachings, community updates, and inspiration from
          Breslov Torah.
        </p>
      </header>
      <section className="detail-grid">
        <div>
          <h2>Join the mailing list</h2>
          <NewsletterForm />
          <p>
            <Link href="/account/signup">Create a free learning account →</Link>
          </p>
        </div>
        <aside className="prose">
          <h2>Explore past issues</h2>
          <p>
            Browse our published newsletter archive below. Each issue opens with
            the original newsletter provider.
          </p>
        </aside>
      </section>
      <section className="section">
        <h2>Newsletter archive</h2>
        <div className="support-grid">
          {issues.slice((page - 1) * 24, page * 24).map((issue) => (
            <a
              className="support-card"
              href={issue.href}
              target="_blank"
              rel="noreferrer"
              key={issue.href}
            >
              <h3>{issue.label}</h3>
              <span>Read issue ↗</span>
            </a>
          ))}
        </div>
        {pages > 1 && (
          <nav className="pagination" aria-label="Newsletter archive pages">
            {page > 1 && (
              <Link href={`/newsletter?page=${page - 1}`}>Previous</Link>
            )}
            <span>
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link href={`/newsletter?page=${page + 1}`}>Next</Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
