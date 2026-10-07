import { createHash, randomUUID } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { dataDirectory, logAudit } from "@/lib/store";
import {
  assertSameOrigin,
  authDb,
  hashPassword,
  createSession,
  rateLimit,
  readJson,
} from "@/lib/auth";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit("admin-setup");
    const body = await readJson(request),
      file = resolve(dataDirectory, "admin-setup.json");
    let setup: { tokenHash: string; expires: number };
    try {
      setup = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      throw Error("Setup link is unavailable or has already been used");
    }
    if (
      Date.now() > setup.expires ||
      createHash("sha256")
        .update(String(body.token || ""))
        .digest("hex") !== setup.tokenHash
    )
      throw Error("Setup link is invalid or expired");
    const email = String(body.email || "")
        .trim()
        .toLowerCase(),
      password = String(body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      throw Error("Enter a valid email address");
    if (password.length < 12 || password.length > 256)
      throw Error("Use a password of 12–256 characters");
    const db = authDb();
    if (db.prepare("SELECT id FROM users WHERE role='admin'").get())
      throw Error("An administrator already exists");
    const old = db.prepare("SELECT id FROM users WHERE email=?").get(email) as
        { id: string } | undefined,
      id = old?.id || randomUUID();
    if (old)
      db.prepare(
        "UPDATE users SET role='admin',password_hash=? WHERE id=?",
      ).run(hashPassword(password), id);
    else
      db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?,?)").run(
        id,
        email,
        "Administrator",
        hashPassword(password),
        "admin",
        null,
        new Date().toISOString(),
      );
    unlinkSync(file);
    logAudit(id, "admin_setup", id);
    await createSession(id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error ? e.message : "Unable to set up administrator",
      },
      { status: 400 },
    );
  }
}
