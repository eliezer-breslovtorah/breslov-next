import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { assertSameOrigin, rateLimit } from "@/lib/auth";
import { communityForm } from "@/lib/community-forms";
import { inquiriesDb } from "@/lib/inquiries";
import { dataDirectory } from "@/lib/store";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  let storedFile: string | undefined;
  try {
    assertSameOrigin(request);
    rateLimit(
      "community-ip:" +
        (request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
          "local"),
      10,
    );
    const definition = communityForm((await params).slug);
    if (!definition)
      return Response.json({ error: "Form not found" }, { status: 404 });
    const maximum = 5 * 1024 * 1024;
    if (Number(request.headers.get("content-length") || 0) > maximum + 150000)
      throw Error("Submission is too large");
    const form = await request.formData();
    if (form.get("website")) return Response.json({ ok: true });
    let name = "",
      email = "",
      attachment: { path: string; mime: string } | undefined;
    const lines: string[] = [];
    for (const field of definition.fields) {
      const raw = form.get(`field_${field.id}`);
      if (field.type === "fileupload") {
        if (raw instanceof File && raw.size) {
          if (raw.size > maximum) throw Error("Photo must be 5 MB or smaller");
          const bytes = Buffer.from(await raw.arrayBuffer());
          const jpeg =
            bytes.length > 3 &&
            bytes[0] === 255 &&
            bytes[1] === 216 &&
            bytes[2] === 255;
          const png = bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
          if (!jpeg && !png) throw Error("Photo must be a JPEG or PNG image");
          const filename = randomUUID() + (jpeg ? ".jpg" : ".png");
          const dir = path.join(dataDirectory, "inquiry-attachments");
          await mkdir(dir, { recursive: true, mode: 0o700 });
          storedFile = path.join(dir, filename);
          await writeFile(storedFile, bytes, { mode: 0o600, flag: "wx" });
          attachment = {
            path: filename,
            mime: jpeg ? "image/jpeg" : "image/png",
          };
        }
        continue;
      }
      if (raw instanceof File) throw Error("Invalid form field");
      const value = String(raw || "").trim();
      if (
        (field.isRequired || field.type === "name" || field.type === "email") &&
        !value
      )
        throw Error(`${field.label} is required`);
      if (
        value.length >
        (["textarea", "list", "address"].includes(field.type) ? 5000 : 500)
      )
        throw Error(`${field.label} is too long`);
      if (
        field.type === "radio" &&
        value &&
        !field.choices.some((c) => c.value === value)
      )
        throw Error(`Choose a valid ${field.label.toLowerCase()}`);
      if (field.type === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254)
          throw Error("Enter a valid email address");
        email = value.toLowerCase();
      }
      if (field.type === "name") {
        if (value.length > 120)
          throw Error("Name must be 120 characters or fewer");
        name = value;
      }
      if (
        field.label === "Year of Birth" &&
        (!/^\d{4}$/.test(value) ||
          Number(value) < 1900 ||
          Number(value) > new Date().getFullYear())
      )
        throw Error("Enter a valid birth year");
      if (
        field.type === "number" &&
        value &&
        (!/^\d{1,3}$/.test(value) || Number(value) > 120)
      )
        throw Error("Enter a valid age");
      if (
        field.type === "date" &&
        value &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          !Number.isFinite(Date.parse(value)))
      )
        throw Error("Enter a valid birthdate");
      if (value) lines.push(`${field.label}:\n${value}`);
    }
    const db = inquiriesDb(),
      id = randomUUID();
    db.exec("BEGIN");
    try {
      db.prepare(
        "INSERT INTO inquiries(id,name,email,subject,message,status,created_at) VALUES(?,?,?,?,?,?,?)",
      ).run(
        id,
        name,
        email,
        definition.title,
        lines.join("\n\n"),
        "new",
        new Date().toISOString(),
      );
      if (attachment)
        db.prepare(
          "INSERT INTO inquiry_attachments(inquiry_id,path,mime) VALUES(?,?,?)",
        ).run(id, attachment.path, attachment.mime);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return Response.json({ ok: true });
  } catch (error) {
    if (storedFile) await unlink(storedFile).catch(() => {});
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit your questionnaire",
      },
      { status: 400 },
    );
  }
}
