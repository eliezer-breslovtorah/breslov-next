import { notFound, redirect } from "next/navigation";
import { legacyDestination } from "@/lib/page-navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ legacyPath: string[] }>;
}) {
  const { legacyPath } = await params;
  const path = "/" + legacyPath.join("/");
  const target = legacyDestination(path);
  if (!target || target === path) notFound();
  redirect(target);
}
