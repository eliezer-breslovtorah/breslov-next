import { redirect, notFound } from "next/navigation";
import { legacyDestination } from "@/lib/page-navigation";
import { getLegacyLesson } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLegacyLesson(slug, "shiurim");
  if (!lesson) {
    const target = legacyDestination(`/shiurim/${slug}`);
    if (target) redirect(target);
    notFound();
  }
  redirect("/lessons/" + encodeURIComponent(lesson.slug));
}
