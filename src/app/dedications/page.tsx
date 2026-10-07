import Link from "next/link";
import { donationForms } from "@/lib/donations";
export const metadata = { title: "Dedicate a teaching" };
export default function Page() {
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">A GIFT WITH LASTING MEANING</p>
        <h1>Dedications &amp; sponsorships</h1>
        <p>
          Honor a loved one, mark an occasion, or support a teaching that has
          touched your life. Choose a dedication below, or use Dedicate this
          lesson on any teaching.
        </p>
      </header>
      <div className="support-grid">
        {donationForms
          .filter((f) => f.group === "Dedications")
          .map((f) => (
            <Link
              className="support-card"
              href={`/donate/${f.slug}`}
              key={f.slug}
            >
              <h2>{f.title}</h2>
              <span>Dedicate &amp; support →</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
