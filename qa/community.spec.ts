import { test, expect } from "@playwright/test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
const isolated =
  process.env.QA_ALLOW_WRITES === "1" &&
  /^http:\/\/(127\.0\.0\.1|localhost):/.test(process.env.QA_BASE_URL || "");
test("native matchmaking privately stores validated fields and staff-only photos", async ({
  playwright,
  baseURL,
}, info) => {
  test.skip(
    !isolated || info.project.name !== "desktop",
    "Requires isolated writable localhost QA server",
  );
  const origin = baseURL!,
    client = await playwright.request.newContext({
      baseURL: origin,
      extraHTTPHeaders: { Origin: origin },
    });
  const dbPath = process.env.QA_DATA_DIR;
  if (!dbPath) throw Error("QA_DATA_DIR is required");
  const fields = {
    field_1: "Synthetic matchmaking QA",
    field_2: "matchmaking-qa@example.test",
    field_7: "Male",
    field_5: "1980",
  };
  expect(
    (
      await client.post("/api/community/matchmaking", {
        multipart: { ...fields, field_7: "invalid" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await client.post("/api/community/matchmaking", {
        headers: { Origin: "https://invalid.example" },
        multipart: fields,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await client.post("/api/community/matchmaking", { multipart: fields })
    ).status(),
  ).toBe(200);
  const follow = {
    field_1: "Synthetic matchmaking photo QA",
    field_3: "matchmaking-photo-qa@example.test",
    field_4: {
      name: "photo.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1sAAAAASUVORK5CYII=",
        "base64",
      ),
    },
  };
  expect(
    (
      await client.post("/api/community/matchmaking-follow-up", {
        multipart: {
          ...follow,
          field_4: {
            name: "bad.png",
            mimeType: "image/png",
            buffer: Buffer.from("not an image"),
          },
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await client.post("/api/community/matchmaking-follow-up", {
        multipart: follow,
      })
    ).status(),
  ).toBe(200);
  const { DatabaseSync } = await import("node:sqlite"),
    db = new DatabaseSync(path.join(dbPath, "breslov.sqlite"));
  const row = db
    .prepare(
      "SELECT i.id,i.message,a.path FROM inquiries i JOIN inquiry_attachments a ON i.id=a.inquiry_id WHERE i.email=? ORDER BY i.created_at DESC LIMIT 1",
    )
    .get("matchmaking-photo-qa@example.test") as {
    id: string;
    message: string;
    path: string;
  };
  expect(row.message).toContain("Name:\nSynthetic matchmaking photo QA");
  expect(row.path).toMatch(/^[a-f0-9-]+\.png$/);
  expect(
    (await client.get(`/api/admin/inquiries/${row.id}/attachment`)).status(),
  ).toBe(403);
  // Seed a synthetic admin session only in the explicitly isolated QA database.
  await client.get("/account");
  const id = randomUUID(),
    token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?,?)").run(
    id,
    `${id}@example.test`,
    "Community QA staff",
    "unusable",
    "admin",
    null,
    new Date().toISOString(),
  );
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
    createHash("sha256").update(token).digest("hex"),
    id,
    Date.now() + 60000,
  );
  const response = await client.get(
    `/api/admin/inquiries/${row.id}/attachment`,
    { headers: { Cookie: `breslov_session=${token}` } },
  );
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  expect((await response.body()).length).toBeGreaterThan(8);
  db.close();
  await client.dispose();
});
test("matchmaking forms fit viewport and expose original choices", async ({
  page,
}) => {
  await page.goto("/community/matchmaking");
  await expect(
    page.getByRole("heading", { name: "Breslov matchmaking" }),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "Male", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/community/matchmaking/follow-up");
  await expect(
    page.getByRole("heading", { name: "Matchmaking follow-up questionnaire" }),
  ).toBeVisible();
  await expect(page.getByLabel("Photo Upload")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
