import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findDonationForm } from "@/lib/donations";
import { nativePages } from "@/lib/page-navigation";
import { ServiceForm } from "@/components/service-form";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { slug } = await params;
  const { lesson } = await searchParams;
  const f = findDonationForm(slug);
  if (!f) notFound();
  if (f.group === "Community" && nativePages[f.slug])
    redirect(nativePages[f.slug]);
  const url = new URL(f.url);
  if (lesson) url.searchParams.set("shiurname", lesson.slice(0, 600));
  return (
    <div className="page-wrap">
      <nav className="breadcrumb">
        <Link href="/donate">Support Breslov Torah</Link>
        <span>/</span>
        <span>{f.group}</span>
      </nav>
      <header className="page-heading">
        <p className="eyebrow">{f.group}</p>
        <h1>{f.title}</h1>
        <p>
          Make a meaningful gift through Breslov Torah’s existing donation
          service.
        </p>
        {lesson && (
          <p>
            For the teaching: <strong>{lesson}</strong>
          </p>
        )}
      </header>
      <ServiceForm url={url.toString()} title="donation form" />
      <section className="prose section">
        <p>
          Payments and receipts are processed by the Breslov Torah donation
          service. Return to this site whenever you are ready to continue
          learning.
        </p>
        <Link href="/library">Return to the lesson library →</Link>
      </section>
    </div>
  );
}
