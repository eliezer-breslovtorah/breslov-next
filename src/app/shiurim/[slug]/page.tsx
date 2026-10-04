import { redirect, notFound } from "next/navigation";
import { lessons } from "@/lib/catalog";
export default async function LegacyLesson({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = lessons.find(
    (l) =>
      l.slug === slug || new URL(l.legacyUrl).pathname === `/shiurim/${slug}/`,
  );
  if (!lesson) notFound();
  redirect(`/lessons/${lesson.slug}`);
}
