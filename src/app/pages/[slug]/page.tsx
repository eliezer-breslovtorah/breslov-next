import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPublicPages } from "@/lib/catalog";
import { nativePageDestination, publicPageLinks } from "@/lib/page-navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const native = nativePageDestination(slug);
  if (native) redirect(native);
  const p = getPublicPages().find((p) => p.slug === slug);
  if (!p) notFound();
  const links = publicPageLinks(slug);
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <h1>{p.title}</h1>
      </header>
      <article className="prose imported-copy">
        {p.bodyText
          .split(/\n+/)
          .filter(Boolean)
          .map((text, i) => (
            <p key={i}>{text}</p>
          ))}
      </article>
      {links.length > 0 && (
        <section className="section">
          <h2>Explore &amp; connect</h2>
          <div className="page-resource-links">
            {links.map((link, i) =>
              link.href.startsWith("/") ? (
                <Link key={i} href={link.href}>
                  {link.label} →
                </Link>
              ) : (
                <a key={i} href={link.href} target="_blank" rel="noreferrer">
                  {link.label} ↗
                </a>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
