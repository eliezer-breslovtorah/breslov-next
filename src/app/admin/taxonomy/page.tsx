import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCollections, getTeachers } from "@/lib/store";
import { TaxonomyEditor } from "@/components/taxonomy-editor";
export const dynamic = "force-dynamic";
export default async function Taxonomy() {
  if ((await getCurrentUser())?.role !== "admin") redirect("/admin");
  return (
    <div className="container section">
      <h1>Categories and teachers</h1>
      <p>
        Create and edit courses, category descriptions, hierarchy, and teacher
        profiles.
      </p>
      <TaxonomyEditor collections={getCollections()} teachers={getTeachers()} />
    </div>
  );
}
