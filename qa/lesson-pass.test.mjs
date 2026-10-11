import assert from "node:assert/strict";
import { test } from "node:test";
import { getLessonPass } from "../src/lib/lesson-pass.ts";

const lesson = (title, collection = "LH8-01-Matanah", categories = []) => ({
  title,
  collection,
  categories,
});

test("numbered lessons distinguish first pass across Hebrew-law volumes and dash variants", () => {
  for (const volume of ["OC1", "OC2", "OC3", "YD1", "YD2", "EH", "CM1", "CM2"])
    for (const dash of ["-", "–", "—"])
      assert.equal(
        getLessonPass(lesson(`${volume} ${dash} Lesson 026c ${dash} Topic`)),
        "first",
      );
});

test("dated lessons identify second pass through title or series taxonomy", () => {
  assert.equal(
    getLessonPass(lesson("2024-12-01 - LH8 - CM2 - Matanah", "Topics")),
    "second",
  );
  assert.equal(
    getLessonPass(
      lesson("2024-12-01 - Matanah", "Topics", [
        { slug: "lh8-01-matanah", title: "Matanah", taxonomy: "series" },
      ]),
    ),
    "second",
  );
});

test("generic Halakha, unrelated numbered classes and ambiguous clips remain unclassified", () => {
  assert.equal(
    getLessonPass(
      lesson("2024-12-01 - Halakha", "Halakha and Customs – Rabbi Rosenfeld"),
    ),
    undefined,
  );
  assert.equal(
    getLessonPass(lesson("CM2 - Lesson 001", "Unrelated")),
    undefined,
  );
  assert.equal(getLessonPass(lesson("Matanah - Special clip")), undefined);
});
