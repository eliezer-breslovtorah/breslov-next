import { test, expect } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
test("staff workflows fit each screen size", async ({ page }, info) => {
  test.skip(
    process.env.QA_ALLOW_WRITES !== "1" ||
      !process.env.QA_DATA_DIR ||
      !/^http:\/\/(127\.0\.0\.1|localhost):/.test(
        process.env.QA_BASE_URL || "",
      ),
    "Requires isolated seeded backend QA accounts.",
  );
  const db = new DatabaseSync(
    path.join(process.env.QA_DATA_DIR!, "breslov.sqlite"),
  );
  const owner = db
    .prepare(
      "SELECT email FROM users WHERE email LIKE 'qa-owner-%@example.test' AND role='admin' LIMIT 1",
    )
    .get() as { email: string };
  db.close();
  const login = await page.request.post("/api/auth/login", {
    headers: { Origin: process.env.QA_BASE_URL! },
    data: { email: owner.email, password: "Test-only-password-9381" },
  });
  expect(login.status()).toBe(200);
  fs.mkdirSync("qa/screenshots", { recursive: true });
  for (const route of [
    "/admin",
    "/admin/lessons/new",
    "/admin/members",
    "/admin/taxonomy",
    "/account",
  ]) {
    expect((await page.goto(route))?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
    await page.screenshot({
      path: `qa/screenshots/${info.project.name}-${route.replaceAll("/", "_")}.png`,
      fullPage: true,
    });
  }
});
