import { requireAdmin, assertSameOrigin, readJson } from "@/lib/auth";
import { inquiriesDb } from "@/lib/inquiries";
import { logAudit } from "@/lib/store";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(),
      body = await readJson(request),
      status = String(body.status || ""),
      id = String(body.id || "");
    if (!["new", "read", "resolved"].includes(status))
      throw Error("Choose a valid status");
    const result = inquiriesDb()
      .prepare("UPDATE inquiries SET status=? WHERE id=?")
      .run(status, id);
    if (!result.changes) throw Error("Message not found");
    logAudit(admin.id, "inquiry_status", id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to update inquiry" },
      { status: 400 },
    );
  }
}
