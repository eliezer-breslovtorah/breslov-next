import Link from "next/link";
import { donationForms } from "@/lib/donations";
export const metadata = { title: "Breslov Torah projects" };
export default function Page() {
  const forms = donationForms.filter((f) =>
    /restoration|newsletter|torah shiur|scholarship|emergency|shapell/i.test(
      f.title,
    ),
  );
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">SHARE THE LIGHT OF TORAH</p>
        <h1>Support Breslov Torah’s projects</h1>
        <p>
          Help preserve teachings, support Torah study, and care for our
          community.
        </p>
      </header>
      <div className="support-grid">
        {forms.map((f) => (
          <Link
            className="support-card"
            href={`/donate/${f.slug}`}
            key={f.slug}
          >
            <h2>{f.title}</h2>
            <span>Learn more &amp; support →</span>
          </Link>
        ))}
      </div>
      <section className="section">
        <Link className="button" href="/donate">
          All giving opportunities →
        </Link>
        <p>
          <Link href="/contact?subject=Breslov%20Torah%20projects">
            Ask about a project
          </Link>
        </p>
      </section>
    </div>
  );
}
