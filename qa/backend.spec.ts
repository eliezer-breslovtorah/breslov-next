import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, createHash } from "node:crypto";

// Explicit opt-in: this suite creates accounts and lessons in an isolated server.
// Never enable against the public preview or a production database.
test.beforeEach(({}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Backend mutations run once on desktop; responsive admin QA covers all widths separately.",
  );
});
const isolated =
  process.env.QA_ALLOW_WRITES === "1" &&
  /^http:\/\/(127\.0\.0\.1|localhost):/.test(process.env.QA_BASE_URL || "");
test.describe("isolated publishing and access workflows", () => {
  test.skip(
    !isolated,
    "Set QA_ALLOW_WRITES=1 and an isolated localhost server/data directory.",
  );
  test("owner setup, publish, protected playback, accounts and CSRF", async ({
    playwright,
    baseURL,
  }) => {
    const origin = baseURL!;
    const owner = await playwright.request.newContext({
      baseURL: origin,
      extraHTTPHeaders: { Origin: origin },
    });
    const guest = await playwright.request.newContext({
      baseURL: origin,
      extraHTTPHeaders: { Origin: origin },
    });
    const token = randomBytes(32).toString("hex"),
      dir = process.env.QA_DATA_DIR;
    if (!dir)
      throw Error(
        "QA_DATA_DIR must point to the isolated server data directory",
      );
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "admin-setup.json"),
      JSON.stringify({
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expires: Date.now() + 600000,
      }),
      { mode: 0o600 },
    );
    const email = `qa-owner-${Date.now()}@example.test`,
      password = "Test-only-password-9381";
    const setup = await owner.post("/api/admin/setup", {
      data: { token, email, name: "QA Owner", password },
    });
    expect(setup.status()).toBe(200);
    const replay = await guest.post("/api/admin/setup", {
      data: { token, email, password },
    });
    expect(replay.ok()).toBe(false);
    const login = await owner.post("/api/auth/login", {
      data: { email, password },
    });
    expect(login.status()).toBe(200);
    const learnerEmail = `qa-user-${Date.now()}@example.test`;
    expect(
      (
        await guest.post("/api/auth/signup", {
          data: { email: learnerEmail, name: "QA Learner", password },
        })
      ).status(),
    ).toBe(200);
    const fields = {
      slug: `qa-publishing-${Date.now()}`,
      title: "QA publishing access teaching",
      speaker: "QA Teacher",
      collection: "QA Collection",
      topic: "Testing",
      description: "Isolated workflow verification",
      bodyText: "Full teaching description",
      duration: "0:01",
      format: "Audio",
      status: "draft",
      access: "public",
      categories: "",
      dedication: "QA dedication",
    };
    const denied = await guest.post("/api/admin/lessons", {
      multipart: fields,
    });
    expect(denied.ok()).toBe(false);
    const draft = await owner.post("/api/admin/lessons", {
      multipart: {
        ...fields,
        media: {
          name: "test.mp3",
          mimeType: "audio/mpeg",
          buffer: Buffer.from("ID3" + "0".repeat(120)),
        },
      },
    });
    expect(draft.status()).toBe(200);
    const saved = await draft.json();
    expect((await guest.get(`/lessons/${saved.slug}`)).status()).toBe(404);
    expect((await guest.get(`/api/media/${saved.id}`)).status()).toBe(404);
    const publish = await owner.post("/api/admin/lessons", {
      multipart: { ...fields, id: saved.id, status: "publish" },
    });
    expect(publish.status()).toBe(200);
    expect((await guest.get(`/lessons/${saved.slug}`)).status()).toBe(200);
    const range = await guest.get(`/api/media/${saved.id}`, {
      headers: { Range: "bytes=0-2" },
    });
    expect(range.status()).toBe(206);
    expect(await range.text()).toBe("ID3");
    expect(
      (
        await guest.get(`/api/media/${saved.id}`, {
          headers: { Range: "bytes=900-" },
        })
      ).status(),
    ).toBe(416);
    expect(
      (
        await guest.post("/api/account/bookmarks", {
          data: { lessonId: saved.id },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await guest.post("/api/account/history", {
          data: { lessonId: saved.id, position: 12 },
        })
      ).status(),
    ).toBe(200);
    const member = await owner.post("/api/admin/lessons", {
      multipart: {
        ...fields,
        id: saved.id,
        status: "publish",
        access: "members",
      },
    });
    expect(member.status()).toBe(200);
    expect((await guest.get(`/api/media/${saved.id}`)).status()).toBe(403);
    expect((await owner.get(`/api/media/${saved.id}`)).status()).toBe(200);
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(path.join(dir, "breslov.sqlite"));
    const learner = db
      .prepare("SELECT id FROM users WHERE email=?")
      .get(learnerEmail) as { id: string };
    expect(
      (
        await owner.post("/api/admin/members", {
          data: { id: learner.id, role: "member", memberUntil: "2099-01-01" },
        })
      ).status(),
    ).toBe(200);
    expect((await guest.get(`/api/media/${saved.id}`)).status()).toBe(200);
    expect(
      (
        await owner.post("/api/admin/members", {
          data: { id: learner.id, role: "member", memberUntil: "2000-01-01" },
        })
      ).status(),
    ).toBe(200);
    expect((await guest.get(`/api/media/${saved.id}`)).status()).toBe(403);
    expect(
      (
        await owner.post("/api/admin/taxonomy", {
          data: {
            kind: "collection",
            slug: "qa-course",
            title: "QA Course",
            description: "QA hierarchy",
            taxonomy: "courses",
          },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await owner.post("/api/admin/taxonomy", {
          data: {
            kind: "teacher",
            slug: "qa-teacher",
            title: "QA Teacher",
            description: "QA biography",
          },
        })
      ).status(),
    ).toBe(200);
    expect((await guest.get("/courses/qa-course")).status()).toBe(200);
    expect((await guest.get("/teachers/qa-teacher")).status()).toBe(200);
    const reset = await owner.post("/api/admin/password-reset", {
      data: { id: learner.id },
    });
    expect(reset.status()).toBe(200);
    const resetToken = new URL((await reset.json()).url).searchParams.get(
      "token",
    );
    const newPassword = "Reset-test-password-8239";
    expect(
      (
        await guest.post("/api/account/reset", {
          data: { token: resetToken, password: newPassword },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await guest.post("/api/account/bookmarks", {
          data: { lessonId: saved.id },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await guest.post("/api/account/reset", {
          data: { token: resetToken, password: newPassword },
        })
      ).ok(),
    ).toBe(false);
    expect(
      (
        await guest.post("/api/auth/login", {
          data: { email: learnerEmail, password },
        })
      ).ok(),
    ).toBe(false);
    expect(
      (
        await guest.post("/api/auth/login", {
          data: { email: learnerEmail, password: newPassword },
        })
      ).status(),
    ).toBe(200);
    db.close();
    const evil = await owner.post("/api/admin/lessons", {
      headers: { Origin: "https://untrusted.example" },
      multipart: { ...fields, id: saved.id, status: "publish" },
    });
    expect(evil.ok()).toBe(false);
    const search = await guest.get("/api/search?q=%22%20OR%201%3D1");
    expect(search.status()).toBe(200);
    expect((await guest.post("/api/auth/logout")).status()).toBe(200);
    expect(
      (
        await guest.post("/api/account/bookmarks", {
          data: { lessonId: saved.id },
        })
      ).status(),
    ).toBe(401);
    await owner.dispose();
    await guest.dispose();
  });
});

test("imported WordPress passwords upgrade locally on login", async ({
  playwright,
  baseURL,
}) => {
  test.skip(!isolated, "Requires isolated writable QA database.");
  const { DatabaseSync } = await import("node:sqlite");
  const dir = process.env.QA_DATA_DIR;
  if (!dir) throw Error("QA_DATA_DIR required");
  const db = new DatabaseSync(path.join(dir, "breslov.sqlite"));
  const hashes = JSON.parse(
    fs.readFileSync("qa/password-fixtures.json", "utf8"),
  );
  const origin = baseURL!,
    client = await playwright.request.newContext({
      baseURL: origin,
      extraHTTPHeaders: { Origin: origin },
    });
  for (const [index, hash] of hashes.entries()) {
    const id = `qa-legacy-${index}-${Date.now()}`,
      email = `${id}@example.test`;
    db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?,?)").run(
      id,
      email,
      "Synthetic legacy learner",
      hash,
      "user",
      null,
      new Date().toISOString(),
    );
    expect(
      (
        await client.post("/api/auth/login", {
          data: { email, password: "wrong-password" },
        })
      ).ok(),
    ).toBe(false);
    expect(
      (
        await client.post("/api/auth/login", {
          data: { email, password: "Synthetic-compatibility-9381" },
        })
      ).status(),
    ).toBe(200);
    const row = db
      .prepare("SELECT password_hash FROM users WHERE id=?")
      .get(id) as { password_hash: string };
    expect(row.password_hash.startsWith("scrypt:")).toBe(true);
    await client.post("/api/auth/logout");
  }
  db.close();
  await client.dispose();
});
