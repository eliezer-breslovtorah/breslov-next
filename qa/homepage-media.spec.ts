import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("featured teaching loads on demand and discovery is nearby", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("audio")).not.toHaveAttribute("src", /.+/);
  await expect(
    page.getByRole("heading", { name: "Have a few minutes?" }),
  ).toBeVisible();
  await expect(page.locator(".clip-card")).toHaveCount(3);
  await expect(
    page.getByRole("link", { name: "Start with lesson 1" }),
  ).toHaveAttribute("href", "/lessons/azamra-lesson-1-lm1-torah-282-part-1");
  await expect(
    page.getByRole("link", { name: "Browse all classes" }),
  ).toBeVisible();
  const feature = page.locator(".featured-column");
  const welcome = page.locator(".learning-welcome");
  const first = await feature.boundingBox();
  const second = await welcome.boundingBox();
  if (info.project.name !== "desktop") expect(first!.y).toBeLessThan(second!.y);
  await page
    .getByRole("button", {
      name: "Play video: Bereishis – The Hidden Creation of Water",
    })
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /player.vimeo.com\/video\/761745697/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("tab", { name: "Listen", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.waitForFunction(() => {
    const audio = document.querySelector("audio");
    return audio && !audio.paused && audio.currentTime > 0.1;
  });
  await expect(page.locator(".featured-meta")).toContainText("3:00");
  await page
    .locator(".sticky-player")
    .getByRole("button", { name: "Close audio player" })
    .click();
});

test("public audio plays, persists while browsing, and responds to controls", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play The First Step", exact: true })
    .click();
  await page.waitForFunction(() => {
    const audio = document.querySelector("audio");
    return audio && !audio.paused && audio.currentTime > 0.1;
  });
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player).toBeVisible();
  await expect(player).toContainText("The First Step");
  expect(
    await page
      .locator("audio")
      .evaluate((a) => (a as HTMLAudioElement).duration),
  ).toBeGreaterThan(90);
  fs.mkdirSync("qa/screenshots", { recursive: true });
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-homepage-audio.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Browse all classes", exact: true })
    .click();
  await expect(page).toHaveURL(/library/);
  await expect(player).toContainText("The First Step");
  expect(
    await page.locator("audio").evaluate((a) => (a as HTMLAudioElement).paused),
  ).toBe(false);
  await player
    .getByRole("button", { name: "Pause The First Step", exact: true })
    .click();
  expect(
    await page.locator("audio").evaluate((a) => (a as HTMLAudioElement).paused),
  ).toBe(true);
  const seek = page.getByRole("slider", { name: "Seek audio" });
  await seek.focus();
  await seek.press("Home");
  await seek.press("ArrowRight");
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate((a) => (a as HTMLAudioElement).currentTime),
    )
    .toBeGreaterThanOrEqual(1);
  await player
    .getByRole("button", { name: "Resume The First Step", exact: true })
    .click();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a) => (a as HTMLAudioElement).paused),
    )
    .toBe(false);
  await player.getByRole("button", { name: "Close audio player" }).click();
  await expect(player).toHaveCount(0);
  await expect(page.locator("audio")).not.toHaveAttribute("src", /.+/);
  expect(errors).toEqual([]);
});

test("each short excerpt is playable and keyboard tabs do not autoplay", async ({
  page,
}) => {
  await page.goto("/");
  const watch = page.getByRole("tab", { name: "Watch", exact: true });
  await watch.focus();
  await watch.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Listen", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("audio")).not.toHaveAttribute("src", /.+/);
  for (const title of [
    "The First Step",
    "You Are Not Alone",
    "Every Good Thought Counts",
  ]) {
    await page
      .getByRole("button", { name: `Play ${title}`, exact: true })
      .click();
    await page.waitForFunction(() => {
      const a = document.querySelector("audio");
      return a && !a.paused && a.currentTime > 0.1;
    });
    await expect(page.locator(".sticky-player")).toContainText(title);
    await expect(page.locator(".sticky-player").getByRole("alert")).toHaveCount(
      0,
    );
    await page
      .locator(".sticky-player")
      .getByRole("button", { name: "Close audio player" })
      .click();
  }
});
