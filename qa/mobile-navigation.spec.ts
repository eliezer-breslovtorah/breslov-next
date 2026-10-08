import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("mobile navigation stays accessible and audio sits above it", async ({
  page,
}, info) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  if (info.project.name === "desktop") {
    await expect(nav).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
    return;
  }
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(5);
  await expect(
    nav.getByRole("link", { name: "Home", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  for (const link of await nav.getByRole("link").all()) {
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  }
  await page.locator(".clip-play").first().click();
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player).toBeVisible();
  const navBox = await nav.boundingBox();
  const playerBox = await player.boundingBox();
  expect(playerBox!.y + playerBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-bottom-navigation-audio.png`,
  });
  await nav.getByRole("link", { name: "Browse", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(
    nav.getByRole("link", { name: "Browse", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(player).toBeVisible();
  await nav.getByRole("link", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Search the library" }),
  ).toBeFocused();
  await expect(
    nav.getByRole("link", { name: "Search", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Close audio player" }).click();
  await expect(player).toHaveCount(0);
  await nav.getByRole("link", { name: "Courses", exact: true }).click();
  await expect(page).toHaveURL(/\/courses$/);
  await expect(
    nav.getByRole("link", { name: "Courses", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "My learning", exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(
    nav.getByRole("link", { name: "My learning", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.locator(".footer-bottom").scrollIntoViewIfNeeded();
  const footer = await page.locator(".footer-bottom").boundingBox();
  const bottomNav = await nav.boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(bottomNav!.y + 1);
  fs.mkdirSync("qa/screenshots", { recursive: true });
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-bottom-navigation.png`,
  });
});
