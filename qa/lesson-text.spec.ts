import { expect, test } from "@playwright/test";
import {
  lessonTextParagraphs,
  lessonTextPreview,
} from "../src/lib/lesson-text";

test("lesson notes retain Hebrew and prose while restoring outline paragraphs", () => {
  const paragraphs = lessonTextParagraphs(
    "A teaching ( about prayer ) . Speaker: Rabbi Nasan Maimon. 00:00 - Introduction. *15:30 - שָׁלוֹם. TEXT: Quoted source text.",
  );
  expect(paragraphs).toEqual([
    "A teaching (about prayer).",
    "Speaker: Rabbi Nasan Maimon.",
    "00:00 - Introduction.",
    "*15:30 - שָׁלוֹם.",
    "TEXT: Quoted source text.",
  ]);
  expect(lessonTextParagraphs("A chapter\n\nAnother paragraph")).toEqual([
    "A chapter",
    "Another paragraph",
  ]);
  expect(lessonTextPreview(paragraphs).more).toEqual([]);
  const long = [...paragraphs, "Quoted Hebrew source. ".repeat(100)];
  const preview = lessonTextPreview(long);
  expect([...preview.visible, ...preview.more]).toEqual(long);
  expect(preview.more.length).toBeGreaterThan(0);
  const single = "A preserved teaching with Hebrew שָׁלוֹם. ".repeat(80).trim();
  const split = lessonTextPreview([single]);
  expect(split.visible.join(" ").length).toBeLessThan(1400);
  expect([...split.visible, ...split.more].join(" ")).toBe(single);
  expect(split.more.length).toBeGreaterThan(0);
});

test("long lesson outlines expand without losing source text", async ({
  page,
}) => {
  await page.goto(
    "/lessons/2024-07-10-lh6-eh-kiddushin-3-para-22-23-kesubos-1a",
  );
  const about = page.locator("article.prose");
  await expect(
    about.getByRole("heading", { name: "About this lesson" }),
  ).toBeVisible();
  const more = about.locator("details");
  await expect(more).not.toHaveAttribute("open", "");
  await about.getByText("Read more about this lesson", { exact: true }).click();
  await expect(more).toHaveAttribute("open", "");
  await expect(more).toContainText("PARAGRAPH 23");
  await expect(about.locator(".lesson-description > p").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("long single-paragraph imports also have a readable preview", async ({
  page,
}, info) => {
  await page.goto(
    "/lessons/breslov-torah-for-women-sara-wurtzel-birkhas-hailanos-blessing-for-fruit-trees-in-blossom",
  );
  const notes = page.locator(".lesson-description");
  expect(
    (await notes.locator(":scope > p").first().innerText()).length,
  ).toBeLessThan(1400);
  await expect(notes.locator("details > div")).toBeHidden();
  await notes.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(notes.locator("details > div")).toBeVisible();
  expect(
    (await notes.locator("details > div").innerText()).length,
  ).toBeGreaterThan(2000);
  await notes.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-lesson-notes.png`,
  });
});
