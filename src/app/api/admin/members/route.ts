import { readJson, assertSameOrigin, requireAdmin, authDb } from "@/lib/auth";
import { logAudit } from "@/lib/store";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(),
      body = await readJson(request);
    if (!["user", "member"].includes(String(body.role)))
      throw Error("Choose learner or member");
    const row = authDb()
      .prepare("SELECT role FROM users WHERE id=?")
      .get(String(body.id)) as { role: string } | undefined;
    if (!row || row.role === "admin") throw Error("Member not found");
    let until: string | null = null;
    if (body.memberUntil) {
      const date = new Date(String(body.memberUntil) + "T23:59:59.000Z");
      if (!Number.isFinite(date.getTime()))
        throw Error("Enter a valid expiry date");
      until = date.toISOString();
    }
    authDb()
      .prepare("UPDATE users SET role=?,member_until=? WHERE id=?")
      .run(String(body.role), until, String(body.id));
    logAudit(admin.id, "membership_update", String(body.id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to update member" },
      { status: 400 },
    );
  }
}
