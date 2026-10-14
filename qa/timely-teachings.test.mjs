import assert from "node:assert/strict";
import { test } from "node:test";
import { getTimelyTeachingWindow } from "../src/lib/timely-teachings.ts";

test("current month points to the existing Cheshvan collection", () => {
  const result = getTimelyTeachingWindow(new Date("2026-10-14T12:00:00Z"));
  assert.equal(result.currentMonth.label, "Cheshvan");
  assert.equal(result.currentMonth.href, "/courses/courses-08-cheshvan");
  assert.equal(result.nextMonth.label, "Kislev");
});

test("Adar I and Adar II share the Adar course while upcoming month respects leap years", () => {
  const first = getTimelyTeachingWindow(new Date("2027-02-15T12:00:00Z"));
  const second = getTimelyTeachingWindow(new Date("2027-03-15T12:00:00Z"));
  assert.equal(first.currentMonth.label, "Adar I");
  assert.equal(first.nextMonth.label, "Adar II");
  assert.equal(second.currentMonth.label, "Adar II");
  assert.equal(second.currentMonth.slug, "courses-12-adar");
  assert.equal(second.nextMonth.slug, "courses-nissan");
});

test("month classification follows Jerusalem civil date rather than server time", () => {
  const before = getTimelyTeachingWindow(new Date("2026-10-11T20:59:00Z"));
  const after = getTimelyTeachingWindow(new Date("2026-10-11T21:01:00Z"));
  assert.equal(before.currentMonth.label, "Tishrei");
  assert.equal(after.currentMonth.label, "Cheshvan");
  assert.equal(after.dateLabel, "October 12, 2026");
});
