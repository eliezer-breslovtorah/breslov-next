import { createHash } from "node:crypto";
import {
  assertSameOrigin,
  authDb,
  readJson,
  hashPassword,
  rateLimit,
} from "@/lib/auth";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit(
      "reset-ip:" +
        (request.headers.get("x-forwarded-for")?.split(",")[0] || "local"),
      20,
    );
    const b = await readJson(request),
      password = String(b.password || "");
    if (password.length < 12 || password.length > 256)
      throw Error("Use a password of 12–256 characters");
    const db = authDb();
    db.exec(
      "CREATE TABLE IF NOT EXISTS password_resets(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL)",
    );
    const hash = createHash("sha256")
      .update(String(b.token || ""))
      .digest("hex");
    db.exec("BEGIN IMMEDIATE");
    try {
      const row = db
        .prepare(
          "SELECT user_id FROM password_resets WHERE token_hash=? AND expires>?",
        )
        .get(hash, Date.now()) as { user_id: string } | undefined;
      if (!row) throw Error("Reset link is invalid, expired, or already used");
      db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
        hashPassword(password),
        row.user_id,
      );
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(row.user_id);
      db.prepare("DELETE FROM password_resets WHERE user_id=?").run(
        row.user_id,
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to reset password" },
      { status: 400 },
    );
  }
}
