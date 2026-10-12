import { test, expect } from "@playwright/test";
import { getLessonPass, LESSON_PASS_COLLECTIONS } from "../src/lib/lesson-pass";
import { teacherBiographies } from "../src/lib/teacher-biographies";
import { excludedTagSlugs } from "../src/lib/lesson-tag-policy";
import fs from "node:fs";

const fits = async (page: import("@playwright/test").Page) => {
  expect(
    await page.evaluate(() => {
      const styles = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
      );
      return styles.length > 0 && styles.every((link) => link.sheet !== null);
    }),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
};

test("Sara lessons and teacher are unavailable publicly, including direct media and search", async ({
  request,
}) => {
  const response = await request.get(
    "/api/search?teacher=" + encodeURIComponent("Sara Wurtzel"),
  );
  const result = await response.json();
  expect(result.total).toBe(0);
  expect(
    result.facets.teachers.every(
      (name: string) => !name.toLowerCase().includes("sara wurtzel"),
    ),
  ).toBe(true);
  const catalog = JSON.parse(fs.readFileSync("content/catalog.json", "utf8"));
  const hidden = catalog.lessons.filter((lesson: { speaker: string }) =>
    lesson.speaker.toLowerCase().includes("sara wurtzel"),
  );
  // Shared-author attribution was corrected; only sole-author lessons stay hidden.
  const samples = [
    ...new Map(
      hidden.map((lesson: { speaker: string }) => [lesson.speaker, lesson]),
    ).values(),
  ] as { slug: string; id: string; legacyUrl: string }[];
  expect(samples.length).toBe(1);
  for (const lesson of samples) {
    expect((await request.get("/lessons/" + lesson.slug)).status()).toBe(404);
    expect((await request.get("/api/media/" + lesson.id)).status()).toBe(404);
  }
  expect((await request.get("/teachers/sara-wurtzel")).status()).toBe(404);
  const autocomplete = await (
    await request.get("/api/autocomplete?q=wurtzel")
  ).json();
  expect(autocomplete.teachers).toEqual([]);
  expect(
    autocomplete.lessons.every(
      (lesson: { speaker: string }) =>
        !lesson.speaker.toLowerCase().includes("sara wurtzel"),
    ),
  ).toBe(true);
});

test("donor names disappear from tags while dedication text and genuine topics remain", async ({
  page,
  request,
}, info) => {
  await page.goto("/lessons/lm1-lesson-003-torah-001-para-3-5");
  const dedication = page.locator(".lesson-dedication");
  await expect(dedication).toContainText("William");
  await expect(dedication).toContainText("Hill");
  const tags = page.getByRole("navigation", {
    name: "Lesson topics and categories",
  });
  const hrefs = await tags
    .locator("a")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  for (const slug of [...excludedTagSlugs, "hill"])
    expect(hrefs).not.toContain(
      "/library?category=" + encodeURIComponent(slug),
    );
  const search = await (
    await request.get("/api/search?q=" + encodeURIComponent("White Flame"))
  ).json();
  const lesson = search.items.find(
    (item: { slug: string }) =>
      item.slug === "lm1-lesson-003-torah-001-para-3-5",
  );
  expect(lesson).toBeTruthy();
  expect(
    lesson.categories.some((tag: { slug: string }) =>
      [...excludedTagSlugs, "hill"].includes(tag.slug),
    ),
  ).toBe(false);
  for (const name of ["Jeanette", "Kneubuhl", "dedication Dorfman"]) {
    const { tags: suggestions } = await (
      await request.get("/api/tag-autocomplete?q=" + encodeURIComponent(name))
    ).json();
    expect(
      suggestions.every(
        (tag: { slug: string }) => !excludedTagSlugs.includes(tag.slug),
      ),
    ).toBe(true);
  }
  const hillSearch = await (
    await request.get("/api/search?q=hilltop%20signal")
  ).json();
  expect(
    hillSearch.items.some((item: { categories: { slug: string }[] }) =>
      item.categories.some((tag) => tag.slug === "hill"),
    ),
  ).toBe(true);
  await fits(page);
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-dedication-tags-cleaned.png`,
    fullPage: true,
  });
});

test("Likutey Halakhos passes browse separately and label results", async ({
  page,
  request,
}, info) => {
  for (const group of LESSON_PASS_COLLECTIONS) {
    const { items, total } = await (
      await request.get("/api/search?category=" + group.slug)
    ).json();
    expect(total).toBeGreaterThan(100);
    expect(items.length).toBe(20);
    for (const lesson of items) expect(getLessonPass(lesson)).toBe(group.pass);
    await page.goto("/courses/" + group.slug);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      group.title,
    );
    await expect(
      page.locator(".lesson-row").first().locator(".eyebrow"),
    ).toContainText(group.pass === "first" ? "First pass" : "Second pass");
    await fits(page);
    await page.screenshot({
      path: `qa/screenshots/${info.project.name}-halakhos-${group.pass}-pass.png`,
      fullPage: true,
    });
    await page.getByRole("link", { name: /Next/ }).last().click();
    await expect(page).toHaveURL(/page=2/);
    await expect(
      page.locator(".lesson-row").first().locator(".eyebrow"),
    ).toContainText(group.pass === "first" ? "First pass" : "Second pass");
  }
});

test("all visible teacher profiles have two substantial biography paragraphs", async ({
  page,
}, info) => {
  await page.goto("/teachers");
  await expect(page.locator(".teacher-card")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /Sara Wurtzel/ })).toHaveCount(0);
  for (const [slug, bio] of Object.entries(teacherBiographies)) {
    await page.goto("/teachers/" + slug);
    const paragraphs = page.locator(".teacher-biography > p");
    await expect(paragraphs).toHaveCount(2);
    for (let index = 0; index < 2; index++)
      await expect(paragraphs.nth(index)).toHaveText(bio.paragraphs[index]);
    await fits(page);
    await page.screenshot({
      path: `qa/screenshots/${info.project.name}-teacher-bio-${slug}.png`,
      fullPage: true,
    });
  }
});

test("series continuation stays within the current Halakhos pass", async ({
  page,
}) => {
  for (const [slug, pass] of [
    ["cm2-lesson-095b-pikadon-2-para-2-mid-3", "first"],
    ["2026-05-11-lh8-cm2-pikadon-1a", "second"],
  ]) {
    await page.goto("/lessons/" + slug);
    const series = page.locator("#lesson-series");
    await expect(series).toBeVisible();
    await expect(series.getByRole("heading")).toContainText(
      pass === "first" ? "First pass" : "Second pass",
    );
    const titles = await series
      .locator(".lesson-series-list li strong")
      .allTextContents();
    expect(titles.length).toBeGreaterThan(1);
    for (const title of titles)
      expect(getLessonPass({ title, collection: "Likutey Halakhos" })).toBe(
        pass,
      );
    await fits(page);
  }
});

test("shared-author corrections restore lessons with the remaining teachers", async ({
  request,
}) => {
  const fixtures = [
    {
      id: "wp-shiurim-42970",
      slug: "ein-yaakov-lesson-012a-clip-1-judging-others-favorably-rabbi-levi-yitzchak-of-berdichev",
      speaker: "Rabbi Zvi Aryeh Rosenfeld z”l",
      title:
        "Ein Yaakov - Lesson 012a - Clip 1 - Judging Others Favorably - Rabbi Levi Yitzchak of Berdichev",
    },
    {
      id: "wp-shiurim-42571",
      slug: "2020-05-06-lh3-oc3-rosh-hashanah-1-para-1-2-sounds-of-the-shofar-honesty-in-prayer",
      speaker: "Rabbi Nasan Maimon",
      title:
        "2020-05-06 - LH3 - OC3 - Rosh Hashanah 1 - Para. 1-2 - Sounds of the Shofar; Honesty in Prayer",
    },
    {
      id: "wp-shiurim-43412",
      slug: "2020-11-24-lh2-oc2-devarim-hanohagim-baseudah-4-para-6b-names-of-hashem-shemos-hatzaddikim-mentioning-the-name-of-a-tzaddik-includes-all-his-merits-yom-hazikaron-righteous-women",
      speaker: 'Rabbi Michel Dorfman z"l',
      title:
        "2020-11-24 - LH2 - OC2 - Devarim HaNohagim BaSeudah 4 - Para. 6b - Names of Hashem; Shemos HaTzaddikim; Mentioning the Name of a Tzaddik Includes All His Merits; Yom HaZikaron; Righteous Women",
    },
  ];
  for (const fixture of fixtures) {
    expect((await request.get("/lessons/" + fixture.slug)).status()).toBe(200);
    const result = await (
      await request.get(
        "/api/search?teacher=" +
          encodeURIComponent(fixture.speaker) +
          "&q=" +
          encodeURIComponent(fixture.title),
      )
    ).json();
    const lesson = result.items.find(
      (item: { id: string }) => item.id === fixture.id,
    );
    expect(lesson).toBeTruthy();
    expect(lesson.speaker).toBe(fixture.speaker);
    expect(
      lesson.categories.some(
        (tag: { taxonomy: string; slug: string }) =>
          tag.taxonomy === "authors" && tag.slug === "sara-wurtzel",
      ),
    ).toBe(false);
  }
});
