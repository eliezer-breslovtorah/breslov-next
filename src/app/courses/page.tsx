import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { collections } from "@/lib/catalog";
export const metadata = { title: "Courses and series" };
export default function Page() {
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">ONE LESSON AT A TIME</p>
        <h1>Courses &amp; series</h1>
        <p>Build a deeper understanding through a focused path of learning.</p>
      </header>
      <div className="collection-grid">
        {collections.map((c, i) => (
          <Link
            className={`collection-card collection-${i % 3}`}
            key={c.slug}
            href={`/courses/${c.slug}`}
          >
            <BookOpen size={28} />
            <h2>{c.title}</h2>
            <p>{c.description}</p>
            <span>
              Explore course <ArrowRight size={18} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
