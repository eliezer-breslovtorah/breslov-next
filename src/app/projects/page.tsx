import Link from "next/link";
import { donationForms } from "@/lib/donations";
export const metadata = { title: "Connect through giving | Breslov projects" };

const projectGroups = [
  {
    title: "Teachings that reach more people",
    description:
      "Help share classes, preserve Rabbi Rosenfeld’s recordings, and bring Torah into everyday life.",
    slugs: [
      "torah-shiur",
      "weekly-parsha-newsletter",
      "dedicate-a-parsha-video",
      "day-of-streaming-torah-from-our-website",
      "sponsor-a-lunch-and-learn",
    ],
  },
  {
    title: "Torah study and community leadership",
    description:
      "Sustain learning at the kollel and help support the next generation of Breslov community leadership.",
    slugs: [
      "support-breslov-community-leadership-kollel",
      "torah-study-at-our-kollel",
    ],
  },
  {
    title: "Families and practical kindness",
    description:
      "Give toward Shabbos food, a young person’s tefillin, and a newlywed couple’s beginning. The existing emergency fund is also available here.",
    slugs: [
      "shabbos-food-basket",
      "bar-mitzvah-tefillin",
      "gift-to-a-newlywed-couple",
      "emergency-fund-for-ukrainian-jews",
    ],
  },
  {
    title: "Giving through the Jewish year",
    description:
      "Help families celebrate the holidays through established giving opportunities.",
    slugs: [
      "holiday-gift",
      "maos-chitim-charity-fund-for-pesach",
      "matanos-levyonim-charity-for-purim",
    ],
  },
];

export default function Page() {
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">CONNECT THROUGH GIVING</p>
        <h1>Bring Breslov teachings into action</h1>
        <p>
          Rav Nasan helps sustain a wide variety of Breslov organizations and
          activities. Giving tzedakah is a meaningful way to connect with that
          work: support Torah learning, share teachings, and care for people in
          the community.
        </p>
      </header>
      <div className="support-intro">
        <Link className="button" href="/donate">
          Give tzedakah →
        </Link>
        <Link
          className="button button-secondary"
          href="/contact?subject=Question%20for%20Rav%20Nasan%20about%20Breslov%20projects"
        >
          Ask Rav Nasan about giving
        </Link>
      </div>
      {projectGroups.map((group) => (
        <section className="section" key={group.title}>
          <div className="section-heading">
            <h2>{group.title}</h2>
          </div>
          <p>{group.description}</p>
          <div className="support-grid">
            {group.slugs.map((slug) => {
              const form = donationForms.find((f) => f.slug === slug);
              return form ? (
                <Link
                  className="support-card"
                  href={`/donate/${form.slug}`}
                  key={form.slug}
                >
                  <h3>{form.title}</h3>
                  <span>Learn more &amp; support →</span>
                </Link>
              ) : null;
            })}
          </div>
        </section>
      ))}
      <section className="section">
        <h2>Find your way to help</h2>
        <p>
          Explore all giving opportunities, including monthly support,
          dedications, and prayer requests. If you are unsure where to begin,
          ask the Breslov Torah team about the projects that interest you.
        </p>
        <div className="support-intro">
          <Link className="button" href="/donate">
            All giving opportunities →
          </Link>
          <Link
            className="button button-secondary"
            href="/contact?subject=Breslov%20Torah%20projects"
          >
            Ask about a project
          </Link>
        </div>
      </section>
    </div>
  );
}
