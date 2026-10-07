import { randomUUID } from "node:crypto";
import {
  assertSameOrigin,
  authDb,
  hashPassword,
  verifyPassword,
  rateLimit,
  createSession,
  logout,
  getCurrentUser,
  readJson,
} from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    assertSameOrigin(request);
    const { action } = await params;
    if (action === "logout") {
      await logout();
      return Response.json({ ok: true });
    }
    const body = await readJson(request);
    const email = String(body.email || "")
        .trim()
        .toLowerCase(),
      password = String(body.password || "");
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    rateLimit(`auth-ip:${ip}`, 50);
    rateLimit(`auth-account:${email}`, 10);
    const db = authDb();
    if (action === "password") {
      const user = await getCurrentUser();
      if (!user)
        return Response.json({ error: "Sign in first" }, { status: 401 });
      const row = db
        .prepare("SELECT password_hash FROM users WHERE id=?")
        .get(user.id) as { password_hash: string };
      if (
        !(await verifyPassword(
          String(body.currentPassword || ""),
          row.password_hash,
        ))
      )
        throw Error("Current password is incorrect");
      if (password.length < 12 || password.length > 256)
        throw Error("Use a password of 12–256 characters");
      db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
        hashPassword(password),
        user.id,
      );
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
      await createSession(user.id);
      return Response.json({ ok: true });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      throw Error("Enter a valid email address");
    if (
      (action !== "login" && password.length < 12) ||
      !password.length ||
      password.length > 256
    )
      throw Error("Use a password of 12–256 characters");
    if (action === "signup") {
      if (db.prepare("SELECT id FROM users WHERE email=?").get(email))
        throw Error("Unable to create this account. Try signing in instead.");
      const id = randomUUID(),
        name = String(body.name || "")
          .trim()
          .slice(0, 120);
      if (!name) throw Error("Enter your name");
      db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?,?)").run(
        id,
        email,
        name,
        hashPassword(password),
        "user",
        null,
        new Date().toISOString(),
      );
      await createSession(id);
      return Response.json({ ok: true });
    }
    if (action !== "login")
      return Response.json({ error: "Not found" }, { status: 404 });
    const row = db
      .prepare("SELECT id,password_hash FROM users WHERE email=?")
      .get(email) as { id: string; password_hash: string } | undefined;
    if (!row || !(await verifyPassword(password, row.password_hash)))
      throw Error("Email or password is incorrect");
    if (!row.password_hash.startsWith("scrypt:"))
      db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
        hashPassword(password),
        row.id,
      );
    await createSession(row.id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to complete request" },
      { status: 400 },
    );
  }
}
