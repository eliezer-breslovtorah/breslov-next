import { test, expect } from "@playwright/test";

test("audio skips safely, keeps speed on navigation, and fits above mobile tabs", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.locator(".clip-play").first().click();
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate(
          (element: HTMLAudioElement) =>
            Number.isFinite(element.duration) && element.duration > 30,
        ),
    )
    .toBe(true);
  await player.getByRole("button", { name: /^Pause / }).click();
  await page.locator("audio").evaluate((element: HTMLAudioElement) => {
    element.currentTime = 20;
  });
  await player
    .getByRole("button", { name: "Back 15 seconds", exact: true })
    .click();
  expect(
    await page
      .locator("audio")
      .evaluate((element: HTMLAudioElement) => element.currentTime),
  ).toBeCloseTo(5, 0);
  await player
    .getByRole("button", { name: "Back 15 seconds", exact: true })
    .click();
  expect(
    await page
      .locator("audio")
      .evaluate((element: HTMLAudioElement) => element.currentTime),
  ).toBe(0);
  await player
    .getByRole("button", { name: "Forward 15 seconds", exact: true })
    .click();
  expect(
    await page
      .locator("audio")
      .evaluate((element: HTMLAudioElement) => element.currentTime),
  ).toBeCloseTo(15, 0);
  expect(
    await page
      .locator("audio")
      .evaluate((element: HTMLAudioElement) => element.paused),
  ).toBe(true);
  await page.locator("audio").evaluate((element: HTMLAudioElement) => {
    element.currentTime = element.duration - 2;
  });
  await player
    .getByRole("button", { name: "Forward 15 seconds", exact: true })
    .click();
  expect(
    await page
      .locator("audio")
      .evaluate((element: HTMLAudioElement) =>
        Math.abs(element.duration - element.currentTime),
      ),
  ).toBeLessThan(0.5);
  const speed = player.getByRole("combobox", { name: "Playback speed" });
  for (const value of ["0.75", "1", "1.25", "1.5", "2"]) {
    await speed.selectOption(value);
    expect(
      await page
        .locator("audio")
        .evaluate((element: HTMLAudioElement) => element.playbackRate),
    ).toBe(Number(value));
  }
  for (const button of await player.getByRole("button").all()) {
    const bounds = await button.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  if (info.project.name !== "desktop") {
    const playerBounds = await player.boundingBox();
    const navBounds = await nav.boundingBox();
    expect(playerBounds!.y + playerBounds!.height).toBeLessThanOrEqual(
      navBounds!.y + 1,
    );
  }
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-playback-controls.png`,
  });
  await player.getByRole("link", { name: "Open lesson", exact: true }).click();
  await expect(page).toHaveURL(/\/lessons\//);
  await expect(speed).toHaveValue("2");
  await page
    .getByRole("button", { name: "Play teaching", exact: true })
    .click();
  expect(
    await page
      .locator("audio")
      .evaluate((element: HTMLAudioElement) => element.playbackRate),
  ).toBe(2);
  await player.getByRole("button", { name: /^Pause / }).click();
  await page.locator("audio").evaluate((element: HTMLAudioElement) => {
    Object.defineProperty(element, "duration", {
      configurable: true,
      value: Number.NaN,
    });
    element.dispatchEvent(new Event("durationchange"));
  });
  await expect(
    player.getByRole("button", { name: "Back 15 seconds", exact: true }),
  ).toBeDisabled();
  await expect(
    player.getByRole("button", { name: "Forward 15 seconds", exact: true }),
  ).toBeDisabled();
});

test("native video supports safe skips and every requested speed", async ({
  page,
  baseURL,
}) => {
  test.skip(
    !process.env.QA_NATIVE_VIDEO_SLUG ||
      !/^http:\/\/(127\.0\.0\.1|localhost):/.test(baseURL || ""),
    "Requires isolated native video fixture",
  );
  await page.goto(`/lessons/${process.env.QA_NATIVE_VIDEO_SLUG}`);
  await page.getByRole("button", { name: "Play video", exact: true }).click();
  const video = page.locator("video");
  await expect
    .poll(() =>
      video.evaluate(
        (v: HTMLVideoElement) => Number.isFinite(v.duration) && v.duration > 0,
      ),
    )
    .toBe(true);
  await video.evaluate((v: HTMLVideoElement) => {
    v.pause();
    v.currentTime = 1;
  });
  const controls = page.locator(".native-video-controls");
  await controls.getByRole("button", { name: "Back 15 seconds" }).click();
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBe(0);
  await controls.getByRole("button", { name: "Forward 15 seconds" }).click();
  expect(
    await video.evaluate((v: HTMLVideoElement) =>
      Math.abs(v.currentTime - Math.min(15, v.duration)),
    ),
  ).toBeLessThan(0.5);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  for (const value of ["0.75", "1", "1.25", "1.5", "2"]) {
    await controls
      .getByRole("combobox", { name: "Playback speed" })
      .selectOption(value);
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.playbackRate))
      .toBe(Number(value));
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
