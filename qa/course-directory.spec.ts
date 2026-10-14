import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { courseGroups, courseGroupFor } from "../src/lib/course-organization";
import { LESSON_PASS_COLLECTIONS } from "../src/lib/lesson-pass";
const catalog = JSON.parse(fs.readFileSync("content/catalog.json", "utf8"));

test("course organization reuses original URLs and keeps calendar months in order", () => {
  const collections = [...catalog.collections, ...LESSON_PASS_COLLECTIONS];
  const groups = courseGroups(collections);
  const calendar = groups.find((group) => group.id === "calendar")!;
  expect(calendar.families.slice(0, 12).map((family) => family.title)).toEqual([
    "Nissan",
    "Iyar",
    "Sivan",
    "Tammuz",
    "Av",
    "Elul",
    "Tishrei",
    "Cheshvan",
    "Kislev",
    "Teves",
    "Shevat",
    "Adar",
  ]);
  expect(calendar.families[5].items[0].slug).toBe("courses-06-elul");
  const known = new Set(collections.map((collection) => collection.slug));
  for (const group of groups)
    for (const family of group.families) {
      expect(family.items.length).toBeGreaterThan(0);
      for (const item of family.items) expect(known.has(item.slug)).toBe(true);
    }
  expect(
    courseGroupFor(
      catalog.collections.find(
        (item: { slug: string }) => item.slug === "simcha",
      ),
      collections,
    ),
  ).toBe("topics");
  expect(
    courseGroupFor(
      catalog.collections.find(
        (item: { slug: string }) =>
          item.slug === "series-lh8-choshen-mishpat-2",
      ),
      collections,
    ),
  ).toBe("texts");
});
async function screenshot(page: import("@playwright/test").Page, name: string) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
      ).every((link) => link.sheet !== null),
    ),
  ).toBe(true);
  await page.screenshot({ path: `qa/screenshots/${name}.png`, fullPage: true });
}
test("course overview exposes books, calendar events and subjects without chapter clutter", async ({
  page,
}, info) => {
  await page.goto("/courses");
  for (const heading of [
    "Breslov texts & Torah study",
    "The Jewish year",
    "Topics for daily life",
  ])
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  await expect(page.locator(".course-family-card")).toHaveCount(6);
  await expect(page.locator(".course-calendar-links a")).toHaveCount(13);
  await expect(page.locator(".course-calendar-links")).toContainText("Pesach");
  await expect(page.locator(".course-calendar-links")).toContainText("Purim");
  await expect(
    page
      .locator(".course-family-card")
      .filter({ hasText: "Joy & finding the good" }),
  ).toContainText("Simcha");
  await expect(
    page.locator(".course-family-card").filter({ hasText: "Geviyas Chov" }),
  ).toHaveCount(0);
  await screenshot(page, `${info.project.name}-courses-organized`);
  await page
    .getByRole("navigation", { name: "Course categories" })
    .getByRole("link", { name: "Jewish calendar", exact: true })
    .click();
  await expect(page).toHaveURL(/group=calendar/);
  await expect(page.locator(".course-family-card")).toHaveCount(13);
  await screenshot(page, `${info.project.name}-courses-calendar`);
  await page
    .locator(".course-family-card")
    .filter({ has: page.getByRole("heading", { name: "Elul", exact: true }) })
    .getByRole("link")
    .first()
    .click();
  await expect(page).toHaveURL(/\/courses\/courses-06-elul/);
  await expect(page.locator(".lesson-row").first()).toBeVisible();
});
test("books and life subjects group related collections and preserve guided paths", async ({
  page,
}, info) => {
  await page.goto("/courses?group=texts");
  await expect(page.locator(".course-family-card")).toHaveCount(10);
  const halakhos = page.locator(".course-family-card").filter({
    has: page.getByRole("heading", { name: "Likutey Halakhos", exact: true }),
  });
  await expect(
    halakhos.getByRole("link", {
      name: "Likutey Halakhos · First pass",
      exact: true,
    }),
  ).toHaveAttribute("href", "/courses/likutey-halakhos-first-pass");
  await expect(
    halakhos.getByRole("link", {
      name: "Likutey Halakhos · Second pass",
      exact: true,
    }),
  ).toHaveAttribute("href", "/courses/likutey-halakhos-second-pass");
  await screenshot(page, `${info.project.name}-courses-texts`);
  await page.goto("/courses?group=topics");
  await expect(page.locator(".course-family-card")).toHaveCount(9);
  await screenshot(page, `${info.project.name}-courses-topics`);
  const joy = page.locator(".course-family-card").filter({
    has: page.getByRole("heading", {
      name: "Joy & finding the good",
      exact: true,
    }),
  });
  await joy
    .getByRole("link", { name: "Simcha - Joy - Part 1", exact: true })
    .click();
  await expect(page).toHaveURL(/\/courses\/courses-beginner/);
  await expect(page.locator(".lesson-row").first()).toBeVisible();
});
test("all collections, old taxonomy filters, deep search and pagination remain available", async ({
  page,
}, info) => {
  await page.goto("/courses?group=all&type=series");
  await expect(page.locator(".collection-card")).toHaveCount(36);
  await page
    .getByRole("navigation", { name: "Collection pages" })
    .getByRole("link", { name: /Next/ })
    .click();
  await expect(page).toHaveURL(/group=all/);
  await expect(page).toHaveURL(/type=series/);
  await expect(page).toHaveURL(/page=2/);
  await page.goto("/courses?group=all&q=Geviyas");
  await expect(page.locator(".collection-card").first()).toContainText(
    "Geviyas",
  );
  await screenshot(page, `${info.project.name}-courses-search`);
  await page.goto("/courses?group=calendar&q=Elul");
  await expect(page.locator(".collection-card").first()).toContainText("Elul");
  await expect(page.locator(".collection-count")).toContainText(
    "The Jewish year",
  );
  await page.goto("/courses?q=unlikely-course-nothing-matches-78284");
  await expect(
    page.getByRole("heading", { name: "No collections found" }),
  ).toBeVisible();
});
