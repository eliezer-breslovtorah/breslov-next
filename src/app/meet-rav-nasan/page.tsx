import Link from "next/link";
import { RAV_NASAN_SAMPLES } from "@/lib/learning-paths";
import { teacherBiographyParagraphs } from "@/lib/teacher-biographies";
import { getTeachers } from "@/lib/catalog";
import { ShortClips } from "@/components/home-media";
import { LearningConnection } from "@/components/learning-connection";
import "@/app/learning-journeys.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Meet Rav Nasan through his teaching" };
export default function Page() {
  const teacher = getTeachers().find((t) => t.slug === "nasan-maimon");
  return (
    <div className="page-wrap learning-journeys">
      <header className="page-heading">
        <p className="eyebrow">A FEW MINUTES WITH RAV NASAN</p>
        <h1>Meet Rav Nasan through his teaching.</h1>
        <p>
          Hear his approach to the first step, being less alone, and the value
          of every good thought. These three short excerpts take less than five
          minutes altogether.
        </p>
      </header>
      <ShortClips items={RAV_NASAN_SAMPLES} />
      <section className="section journey-teacher">
        <img
          src={teacher?.image || "/images/rabbi-nasan-maimon.jpg"}
          alt="Rabbi Nasan Maimon"
        />
        <div>
          <h2>Torah for everyday life</h2>
          {teacherBiographyParagraphs(
            "nasan-maimon",
            teacher?.description || "",
          ).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="journey-actions">
            <Link className="button" href="/teachers/nasan-maimon">
              Explore Rav Nasan’s lessons →
            </Link>
            <Link href="/projects">The Breslov work he supports →</Link>
          </div>
        </div>
      </section>
      <LearningConnection subject="Rav Nasan’s approach to Breslov" />
    </div>
  );
}
