import "server-only";
import { cookies } from "next/headers";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyLegacyPassword } from "./legacy-password";
import { getDb, dataDirectory } from "./store";
export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member" | "user";
  memberUntil?: string;
};
const cookieName = "breslov_session";
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  if (!hash.startsWith("scrypt:")) return verifyLegacyPassword(password, hash);
  const [, salt, value] = hash.split(":");
  try {
    const actual = scryptSync(password, salt, 64),
      expected = Buffer.from(value, "hex");
    return (
      expected.length === actual.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}
export function authDb() {
  const db = getDb();
  db.exec(
    `CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',member_until TEXT,created_at TEXT NOT NULL);CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS auth_rate_limits(key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,reset_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS bookmarks(user_id TEXT NOT NULL REFERENCES users(id),lesson_id TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(user_id,lesson_id));CREATE TABLE IF NOT EXISTS listening_history(user_id TEXT NOT NULL REFERENCES users(id),lesson_id TEXT NOT NULL,position REAL NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,PRIMARY KEY(user_id,lesson_id));`,
  );
  const source = resolve(dataDirectory, "import-users.json");
  if (
    existsSync(source) &&
    Number(
      (db.prepare("SELECT COUNT(*) n FROM users").get() as { n: number }).n,
    ) === 0
  ) {
    const users = JSON.parse(readFileSync(source, "utf8"));
    const insert = db.prepare(
      "INSERT OR IGNORE INTO users VALUES(?,?,?,?,?,?,?)",
    );
    for (const user of users) {
      if (user.email && user.passwordHash)
        insert.run(
          String(user.id),
          String(user.email).toLowerCase(),
          String(user.name || "Learner"),
          user.passwordHash,
          user.role === "member" ? "member" : "user",
          user.memberUntil || null,
          new Date().toISOString(),
        );
    }
  }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    password = process.env.ADMIN_PASSWORD;
  if (
    email &&
    password &&
    password.length >= 12 &&
    !db.prepare("SELECT id FROM users WHERE email=?").get(email)
  )
    db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?,?)").run(
      randomUUID(),
      email,
      "Administrator",
      hashPassword(password),
      "admin",
      null,
      new Date().toISOString(),
    );
  return db;
}
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const row = authDb()
    .prepare(
      "SELECT u.id,u.email,u.name,u.role,u.member_until AS memberUntil FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?",
    )
    .get(digest(token), Date.now()) as User | undefined;
  return row || null;
}
export function canAccessMembers(user: User | null) {
  return (
    !!user &&
    (user.role === "admin" ||
      (user.role === "member" &&
        (!user.memberUntil || Date.parse(user.memberUntil) > Date.now())))
  );
}
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") throw Error("Administrator access required");
  return user;
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (!origin || origin !== expected) throw Error("Invalid request origin");
}
export function rateLimit(key: string, maximum = 10) {
  const db = authDb(),
    now = Date.now();
  const row = db
    .prepare("SELECT attempts,reset_at FROM auth_rate_limits WHERE key=?")
    .get(digest(key)) as { attempts: number; reset_at: number } | undefined;
  if (row && row.reset_at > now && row.attempts >= maximum)
    throw Error("Too many attempts. Please try again in 15 minutes.");
  db.prepare(
    "INSERT INTO auth_rate_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,reset_at=excluded.reset_at",
  ).run(
    digest(key),
    row && row.reset_at > now ? row.attempts + 1 : 1,
    row && row.reset_at > now ? row.reset_at : now + 900000,
  );
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex"),
    expires = Date.now() + 604800000;
  authDb()
    .prepare("INSERT INTO sessions VALUES(?,?,?)")
    .run(digest(token), userId, expires);
  const secure = (process.env.APP_ORIGIN || "").startsWith("https://");
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 604800,
  });
}
export async function logout() {
  const jar = await cookies(),
    token = jar.get(cookieName)?.value;
  if (token)
    authDb()
      .prepare("DELETE FROM sessions WHERE token_hash=?")
      .run(digest(token));
  jar.delete(cookieName);
}
export function publicUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: row.role as User["role"],
    memberUntil: row.member_until ? String(row.member_until) : undefined,
  };
}

export async function readJson(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 16384)
    throw Error("Request is too large");
  const reader = request.body?.getReader();
  if (!reader) throw Error("Request body required");
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16384) {
      await reader.cancel();
      throw Error("Request is too large");
    }
    chunks.push(value);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw Error("Invalid request body");
  return body as Record<string, unknown>;
}
