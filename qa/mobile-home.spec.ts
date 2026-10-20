import { test, expect } from "@playwright/test";

test("homepage uses compact iTorah shelves only on phones", async ({
  page,
}, info) => {
  await page.goto("/");
  const phone = (page.viewportSize()?.width || 0) < 640;
  const date = page.locator(".home-mobile-date");
  const teachers = page.locator(".home-rabbanim");
  const latest = page.locator(".home-latest .lesson-card:visible");
  if (phone) {
    await expect(date).toBeVisible();
    await expect(teachers).toBeVisible();
    await expect(latest).toHaveCount(5);
    const sections = [
      ".learning-hero",
      ".home-seasonal",
      ".home-rabbanim",
      ".home-latest",
      ".quick-listen",
      ".home-paths",
      ".home-life",
      ".learning-connection",
    ];
    const tops = await Promise.all(
      sections.map(
        async (selector) => (await page.locator(selector).boundingBox())!.y,
      ),
    );
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    const rail = page.getByRole("region", { name: "Browse our rabbanim" });
    await rail.scrollIntoViewIfNeeded();
    await rail.evaluate(
      (element) => (element.scrollLeft = element.scrollWidth),
    );
    await expect(rail.locator("a").last()).toBeInViewport({ ratio: 0.5 });
    await rail.evaluate((element) => (element.scrollLeft = 0));
    await expect(
      teachers.locator("a[href^='/teachers/']").first(),
    ).toHaveAttribute("href", /\/teachers\/.+/);
  } else {
    await expect(date).toBeHidden();
    await expect(teachers).toBeHidden();
    await expect(latest).toHaveCount(4);
    await expect(
      page.getByRole("heading", {
        name: "A moment of Torah. A path for your day.",
      }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-mobile-home-revamp.png`,
    fullPage: true,
  });
});

test("phone shelves switch cleanly at the breakpoint and in landscape", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "One resize sweep covers shared breakpoint rules",
  );
  await page.goto("/");
  for (const width of [639, 640, 800, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".home-rabbanim")).toBeVisible({
      visible: width < 640,
    });
    await expect(page.locator(".home-latest .lesson-card:visible")).toHaveCount(
      width < 640 ? 5 : 4,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  }
});
