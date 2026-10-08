import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("header search suggests tags, supports keyboard and fits the viewport", async ({
  page,
}, info) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Search the library",
    exact: true,
  });
  await trigger.click();
  const input = page.getByRole("combobox", { name: "Search lessons and tags" });
  await expect(input).toBeFocused();
  await input.fill("prayer");
  const options = page
    .getByRole("listbox", { name: "Lesson tags" })
    .getByRole("option");
  await expect(options.first()).toBeVisible();
  const response = await page.request.get("/api/tag-autocomplete?q=prayer");
  const { tags } = await response.json();
  expect(tags.length).toBeGreaterThan(0);
  expect(tags.length).toBeLessThanOrEqual(20);
  expect(Object.keys(tags[0]).sort()).toEqual(["count", "slug", "title"]);
  await input.press("ArrowDown");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  fs.mkdirSync("qa/screenshots", { recursive: true });
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-header-tag-search.png`,
  });
  await input.press("Enter");
  await expect(page).toHaveURL(
    new RegExp(`/library\\?topic=${encodeURIComponent(tags[0].title)}`),
  );
  await expect(page.locator("#topic-filter")).toHaveValue(tags[0].title);
  await expect(
    page.getByRole("region", { name: "Library search" }),
  ).toHaveCount(0);
  await trigger.click();
  await input.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await input.fill("a completely unique lesson phrase");
  await input.press("Enter");
  await expect(page).toHaveURL(
    /\/library\?q=a%20completely%20unique%20lesson%20phrase/,
  );
  await trigger.click();
  await page.locator(".brand").click();
  await expect(input).toHaveCount(0);
});
test("tag autocomplete handles short, Unicode and SQL-looking input safely", async ({
  request,
}) => {
  for (const q of ["a", "' OR 1=1 --", "שלום", "%_", "a".repeat(500)]) {
    const response = await request.get(
      `/api/tag-autocomplete?q=${encodeURIComponent(q)}`,
    );
    expect(response.status()).toBe(200);
    const { tags } = await response.json();
    expect(tags.length).toBeLessThanOrEqual(20);
    if (q === "a" || q === "%_") expect(tags).toEqual([]);
  }
});

test("header suggestions remain above the open audio player", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.locator(".clip-play").first().click();
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player).toBeVisible();
  await page
    .getByRole("button", { name: "Search the library", exact: true })
    .click();
  const query = page.getByRole("combobox", { name: "Search lessons and tags" });
  await query.fill("prayer");
  await expect(page.getByRole("option").first()).toBeVisible();
  const panel = await page
    .getByRole("region", { name: "Library search" })
    .boundingBox();
  const audio = await player.boundingBox();
  expect(panel!.y + panel!.height).toBeLessThanOrEqual(audio!.y);
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-header-search-with-audio.png`,
  });
});

test("less common selected tags remain visible in the library filter", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search the library", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Search lessons and tags" })
    .fill("midnight");
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/topic=/);
  const value = new URL(page.url()).searchParams.get("topic");
  await expect(page.locator("#topic-filter")).toHaveValue(value!);
  expect(
    await page
      .locator("#topic-filter")
      .evaluate(
        (select: HTMLSelectElement) => select.selectedOptions[0].textContent,
      ),
  ).toBe(value);
});
