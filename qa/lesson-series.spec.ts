import { test, expect } from "@playwright/test";
import fs from "node:fs";
const catalog = JSON.parse(fs.readFileSync("content/catalog.json", "utf8"));
const collection = catalog.collections.find(
  (c: { slug: string }) => c.slug === "series-r-rosenfeld-likutey-moharan-1",
);
const members = catalog.lessons
  .filter((l: { categories?: { id: number; taxonomy: string }[] }) =>
    l.categories?.some(
      (t) => t.id === collection.sourceId && t.taxonomy === "series",
    ),
  )
  .sort(
    (
      a: { publishedAt: string; id: string },
      b: { publishedAt: string; id: string },
    ) =>
      a.publishedAt < b.publishedAt
        ? -1
        : a.publishedAt > b.publishedAt
          ? 1
          : a.id < b.id
            ? -1
            : 1,
  );
const first = members[0];
test("lesson series lists chronological siblings and paginates the complete collection", async ({
  page,
}, info) => {
  await page.goto(`/lessons/${first.slug}`);
  const series = page.locator("#lesson-series");
  await expect(
    series.getByRole("heading", { name: collection.title, exact: true }),
  ).toBeVisible();
  await expect(series.locator(".lesson-series-list li")).toHaveCount(20);
  await expect(
    series
      .locator(".lesson-series-neighbors")
      .getByRole("link", { name: /^Next lesson →/ }),
  ).toHaveAttribute("href", `/lessons/${members[1].slug}`);
  await expect(series.locator('[aria-current="page"]')).toContainText(
    first.title,
  );
  await expect(series).toContainText(`${members.length} lessons`);
  await expect(series.locator(".lesson-series-list a").nth(1)).toHaveAttribute(
    "href",
    `/lessons/${members[1].slug}`,
  );
  await series.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-lesson-series.png`,
    fullPage: true,
  });
  await series.getByRole("link", { name: "Next lessons →" }).click();
  await expect(page).toHaveURL(/seriesPage=2/);
  await expect(series.locator(".lesson-series-list a").first()).toHaveAttribute(
    "href",
    `/lessons/${members[20].slug}`,
  );
  await series.getByRole("link", { name: "Back to current lesson" }).click();
  await expect(series.locator('[aria-current="page"]')).toContainText(
    first.title,
  );
  await page.goto(`/lessons/${first.slug}?seriesPage=9999`);
  await expect(series).toContainText(
    `Page ${Math.ceil(members.length / 20)} of ${Math.ceil(members.length / 20)}`,
  );
  await expect(series.locator(".lesson-series-list a").last()).toHaveAttribute(
    "href",
    `/lessons/${members.at(-1).slug}`,
  );
});
test("calendar tags alone do not fabricate a lesson series", async ({
  page,
}) => {
  const calendar = catalog.lessons.find(
    (l: { categories?: { taxonomy: string; parentId: number }[] }) =>
      l.categories?.some(
        (t) => t.taxonomy === "courses" && t.parentId === 352,
      ) &&
      !l.categories.some(
        (t) =>
          t.taxonomy === "series" ||
          (t.taxonomy === "courses" && t.parentId !== 352),
      ),
  );
  await page.goto(`/lessons/${calendar.slug}`);
  await expect(page.locator("#lesson-series")).toHaveCount(0);
});
