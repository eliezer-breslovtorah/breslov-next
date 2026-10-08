import { test, expect } from "@playwright/test";

test("lesson tags stay compact and reveal all category links", async ({
  page,
}, info) => {
  await page.goto("/lessons/2019-05-26-lm1-torah-148-torah-152");
  const tags = page.getByRole("navigation", {
    name: "Lesson topics and categories",
  });
  await expect(tags).toBeVisible();
  await expect(tags.locator(".lesson-tags-preview a")).toHaveCount(4);
  const toggle = tags.locator("summary");
  await expect(toggle).toHaveText(/\+\d+ more tags/);
  await expect(tags.locator(".lesson-tags-expanded")).toBeHidden();
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(tags.locator("details")).toHaveAttribute("open", "");
  await expect(tags.locator(".lesson-tags-expanded")).toBeVisible();
  const links = await tags.locator("a").evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.trim().toLowerCase(),
      href: element.getAttribute("href"),
    })),
  );
  expect(new Set(links.map((link) => link.text)).size).toBe(links.length);
  expect(new Set(links.map((link) => link.href)).size).toBe(links.length);
  expect(
    links.every((link) => link.href?.startsWith("/library?category=")),
  ).toBe(true);
  expect(links.some((link) => link.text?.includes("rabbi nasan maimon"))).toBe(
    false,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-lesson-tags-expanded.png`,
    fullPage: true,
  });
  await toggle.press("Space");
  await expect(tags.locator("details")).not.toHaveAttribute("open");
  await expect(tags.locator(".lesson-tags-expanded")).toBeHidden();
  await tags.locator(".lesson-tags-preview a").first().click();
  await expect(page).toHaveURL(/\/library\?category=/);
});
