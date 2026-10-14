import assert from "node:assert/strict";
import { test } from "node:test";
import {
  durationSeconds,
  validPublicationDate,
} from "../src/lib/lesson-filter-values.ts";
import { readBrowseQuery } from "../src/lib/browse-query.ts";
import { lessonSequenceKey } from "../src/lib/lesson-order.ts";
test("duration filters handle both source duration formats and exclude missing values", () => {
  assert.equal(durationSeconds("1:45"), 105);
  assert.equal(durationSeconds("0:44:41"), 2681);
  assert.equal(durationSeconds("00:18:52"), 1132);
  assert.equal(durationSeconds("120:00"), 7200);
  for (const value of ["", undefined, "2:99", "0:61:20", "unknown"])
    assert.equal(durationSeconds(value), null);
});
test("publication dates validate leap days and search only accepts public criteria", () => {
  assert.equal(validPublicationDate("2024-02-29"), true);
  assert.equal(validPublicationDate("2025-02-29"), false);
  assert.equal(validPublicationDate("2024-02-01' OR 1=1"), false);
  const query = readBrowseQuery(
    {
      duration: "short",
      access: "public",
      publishedFrom: "2024-02-29",
      includeDrafts: "true",
      q: ["ignored"],
      teacher: "test",
    },
    ["teacher"],
  );
  assert.equal(query.duration, "short");
  assert.equal(query.access, "public");
  assert.equal(query.includeDrafts, undefined);
  assert.equal(query.q, undefined);
  assert.equal(query.teacher, undefined);
});
test("beginner clips keep numbered order and dated extras follow a numbered course", () => {
  assert.ok(
    lessonSequenceKey({ title: "The First Step - Breslov Basics 1" }) <
      lessonSequenceKey({ title: "You Are Not Alone - Breslov Basics 2" }),
  );
  assert.ok(
    lessonSequenceKey({ title: "Simcha - Joy - Lesson 01" }) <
      lessonSequenceKey({ title: "2024-01-01 - Simcha review" }),
  );
});
