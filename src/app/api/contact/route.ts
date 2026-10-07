import { randomUUID } from "node:crypto";
import { assertSameOrigin, readJson, rateLimit } from "@/lib/auth";
import { inquiriesDb } from "@/lib/inquiries";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit(
      "contact-ip:" +
        (request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
          "local"),
      20,
    );
    const body = await readJson(request);
    if (body.website) return Response.json({ ok: true });
    const name = String(body.name || "").trim(),
      email = String(body.email || "")
        .trim()
        .toLowerCase(),
      subject = String(body.subject || "").trim(),
      message = String(body.message || "").trim();
    if (!name || name.length > 120)
      throw Error("Enter your name (up to 120 characters)");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      throw Error("Enter a valid email address");
    if (!subject || subject.length > 200)
      throw Error("Enter a subject (up to 200 characters)");
    if (message.length > 10000)
      throw Error("Message must be 10,000 characters or fewer");
    inquiriesDb()
      .prepare("INSERT INTO inquiries VALUES(?,?,?,?,?,?,?)")
      .run(
        randomUUID(),
        name,
        email,
        subject,
        message,
        "new",
        new Date().toISOString(),
      );
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to send your message" },
      { status: 400 },
    );
  }
}
