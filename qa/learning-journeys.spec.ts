import { test, expect } from "@playwright/test";
import { STARTER_STEPS, SYSTEMATIC_TEXTS } from "../src/lib/learning-paths";
import { getTimelyTeachingWindow } from "../src/lib/timely-teachings";
import { durationSeconds } from "../src/lib/lesson-filter-values";
import { lessonSequenceKey } from "../src/lib/lesson-order";
import fs from "node:fs";
async function shot(page: import("@playwright/test").Page, name: string) {
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
  fs.mkdirSync("qa/screenshots", { recursive: true });
  await page.screenshot({ path: `qa/screenshots/${name}.png`, fullPage: true });
}
async function filters(page: import("@playwright/test").Page) {
  if (!(await page.locator("#format-filter").isVisible()))
    await page.getByRole("button", { name: "Filters", exact: true }).click();
  if (!(await page.locator("#duration-filter").isVisible()))
    await page.locator(".library-more-filters summary").click();
}
test("a beginner can start immediately and follow four real steps", async ({
  page,
  request,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Where would you like to begin?" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: "New to Breslov? Start here", exact: true })
      .first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "New to Breslov? Start here", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.locator(".starter-steps > li")).toHaveCount(4);
  await page.locator(".clip-play").first().click();
  await page.waitForFunction(() => {
    const audio = document.querySelector("audio");
    return !!audio && !audio.paused && audio.currentTime > 0.1;
  });
  await shot(page, `${info.project.name}-beginner-journey`);
  for (const step of STARTER_STEPS)
    expect((await request.get("/lessons/" + step.lessonSlug)).status()).toBe(
      200,
    );
});
test("a friend can hear Rav Nasan and find his biography, questions and projects", async ({
  page,
}, info) => {
  await page.goto("/meet-rav-nasan");
  await expect(page.locator(".clip-card")).toHaveCount(3);
  await expect(page.locator(".journey-teacher p")).toHaveCount(2);
  await page.locator(".clip-play").nth(1).click();
  await page.waitForFunction(() => {
    const a = document.querySelector("audio");
    return !!a && !a.paused && a.currentTime > 0.1;
  });
  await expect(
    page.getByRole("region", { name: "Audio player" }),
  ).toContainText("You Are Not Alone");
  await expect(page.locator('a[href="/projects"]').first()).toBeVisible();
  await shot(page, `${info.project.name}-meet-rav-nasan`);
});
test("all metadata filters combine and rare tags autocomplete without an apply step", async ({
  page,
  request,
}, info) => {
  const response = await request.get(
    "/api/search?format=Audio&duration=short&access=public&dedication=no",
  );
  const result = await response.json();
  expect(result.total).toBeGreaterThan(0);
  for (const lesson of result.items) {
    expect(lesson.format).toBe("Audio");
    expect(lesson.access).toBe("public");
    expect(durationSeconds(lesson.duration)).not.toBeNull();
    expect(durationSeconds(lesson.duration)!).toBeLessThan(600);
    expect((lesson.dedication || "").trim()).toBe("");
  }
  const dated = await (
    await request.get(
      "/api/search?publishedFrom=2024-01-01&publishedTo=2024-12-31",
    )
  ).json();
  expect(dated.total).toBeGreaterThan(0);
  for (const lesson of dated.items) {
    expect(lesson.publishedAt.slice(0, 10) >= "2024-01-01").toBe(true);
    expect(lesson.publishedAt.slice(0, 10) <= "2024-12-31").toBe(true);
  }
  const injected = await request.get(
    "/api/search?publishedFrom=%27%20OR%201%3D1&duration=invalid&includeDrafts=true",
  );
  expect(injected.status()).toBe(200);
  for (const duration of ["__proto__", "constructor", "toString"])
    expect(
      (await request.get("/api/search?duration=" + duration)).status(),
    ).toBe(200);
  await page.goto("/library?format=Audio&access=public");
  await filters(page);
  await page.locator("#duration-filter").selectOption("short");
  await expect(page).toHaveURL(/duration=short/);
  await page.locator("#published-from-filter").fill("2024-01-01");
  await expect(page).toHaveURL(/publishedFrom=2024-01-01/);
  await page.locator("#published-to-filter").fill("2024-12-31");
  await expect(page).toHaveURL(/publishedTo=2024-12-31/);
  const tags = await (
    await request.get("/api/tag-autocomplete?q=midnight")
  ).json();
  expect(tags.tags.length).toBeGreaterThan(0);
  const tag = page.getByRole("combobox", { name: "Find any tag" });
  await tag.fill("midnight");
  await expect(
    page.getByRole("listbox", { name: "Matching lesson tags" }),
  ).toBeVisible();
  await tag.press("ArrowDown");
  await tag.press("Enter");
  await expect(page.locator("#topic-filter")).toHaveValue(tags.tags[0].title);
  await expect(page).toHaveURL(/[?&]topic=/);
  expect(new URL(page.url()).searchParams.get("topic")).toBe(
    tags.tags[0].title,
  );
  expect(new URL(page.url()).searchParams.get("format")).toBe("Audio");
  expect(new URL(page.url()).searchParams.get("access")).toBe("public");
  await shot(page, `${info.project.name}-advanced-lesson-filters`);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
});
test("systematic study keeps numeric order and a complete selected course", async ({
  page,
  request,
}, info) => {
  await page.goto("/study");
  await expect(page.locator(".journey-card")).toHaveCount(
    SYSTEMATIC_TEXTS.length,
  );
  await shot(page, `${info.project.name}-systematic-study`);
  const sorted = await (
    await request.get(
      "/api/search?category=likutey-halakhos-first-pass&sort=sequence",
    )
  ).json();
  expect(sorted.total).toBeGreaterThan(1000);
  const keys = sorted.items.map((item: { title: string }) =>
    lessonSequenceKey(item),
  );
  expect(keys).toEqual([...keys].sort());
  await page.goto("/courses/azamra?sort=sequence");
  await expect(page.locator(".lesson-row")).toHaveCount(5);
  await expect(page.locator("#sort-filter")).toHaveValue("sequence");
  await page.locator(".lesson-row").first().click();
  await expect(page).toHaveURL(/seriesCourse=azamra/);
  const series = page.locator("#lesson-series");
  await expect(series.getByRole("heading")).toContainText("Azamra");
  await expect(series.locator(".lesson-series-list li")).toHaveCount(5);
  await expect(series).toContainText("Text / lesson order");
  await series
    .locator(".lesson-series-neighbors")
    .getByRole("link", { name: /Next lesson/ })
    .click();
  await expect(page).toHaveURL(/azamra-lesson-2/);
  await expect(page).toHaveURL(/seriesCourse=azamra/);
  await expect(series.locator('[aria-current="page"]')).toContainText(
    "Lesson 2",
  );
  await series.getByRole("link", { name: /Use publication order/ }).click();
  await expect(page).toHaveURL(/seriesCourse=azamra/);
  await expect(series.locator(".lesson-series-list li")).toHaveCount(5);
  await page.goto(
    "/lessons/" +
      SYSTEMATIC_TEXTS[0].startingLessonSlug +
      "?seriesOrder=sequence&seriesCourse=series-likutey-moharan-1",
  );
  await expect(series).toContainText("Likutey Moharan 1");
  await expect(series.locator(".lesson-series-list li")).toHaveCount(20);
  await series.getByRole("link", { name: "Next lessons →" }).click();
  await expect(page).toHaveURL(/seriesPage=2/);
  await expect(page).toHaveURL(/seriesCourse=series-likutey-moharan-1/);
  await page.goto(
    "/lessons/" +
      STARTER_STEPS[1].lessonSlug +
      "?seriesOrder=sequence&seriesCourse=courses-healthy-parenting",
  );
  await expect(
    series.locator('a[href*="seriesCourse=courses-healthy-parenting"]'),
  ).toHaveCount(0);
});
test("casual and returning visitors find life subjects and current seasonal teachings", async ({
  page,
  request,
}, info) => {
  const timely = getTimelyTeachingWindow();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "What’s on your mind?" }),
  ).toBeVisible();
  await expect(
    page.locator(`main a[href="${timely.currentMonth.href}"]`).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Latest lessons" }),
  ).toBeVisible();
  await shot(page, `${info.project.name}-home-learning-paths`);
  await page.goto("/calendar");
  await expect(
    page.getByRole("heading", { name: timely.currentMonth.label, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: timely.nextMonth.label, exact: true }),
  ).toBeVisible();
  await shot(page, `${info.project.name}-timely-learning`);
  expect((await request.get(timely.currentMonth.href)).status()).toBe(200);
});
test("all learning paths invite questions without membership and offer real giving opportunities", async ({
  page,
  request,
}, info) => {
  for (const route of [
    "/start",
    "/meet-rav-nasan",
    "/study",
    "/library",
    "/courses",
    "/calendar",
    "/lessons/" + STARTER_STEPS[1].lessonSlug,
  ]) {
    await page.goto(route);
    const panel = page.getByRole("region", {
      name: "Connect with Rav Nasan and Breslov",
    });
    await expect(
      panel.getByRole("link", { name: "Ask a question →", exact: true }),
    ).toBeVisible();
    await expect(
      panel.getByRole("link", { name: "Give tzedakah →", exact: true }),
    ).toHaveAttribute("href", "/donate");
    await expect(
      panel.getByRole("link", { name: "Explore the projects →", exact: true }),
    ).toHaveAttribute("href", "/projects");
  }
  const panel = page.getByRole("region", {
    name: "Connect with Rav Nasan and Breslov",
  });
  await panel
    .getByRole("link", { name: "Ask a question →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact\?subject=/);
  await expect(
    page.getByRole("textbox", { name: "Subject", exact: true }),
  ).toHaveValue(
    ("Question for Rav Nasan: " + STARTER_STEPS[1].lessonTitle).slice(0, 200),
  );
  await expect(
    page.getByRole("textbox", { name: "Email", exact: true }),
  ).toBeVisible();
  await shot(page, `${info.project.name}-question-context`);
  await page.goto("/projects");
  const links = await page
    .locator("main .support-card")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  expect(links.length).toBeGreaterThan(5);
  for (const href of links) {
    expect(href?.startsWith("/donate/")).toBe(true);
    expect((await request.get(href!)).status()).toBe(200);
  }
  await shot(page, `${info.project.name}-breslov-projects`);
});
