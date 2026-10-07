import Link from "next/link";
import { donationForms } from "@/lib/donations";
import { nativePages } from "@/lib/page-navigation";
import { getPublicPages } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">A LIVING COMMUNITY</p>
        <h1>Community, prayer &amp; connection</h1>
        <p>
          Connect with Rabbi Maimon, request a prayer, and explore the work of
          Breslov Torah.
        </p>
      </header>
      <div className="support-grid">
        {donationForms
          .filter((f) => ["Community", "Prayer"].includes(f.group))
          .map((f) => (
            <Link
              className="support-card"
              href={nativePages[f.slug] || `/donate/${f.slug}`}
              key={f.slug}
            >
              <h2>{f.title}</h2>
              <span>Open form →</span>
            </Link>
          ))}
      </div>
      <section className="section">
        <div className="section-heading">
          <h2>More from Breslov Torah</h2>
        </div>
        <div className="support-grid">
          {getPublicPages()
            .filter(
              (p) =>
                !p.slug.match(
                  /privacy|login|member|contact|thank|checkout|reset|payment|cancel/,
                ),
            )
            .map((p) => (
              <Link
                className="support-card"
                href={
                  nativePages[p.slug] || `/pages/${encodeURIComponent(p.slug)}`
                }
                key={p.slug}
              >
                <h3>{p.title}</h3>
                <span>Read more →</span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
