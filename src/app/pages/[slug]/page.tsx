import { notFound } from "next/navigation";
import { getPublicPages } from "@/lib/catalog";
import { ServiceForm } from "@/components/service-form";
import { donationForms } from "@/lib/donations";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getPublicPages().find((p) => p.slug === slug);
  if (!p) notFound();
  const f = donationForms.find((f) => f.slug === slug);
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
      {f && <ServiceForm url={f.url} title="community form" />}
      <div className="section">
        <a className="button button-secondary" href={p.legacyUrl}>
          Open the original page ↗
        </a>
      </div>
    </div>
  );
}
