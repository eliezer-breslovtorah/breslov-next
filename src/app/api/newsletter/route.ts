import { randomUUID } from "node:crypto";
import { assertSameOrigin, readJson, rateLimit } from "@/lib/auth";
import { inquiriesDb } from "@/lib/inquiries";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit(
      "newsletter-ip:" +
        (request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
          "local"),
      20,
    );
    const body = await readJson(request);
    if (body.website) return Response.json({ ok: true });
    const name = String(body.name || "").trim(),
      email = String(body.email || "")
        .trim()
        .toLowerCase();
    if (!name || name.length > 120) throw Error("Enter your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      throw Error("Enter a valid email address");
    if (body.consent !== true)
      throw Error("Please confirm that you want to receive the newsletter");
    const db = inquiriesDb();
    db.exec(
      "CREATE TABLE IF NOT EXISTS newsletter_requests(email TEXT PRIMARY KEY,name TEXT NOT NULL,consented_at TEXT NOT NULL)",
    );
    db.exec("BEGIN IMMEDIATE");
    try {
      if (
        !db
          .prepare("SELECT email FROM newsletter_requests WHERE email=?")
          .get(email)
      ) {
        const at = new Date().toISOString();
        db.prepare("INSERT INTO newsletter_requests VALUES(?,?,?)").run(
          email,
          name,
          at,
        );
        db.prepare("INSERT INTO inquiries VALUES(?,?,?,?,?,?,?)").run(
          randomUUID(),
          name,
          email,
          "Newsletter subscription request",
          "The visitor consented to receive the Breslov Bridge newsletter. Add this address to the mailing service after normal staff verification.",
          "new",
          at,
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to request subscription",
      },
      { status: 400 },
    );
  }
}
