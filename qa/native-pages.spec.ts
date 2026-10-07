import { test, expect } from "@playwright/test";
const routes = [
  "/about",
  "/blog",
  "/contact",
  "/calendar",
  "/newsletter",
  "/projects",
  "/community",
  "/community/matchmaking",
  "/community/matchmaking/follow-up",
  "/pages/our-mission",
  "/pages/rabbi-nasan-maimons-weekly-class-schedule",
];
test("native community pages fit and avoid WordPress navigation", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
    const old = await page.locator("a[href]").evaluateAll((links) =>
      links
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((href) => {
          try {
            return ["www.breslovtorah.com", "breslovtorah.com"].includes(
              new URL(href).hostname,
            );
          } catch {
            return false;
          }
        }),
    );
    expect(old, route).toEqual([]);
  }
  await page.goto("/contact?subject=Recording%20help");
  await expect(page.getByLabel("Subject", { exact: true })).toHaveValue(
    "Recording help",
  );
  const invalid = await page.goto("/pages/toString");
  expect(invalid?.status()).toBe(404);
  await page.goto("/calendar");
  await expect(page.locator(".support-grid .support-card")).toHaveCount(12);
  await page.goto("/newsletter");
  await expect(page.getByText("Website", { exact: true })).toBeHidden();
  await expect(page.getByRole("checkbox")).toBeVisible();
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-newsletter-native.png`,
    fullPage: true,
  });
});
test("native contact and newsletter requests stay private", async ({
  request,
  baseURL,
}, info) => {
  const isolated =
    process.env.QA_ALLOW_WRITES === "1" &&
    /^http:\/\/(127\.0\.0\.1|localhost):/.test(baseURL || "");
  test.skip(
    !isolated || info.project.name !== "desktop",
    "Writable localhost QA only",
  );
  const headers = { Origin: baseURL! };
  expect(
    (
      await request.post("/api/contact", {
        headers,
        data: {
          name: "QA contact",
          email: "qa-contact@example.test",
          subject: "Native contact QA",
          message: "Private synthetic test",
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/contact", {
        headers: { Origin: "https://untrusted.example" },
        data: {
          name: "QA contact",
          email: "qa-contact@example.test",
          subject: "Test",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/newsletter", {
        headers,
        data: {
          name: "QA subscriber",
          email: "qa-newsletter@example.test",
          consent: false,
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/newsletter", {
        headers,
        data: {
          name: "QA subscriber",
          email: "qa-newsletter@example.test",
          consent: true,
        },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get("/admin/inquiries")).url()).toContain("/admin");
});
