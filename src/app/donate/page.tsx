import Link from "next/link";
import { donationForms } from "@/lib/donations";
export const metadata = { title: "Support Breslov Torah" };
export default function Page() {
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">SHARE THE LIGHT OF TORAH</p>
        <h1>Support the learning.</h1>
        <p>
          Help preserve these teachings, support families, and bring Torah to
          more people.
        </p>
      </header>
      <section className="support-intro">
        <Link className="button" href="/donate/donate-by-credit-card">
          Give by credit card
        </Link>
        <Link
          className="button button-secondary"
          href="/donate/donate-by-paypal"
        >
          Give with PayPal
        </Link>
        <Link className="button button-secondary" href="/dedications">
          Dedicate a teaching
        </Link>
      </section>
      {["Membership", "Dedications", "Prayer", "Holiday giving", "Support"].map(
        (group) => (
          <section className="section" key={group}>
            <div className="section-heading">
              <h2>
                {group === "Membership" ? "Become a monthly supporter" : group}
              </h2>
            </div>
            <div className="support-grid">
              {donationForms
                .filter((f) => f.group === group)
                .map((f) => (
                  <Link
                    key={f.slug}
                    href={`/donate/${f.slug}`}
                    className="support-card"
                  >
                    <h3>{f.title}</h3>
                    <span>Learn more &amp; give →</span>
                  </Link>
                ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
