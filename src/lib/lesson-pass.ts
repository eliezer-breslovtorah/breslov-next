import type { Lesson } from "@/lib/content";

export type LessonPass = "first" | "second";

export const LESSON_PASS_COLLECTIONS = [
  {
    pass: "first" as const,
    slug: "likutey-halakhos-first-pass",
    title: "Likutey Halakhos · First pass",
    description:
      "The numbered first-pass classes through Likutey Halakhos, including OC, YD, EH, and CM lessons.",
  },
  {
    pass: "second" as const,
    slug: "likutey-halakhos-second-pass",
    title: "Likutey Halakhos · Second pass",
    description:
      "The dated second-pass classes through Likutey Halakhos, with the original recording dates in their titles.",
  },
];

type PassLesson = Pick<Lesson, "title" | "collection" | "categories">;

function normalized(value: string) {
  return value.normalize("NFKC").replace(/[–—−]/g, "-").trim();
}

/** Only the Likutey Halakhos hierarchy, never generic Halakha classes. */
export function isLikuteyHalakhos(lesson: PassLesson): boolean {
  const title = normalized(lesson.title);
  return (
    /^LH[1-8](?:\b|-)/i.test(normalized(lesson.collection)) ||
    /likut(?:ey|ei)\s+halakh[oa]s/i.test(lesson.collection) ||
    /^(?:LH[1-8]\s*-|likut(?:ey|ei)\s+halakh[oa]s\b)/i.test(title) ||
    /^\d{4}-\d{2}-\d{2}\s*-\s*LH[1-8]\b/i.test(title) ||
    Boolean(
      lesson.categories?.some(
        (term) =>
          (term.taxonomy === "series" || term.taxonomy === "types") &&
          (/^lh[1-8](?:-|$)/i.test(term.slug) ||
            /likut(?:ey|ei)\s+halakh[oa]s/i.test(term.title)),
      ),
    )
  );
}

/** Preserve original titles; ambiguous clips and special classes stay unlabelled. */
export function getLessonPass(lesson: PassLesson): LessonPass | undefined {
  if (!isLikuteyHalakhos(lesson)) return undefined;
  const title = normalized(lesson.title);
  if (/^\d{4}-\d{2}-\d{2}\s*-/.test(title)) return "second";
  if (
    /^(?:(?:OC[1-3]|YD[12]|EH|CM[12])|likut(?:ey|ei)\s+halakh[oa]s)\s*-\s*Lesson\s+\d/i.test(
      title,
    )
  )
    return "first";
  return undefined;
}

export function lessonPassLabel(pass: LessonPass): string {
  return pass === "first" ? "First pass" : "Second pass";
}
