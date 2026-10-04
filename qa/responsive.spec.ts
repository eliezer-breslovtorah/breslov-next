import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("pages fit the viewport and navigation works", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/library",
    "/courses",
    "/courses/azamra",
    "/teachers",
    "/teachers/nasan-maimon",
    "/lessons/copper-snake-audio",
    "/about",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
    fs.mkdirSync("qa/screenshots", { recursive: true });
    await page.screenshot({
      path: `qa/screenshots/${info.project.name}-${route.replaceAll("/", "_") || "home"}.png`,
      fullPage: true,
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
  await expect(page).toHaveURL(/library/);
});
test("library search, filters, empty state, and pagination", async ({
  page,
}, info) => {
  await page.goto("/library");
  await expect(page.getByText("8 lessons", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search the library" })
    .fill("Copper");
  await expect(page.getByText("2 lessons", { exact: true })).toBeVisible();
  if (info.project.name !== "desktop") {
    await page.getByRole("button", { name: "Filters", exact: true }).click();
  }
  await page
    .getByRole("combobox", { name: "Format", exact: true })
    .selectOption("Video");
  await expect(page.getByText("1 lesson", { exact: true })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search the library" })
    .fill("zzzz-no-result");
  await expect(
    page.getByRole("heading", { name: "No lessons found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText("8 lessons", { exact: true })).toBeVisible();
});
