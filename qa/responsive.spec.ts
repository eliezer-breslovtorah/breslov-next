import { test, expect } from "@playwright/test";
import fs from "node:fs";
const catalog = JSON.parse(fs.readFileSync("content/catalog.json", "utf8"));
const lesson =
  catalog.lessons.find(
    (item: { format: string; access: string }) =>
      item.format === "Audio" && item.access === "public",
  ) || catalog.lessons[0];
const collection =
  catalog.collections.find((item: { slug: string }) =>
    item.slug.includes("azamra"),
  ) || catalog.collections[0];
const teacher = catalog.teachers[0];
const routes = [
  "/",
  "/library",
  "/courses",
  `/courses/${encodeURIComponent(collection.slug)}`,
  "/teachers",
  `/teachers/${encodeURIComponent(teacher.slug)}`,
  `/lessons/${encodeURIComponent(lesson.slug)}`,
  "/about",
  "/donate",
  "/donate/donate-by-credit-card",
  "/dedications",
  "/contact",
  "/community",
  "/calendar",
  "/account",
  "/account/signup",
];
async function openFilters(page: import("@playwright/test").Page) {
  if (
    !(await page
      .getByRole("combobox", { name: "Format", exact: true })
      .isVisible())
  )
    await page.getByRole("button", { name: "Filters", exact: true }).click();
}
test("pages fit the viewport and navigation works", async ({ page }, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  fs.mkdirSync("qa/screenshots", { recursive: true });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.locator("img").evaluateAll((images) =>
      Promise.all(
        images.map((image) => {
          const img = image as HTMLImageElement;
          img.loading = "eager";
          if (img.complete) return;
          return new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          });
        }),
      ),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `Overflow at ${route}`,
    ).toBe(true);
    expect(
      await page
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
        ),
      `Broken image at ${route}`,
    ).toBe(true);
    await page.screenshot({
      path: `qa/screenshots/${info.project.name}-${route.replaceAll("/", "_")}.png`,
      fullPage: await page.evaluate(
        () => document.documentElement.scrollHeight < 16000,
      ),
    });
  }
  expect(errors).toEqual([]);
  await page.goto("/");
  if (info.project.name !== "desktop") {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
  }
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Library", exact: true })
    .click();
  await expect(page).toHaveURL(/\/library/);
});
test("server search, filters, empty state, and paginated query state", async ({
  page,
}) => {
  await page.goto("/library");
  const total = Number(
    (await page.locator(".results-bar strong").innerText()).replaceAll(",", ""),
  );
  expect(total).toBeGreaterThan(6000);
  await expect(page.locator(".lesson-row")).toHaveCount(20);
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".pagination")).toContainText("Page 2");
  await page
    .getByRole("combobox", { name: "Search the library" })
    .fill("Copper");
  await expect(page).toHaveURL(/q=Copper/);
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  const matches = Number(
    (await page.locator(".results-bar strong").innerText()).replaceAll(",", ""),
  );
  expect(matches).toBeGreaterThan(0);
  expect(matches).toBeLessThan(total);
  await openFilters(page);
  await page
    .getByRole("combobox", { name: "Format", exact: true })
    .selectOption("Video");
  await expect(page).toHaveURL(/format=Video/);
  const videos = Number(
    (await page.locator(".results-bar strong").innerText()).replaceAll(",", ""),
  );
  expect(videos).toBeGreaterThan(0);
  expect(videos).toBeLessThanOrEqual(matches);
  for (const row of await page.locator(".lesson-row").all())
    await expect(row.locator(".meta")).toContainText("Video");
  await page
    .getByRole("combobox", { name: "Search the library" })
    .fill("zzzz-no-result");
  await expect(
    page.getByRole("heading", { name: "No lessons found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clear filters", exact: true }).click();
  await expect(page.locator(".results-bar strong")).toHaveText(
    total.toLocaleString(),
  );
  await openFilters(page);
  await page
    .getByRole("combobox", { name: "Teacher", exact: true })
    .selectOption(teacher.name);
  await expect(page).toHaveURL(/teacher=/);
  const count = Number(
    (await page.locator(".results-bar strong").innerText()).replaceAll(",", ""),
  );
  expect(count).toBeGreaterThan(20);
  await page.getByRole("link", { name: "Next", exact: true }).click();
  expect(new URL(page.url()).searchParams.get("teacher")).toBe(teacher.name);
  await expect(page.locator(".pagination")).toContainText("Page 2");
  await page.reload();
  await expect(page.locator(".pagination")).toContainText("Page 2");
});

test("collection directory paginates and preserves filters; guided lessons start oldest", async ({
  page,
}) => {
  await page.goto("/courses?type=series");
  await expect(page.locator(".collection-card")).toHaveCount(36);
  await page
    .getByRole("navigation", { name: "Collection pages" })
    .getByRole("link", { name: "Next", exact: false })
    .click();
  expect(new URL(page.url()).searchParams.get("type")).toBe("series");
  await expect(page).toHaveURL(/page=2/);
  expect(new URL(page.url()).searchParams.get("page")).toBe("2");
  await expect(
    page.getByRole("navigation", { name: "Collection pages" }),
  ).toContainText("Page 2");
  await page.goto(`/courses/${encodeURIComponent(collection.slug)}`);
  await openFilters(page);
  await expect(
    page.getByRole("combobox", { name: "Sort by", exact: true }),
  ).toHaveValue("oldest");
});

test("live search and autocomplete support keyboard selection", async ({
  page,
}, info) => {
  await page.goto("/library?page=2");
  const input = page.getByRole("combobox", { name: "Search the library" });
  await input.fill("Maimon");
  await expect(page).toHaveURL(/q=Maimon/, { timeout: 15000 });
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await expect(
    page.getByRole("listbox", { name: "Search suggestions" }),
  ).toBeVisible();
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-autocomplete.png`,
    fullPage: true,
  });
  const first = await page.getByRole("option").first().innerText();
  await input.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", "suggestion-0");
  await input.press("Escape");
  await expect(
    page.getByRole("listbox", { name: "Search suggestions" }),
  ).toHaveCount(0);
  await input.fill("Maimo");
  await expect(
    page.getByRole("listbox", { name: "Search suggestions" }),
  ).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/lessons\//);
  await expect(page.locator("h1")).toBeVisible();
  expect(first.length).toBeGreaterThan(0);
});

test("rapid filter selections retain both values and browser history restores search", async ({
  page,
}) => {
  await page.goto("/library?q=Copper&page=2");
  await openFilters(page);
  await page
    .getByRole("combobox", { name: "Format", exact: true })
    .selectOption("Video");
  await page
    .getByRole("combobox", { name: "Sort by", exact: true })
    .selectOption("oldest");
  await expect(page).toHaveURL(/sort=oldest/);
  const query = new URL(page.url()).searchParams;
  expect(query.get("format")).toBe("Video");
  expect(query.get("q")).toBe("Copper");
  expect(query.has("page")).toBe(false);
  await expect(
    page.getByRole("button", { name: "Apply filters", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Search the library" })
    .fill("Maimon");
  await expect(page).toHaveURL(/q=Maimon/, { timeout: 15000 });
  await page
    .getByRole("link", { name: "About Breslov Torah", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await page.goBack();
  await expect(
    page.getByRole("combobox", { name: "Search the library" }),
  ).toHaveValue("Maimon");
});
