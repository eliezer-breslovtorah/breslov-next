import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLessonById, getCollections } from "@/lib/store";
import { AdminEditor } from "@/components/admin-editor";
export const dynamic = "force-dynamic";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");
  const { id } = await params,
    lesson = id === "new" ? undefined : getLessonById(id, true);
  if (id !== "new" && !lesson) notFound();
  return (
    <div className="container section">
      <h1>{lesson ? "Edit lesson" : "New lesson"}</h1>
      <AdminEditor lesson={lesson} collections={getCollections()} />
    </div>
  );
}
