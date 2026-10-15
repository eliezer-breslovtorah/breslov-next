import { test, expect } from "@playwright/test";

test("homepage and header share alphabetized tag search and lesson results", async ({
  page,
}, info) => {
  await page.goto("/");
  const home = page.getByRole("region", { name: "Homepage search" });
  const input = home.getByRole("combobox", {
    name: "Search lessons",
    exact: true,
  });
  await input.fill("prayer");
  const options = home.getByRole("option");
  await expect(options.first()).toBeVisible();
  const titles = await options.locator("span").allTextContents();
  expect(titles.length).toBeGreaterThan(1);
  const normalized = titles.map((title) =>
    title.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase(),
  );
  expect(normalized).toEqual([...normalized].sort());
  await input.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );
  await expect(options.first()).toBeInViewport();
  await page.screenshot({
    path: `qa/screenshots/${info.project.name}-home-tag-autocomplete.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page).toHaveURL(
    new RegExp(`/library\\?topic=${encodeURIComponent(titles[0])}`),
  );
  await expect(page.locator("#topic-filter")).toHaveValue(titles[0]);
  await expect(page.locator(".lesson-row").first()).toBeVisible();
  await page.goto("/");
  await input.fill("prayer");
  await expect(options.first()).toBeVisible();
  await options.first().click();
  await expect(page.locator("#topic-filter")).toHaveValue(titles[0]);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search the library", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Search lessons and tags", exact: true })
    .fill("prayer");
  await expect(
    page
      .getByRole("region", { name: "Library search" })
      .getByRole("option")
      .first(),
  ).toBeVisible();
  expect(
    await page
      .getByRole("region", { name: "Library search" })
      .getByRole("option")
      .locator("span")
      .allTextContents(),
  ).toEqual(titles);
});

test("homepage supports free text and gracefully handles unavailable suggestions", async ({
  page,
}) => {
  await page.goto("/");
  const home = page.getByRole("region", { name: "Homepage search" });
  const input = home.getByRole("combobox");
  await input.fill("a unique search phrase");
  await home
    .getByRole("button", { name: "Search lessons", exact: true })
    .click();
  await expect(page).toHaveURL(/library\?q=a%20unique%20search%20phrase/);
  await page.goto("/");
  await page.route("**/api/tag-autocomplete?*", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await input.fill("prayer");
  await expect(home.getByRole("status")).toContainText("unavailable");
  await input.press("Enter");
  await expect(page).toHaveURL(/library\?q=prayer/);
});
