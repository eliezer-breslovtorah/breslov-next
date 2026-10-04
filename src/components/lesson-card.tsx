import Link from "next/link";
import { Headphones, ArrowUpRight } from "lucide-react";
import type { Lesson } from "@/lib/content";
export function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <Link className="lesson-card" href={`/lessons/${lesson.slug}`}>
      <div className="card-art">
        <img src={lesson.image} alt="" />
        <span className="media-badge">
          <Headphones size={14} />
          {lesson.format}
        </span>
      </div>
      <div className="card-body">
        <span className="eyebrow">{lesson.collection}</span>
        <h3>{lesson.title}</h3>
        <p>{lesson.speaker}</p>
        <div className="meta">
          <span>{lesson.duration || "Explore lesson"}</span>
          <ArrowUpRight size={18} />
        </div>
      </div>
    </Link>
  );
}
