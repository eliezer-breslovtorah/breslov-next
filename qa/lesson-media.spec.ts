import { test, expect } from "@playwright/test";
import fs from "node:fs";
const catalog = JSON.parse(fs.readFileSync("content/catalog.json", "utf8"));
const lesson = catalog.lessons.find(
  (l: { slug: string }) => l.slug === "outpouring-intro-part-01",
);
test("full library recording plays from original storage and persists", async ({
  page,
}) => {
  await page.goto(`/lessons/${lesson.slug}`);
  await page
    .getByRole("button", { name: "Play teaching", exact: true })
    .click();
  await page.waitForFunction(() => {
    const a = document.querySelector("audio");
    return a && !a.paused && a.currentTime > 0.1;
  });
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player).toContainText(lesson.title);
  await page
    .getByRole("link", { name: "Library", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/library/);
  await expect(player).toContainText(lesson.title);
  expect(
    await page.locator("audio").evaluate((a) => (a as HTMLAudioElement).paused),
  ).toBe(false);
  await player.getByRole("button", { name: "Close audio player" }).click();
});
test("original media range and missing-file handling", async ({ request }) => {
  const range = await request.get(`/api/media/${lesson.id}`, {
    headers: { Range: "bytes=0-15" },
  });
  expect(range.status()).toBe(206);
  expect((await range.body()).length).toBe(16);
  expect(range.headers()["accept-ranges"]).toBe("bytes");
  const missing = await request.get("/api/media/not-a-recording");
  expect(missing.status()).toBe(404);
});
