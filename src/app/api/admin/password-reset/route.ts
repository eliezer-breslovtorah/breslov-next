import { randomBytes, createHash } from "node:crypto";
import { requireAdmin, assertSameOrigin, authDb, readJson } from "@/lib/auth";
import { logAudit } from "@/lib/store";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(),
      body = await readJson(request),
      db = authDb();
    const id = String(body.id || "");
    if (!db.prepare("SELECT id FROM users WHERE id=?").get(id))
      throw Error("Account not found");
    db.exec(
      "CREATE TABLE IF NOT EXISTS password_resets(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL)",
    );
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM password_resets WHERE user_id=?").run(id);
    db.prepare("INSERT INTO password_resets VALUES(?,?,?)").run(
      createHash("sha256").update(token).digest("hex"),
      id,
      Date.now() + 1800000,
    );
    logAudit(admin.id, "password_reset_link", id);
    return Response.json(
      {
        url: `${process.env.APP_ORIGIN || new URL(request.url).origin}/account/reset?token=${token}`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to generate reset" },
      { status: 400 },
    );
  }
}
