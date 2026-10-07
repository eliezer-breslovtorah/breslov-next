import { redirect, notFound } from "next/navigation";
import { getLegacyLesson } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLegacyLesson(slug, "shiurim");
  if (!lesson) notFound();
  redirect("/lessons/" + encodeURIComponent(lesson.slug));
}
