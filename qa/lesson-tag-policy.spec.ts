import { test, expect } from "@playwright/test";
import {
  excludedTagSlugs,
  isPublicLessonTag,
} from "../src/lib/lesson-tag-policy";

test("dedication names are excluded only from topics", () => {
  expect(new Set(excludedTagSlugs).size).toBe(excludedTagSlugs.length);
  for (const slug of excludedTagSlugs) {
    expect(isPublicLessonTag({ slug, taxonomy: "post_tag" })).toBe(false);
    expect(isPublicLessonTag({ slug, taxonomy: "authors" })).toBe(true);
  }
  expect(
    isPublicLessonTag({ slug: " Jeanette-Adams ", taxonomy: "post_tag" }),
  ).toBe(false);
  expect(
    isPublicLessonTag(
      { slug: "hill", taxonomy: "post_tag" },
      "Dedicated by William Hill",
    ),
  ).toBe(false);
  expect(isPublicLessonTag({ slug: "hill", taxonomy: "post_tag" }, "")).toBe(
    true,
  );
  for (const slug of [
    "rachel",
    "yaakov",
    "chaim",
    "nathan",
    "hill",
    "dorfman",
    "rosenfeld",
    "refuah",
  ]) {
    expect(isPublicLessonTag({ slug, taxonomy: "post_tag" })).toBe(true);
  }
});
