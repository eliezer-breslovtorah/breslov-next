import { requireAdmin, assertSameOrigin, readJson } from "@/lib/auth";
import {
  saveCollection,
  saveTeacher,
  logAudit,
  getCollections,
} from "@/lib/store";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(),
      b = await readJson(request);
    const slug = String(b.slug || "").slice(0, 240),
      description = String(b.description || "").slice(0, 10000),
      image = String(b.image || "/images/logo.png");
    if (!image.startsWith("/images/") || image.includes(".."))
      throw Error("Use an existing local image under /images/");
    if (b.kind === "teacher") {
      saveTeacher({
        slug,
        name: String(b.title || "").slice(0, 300),
        description,
        image,
        legacyUrl: "",
      });
    } else {
      const parentId = Number(b.parentId) || 0;
      if (parentId && !getCollections().some((c) => c.sourceId === parentId))
        throw Error("Parent category not found");
      saveCollection({
        slug,
        title: String(b.title || "").slice(0, 300),
        description,
        image,
        parentId,
        taxonomy: String(b.taxonomy || "courses"),
        legacyUrl: "",
      });
    }
    logAudit(admin.id, "save_taxonomy", slug);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to save" },
      { status: 400 },
    );
  }
}
