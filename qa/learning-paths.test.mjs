import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  STARTER_STEPS,
  LIFE_TOPICS,
  RAV_NASAN_SAMPLES,
  SYSTEMATIC_TEXTS,
} from "../src/lib/learning-paths.ts";
import {
  getLessonPass,
  LESSON_PASS_COLLECTIONS,
} from "../src/lib/lesson-pass.ts";

const catalog = JSON.parse(
  readFileSync(new URL("../content/catalog.json", import.meta.url)),
);
const lessons = new Map(catalog.lessons.map((lesson) => [lesson.slug, lesson]));
const collections = new Map(
  catalog.collections.map((course) => [course.slug, course]),
);

function courseMembership(lesson, course) {
  return lesson.categories.some(
    (term) => term.id === course.sourceId && term.taxonomy === course.taxonomy,
  );
}

test("beginner steps reference real public Rav Nasan lessons inside their advertised courses", () => {
  assert.equal(STARTER_STEPS.length, 4);
  for (const step of STARTER_STEPS) {
    const lesson = lessons.get(step.lessonSlug);
    const course = collections.get(step.courseSlug);
    assert.ok(lesson, step.lessonSlug);
    assert.equal(lesson.title, step.lessonTitle);
    assert.equal(lesson.speaker, "Rabbi Nasan Maimon");
    assert.equal(lesson.access, "public");
    assert.ok(courseMembership(lesson, course), step.courseSlug);
  }
  const azamra = collections.get("azamra");
  const numbered = catalog.lessons.filter((lesson) =>
    courseMembership(lesson, azamra),
  );
  assert.equal(numbered.length, 5);
  assert.ok(
    numbered.every((lesson) => /^Azamra - Lesson [1-5] -/.test(lesson.title)),
  );
});

test("life-topic links lead to existing nonempty collections, including Hebrew subject metadata", () => {
  for (const topic of LIFE_TOPICS) {
    assert.match(topic.href, /^\/courses\//);
    const course = collections.get(topic.href.split("/").at(-1));
    assert.ok(course, topic.href);
    assert.ok(
      catalog.lessons.some((lesson) => courseMembership(lesson, course)),
    );
  }
});

test("Rav Nasan samples reuse existing public excerpts belonging to his actual lessons", () => {
  assert.equal(RAV_NASAN_SAMPLES.length, 3);
  for (const sample of RAV_NASAN_SAMPLES) {
    const lesson = lessons.get(sample.pageUrl.split("/").at(-1));
    assert.equal(lesson.speaker, "Rabbi Nasan Maimon");
    assert.equal(lesson.access, "public");
    assert.match(sample.audioSrc, /^\/audio\//);
  }
});

test("systematic starts are verified numbered beginnings and Halakhos passes stay distinct", () => {
  for (const text of SYSTEMATIC_TEXTS) {
    const slug = text.href.split("/").at(-1);
    const course = collections.get(slug);
    const passCollection = LESSON_PASS_COLLECTIONS.find(
      (item) => item.slug === slug,
    );
    assert.ok(course || passCollection, slug);
    if (!text.startingLessonSlug) continue;
    const lesson = lessons.get(text.startingLessonSlug);
    assert.ok(lesson);
    assert.equal(lesson.access, "public");
    if (passCollection)
      assert.equal(getLessonPass(lesson), passCollection.pass);
    else assert.ok(courseMembership(lesson, course));
  }
  const starts = SYSTEMATIC_TEXTS.filter((item) => item.startingLessonSlug);
  assert.ok(
    starts.every((item) =>
      /(?:lesson-0*1(?:-|$)|haran-001$)/.test(item.startingLessonSlug),
    ),
  );
});
