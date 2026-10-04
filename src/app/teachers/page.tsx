import Link from "next/link";
import { teachers } from "@/lib/catalog";
import { ArrowRight } from "lucide-react";
export const metadata = { title: "Our teachers" };
export default function Page() {
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">A LIVING TRADITION</p>
        <h1>Our teachers</h1>
        <p>
          Meet the voices bringing the teachings of Rebbe Nachman into everyday
          life.
        </p>
      </header>
      <div className="teacher-grid">
        {teachers.map((t) => (
          <Link
            href={`/teachers/${t.slug}`}
            className="teacher-card"
            key={t.slug}
          >
            <img src={t.image} alt={t.name} />
            <div>
              <h2>{t.name}</h2>
              <p>{t.description}</p>
              <span>
                Explore teachings <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
