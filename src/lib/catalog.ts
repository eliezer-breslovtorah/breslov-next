import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  lessons as seedLessons,
  collections as seedCollections,
  teachers as seedTeachers,
} from "./content";
import type { Lesson, Collection, Teacher } from "./content";
// This adapter loads a reviewed public metadata export at build time.
// Keep playback credentials and membership data in a separate server-side system.
function readCatalog(): {
  lessons: Lesson[];
  collections: Collection[];
  teachers: Teacher[];
} {
  const path = process.env.CONTENT_CATALOG_PATH;
  if (!path)
    return {
      lessons: seedLessons,
      collections: seedCollections,
      teachers: seedTeachers,
    };
  const raw = JSON.parse(readFileSync(resolve(path), "utf8"));
  const fields = {
    lessons: [
      "slug",
      "title",
      "speaker",
      "collection",
      "topic",
      "format",
      "description",
      "legacyUrl",
      "image",
    ],
    collections: ["slug", "title", "description", "image", "legacyUrl"],
    teachers: ["slug", "name", "description", "image", "legacyUrl"],
  };
  for (const [group, required] of Object.entries(fields)) {
    if (!Array.isArray(raw[group]))
      throw new Error(`Catalog ${group} must be an array`);
    const seen = new Set<string>();
    for (const item of raw[group]) {
      if (!item || required.some((key) => typeof item[key] !== "string"))
        throw new Error(`Invalid ${group} metadata`);
      if (!/^[\p{L}\p{N}_%-]+$/u.test(item.slug) || seen.has(item.slug))
        throw new Error(`Invalid or duplicate ${group} slug`);
      seen.add(item.slug);
      if (!item.image.startsWith("/images/"))
        throw new Error("Only reviewed local catalog images are accepted");
      const url = new URL(item.legacyUrl);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error("Invalid legacy page URL");
      if (group === "lessons" && !["Audio", "Video"].includes(item.format))
        throw new Error("Invalid media format");
      const allowed = [
        ...required,
        ...(group === "lessons" ? ["duration"] : []),
      ];
      for (const key of Object.keys(item))
        if (!allowed.includes(key))
          throw new Error(`Unexpected catalog field: ${key}`);
    }
  }
  return {
    lessons: raw.lessons,
    collections: raw.collections,
    teachers: raw.teachers.length ? raw.teachers : seedTeachers,
  };
}
export const { lessons, collections, teachers } = readCatalog();
export const isCuratedPreview = !process.env.CONTENT_CATALOG_PATH;
