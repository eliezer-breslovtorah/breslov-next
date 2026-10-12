import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  isHiddenTeacher,
  publicLessonSql,
} from "../src/lib/lesson-visibility.ts";

test("Sara lessons are hidden with a single or multiple listed teachers, retaining staff records", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE lessons (speaker TEXT, status TEXT)");
  const insert = db.prepare("INSERT INTO lessons VALUES (?,?)");
  for (const speaker of [
    "Sara Wurtzel",
    "Rabbi Nasan Maimon, Sara Wurtzel",
    "Rabbi Zvi Aryeh Rosenfeld z”l, Sara Wurtzel",
    'Rabbi Michel Dorfman z"l, Sara Wurtzel',
  ]) {
    insert.run(speaker, "publish");
    assert.equal(isHiddenTeacher(speaker), true);
  }
  insert.run("Rabbi Nasan Maimon", "publish");
  insert.run("Rabbi Nasan Maimon", "draft");
  assert.equal(
    db
      .prepare(`SELECT COUNT(*) n FROM lessons l WHERE ${publicLessonSql()}`)
      .get().n,
    1,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM lessons").get().n, 6);
  assert.throws(() => publicLessonSql("l; DROP TABLE lessons"));
  db.close();
});
