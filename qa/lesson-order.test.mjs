import assert from "node:assert/strict";
import { test } from "node:test";
import { lessonSequenceKey } from "../src/lib/lesson-order.ts";

const order = (titles) =>
  [...titles].sort((a, b) => {
    const left = lessonSequenceKey({ title: a });
    const right = lessonSequenceKey({ title: b });
    return left < right ? -1 : left > right ? 1 : 0;
  });

test("Halakhos first-pass navigation follows volumes, not recording dates or alphabetic codes", () => {
  const expected = ["OC1", "OC2", "OC3", "YD1", "YD2", "EH", "CM1", "CM2"].map(
    (volume) => `${volume} - Lesson 001 - Introduction`,
  );
  assert.deepEqual(order([...expected].reverse()), expected);
});

test("lesson numbers, letter subdivisions and part numbers use natural order", () => {
  const expected = [
    "CM2 - Lesson 001 - Introduction",
    "CM2 - Lesson 001a - Matanah",
    "CM2 – Lesson 001b – Matanah",
    "CM2 - Lesson 002 - Part 9",
    "CM2 - Lesson 002 - Part 10",
    "CM2 - Lesson 010 - Matanah",
  ];
  assert.deepEqual(order([...expected].reverse()), expected);
});

test("dated second-pass recordings stay chronological across months, years and leap days", () => {
  const expected = [
    "2023-12-31 - LH1 - OC1",
    "2024-02-28 - LH1 - OC1",
    "2024-02-29 - LH1 - OC1",
    "2024-03-01 - LH1 - OC1",
    "2025-01-01 - LH1 - OC1",
  ];
  assert.deepEqual(order([...expected].reverse()), expected);
});

test("LM recording numbers, including the imported lh1 typo, determine sequence", () => {
  const expected = [
    "lm1-001 - Likutey Moharan 1 - Introduction",
    "lm1-009 - Torah 3 - Part 9",
    "lm1-009 - Torah 3 - Part 10",
    "lm1-010 - Torah 4",
    "lh1-066 - Likutey Moharan 17 - Para. 9 to End",
    "lm2-337 - 2Likutey Moharan 1",
  ];
  assert.deepEqual(order([...expected].reverse()), expected);
});

test("generic lessons and textual sayings come before unnumbered specials", () => {
  for (const prefix of [
    "Azamra - Lesson",
    "Meshivas Nefesh - Lesson",
    "Sichos HaRan",
    "Sichos HaRan - Wisdom - Para.",
    "2Likutey Moharan",
  ]) {
    const expected = [
      `${prefix} 1 - Part 1`,
      `${prefix} 2 - Part 1`,
      `${prefix} 10 - Part 1`,
      "Special class - Part 2",
    ];
    assert.deepEqual(order([...expected].reverse()), expected);
  }
});

test("normalization preserves equivalence and unknown titles stay deterministic", () => {
  assert.equal(
    lessonSequenceKey({ title: " OC1  —  Lesson ００１a - Matanah " }),
    lessonSequenceKey({ title: "oc1 - lesson 001a - matanah" }),
  );
  assert.deepEqual(order(["Special class 10", "Special class 2", ""]), [
    "",
    "Special class 2",
    "Special class 10",
  ]);
});
