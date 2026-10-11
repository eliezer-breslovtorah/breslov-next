/** Reviewed donor/beneficiary tags from the imported dedication text.
 * These are topic exclusions only: keep dedications, authors, and original data.
 * Deliberately retain biblical names and ambiguous topics (e.g. Rachel, hill).
 * Add exact slugs after reviewing their lesson/dedication context; never infer
 * that every capitalized word or Hebrew personal name is a donor.
 */
export const excludedTagSlugs: readonly string[] = [
  "kneubuhl",
  "adams",
  "jeanette",
  "jeanette-adams",
  "rudy",
  "rudy-dedication",
  "nathan-rudy",
  "eza-rudy",
  "seidner",
  "dedication-hill",
  "william",
  "markiewitz",
  "rubin",
  "ezra-rubin",
  "yosef-ruben",
  "ruben",
  "taback",
  "cheena-rochel",
  "chaim-menachem",
  "nissim-ben-naomi",
  "nissan-ben-naomi",
  "joel-kaplan",
  "kaplan",
  "ezra-ben-seti",
  "berger",
  "hechtman",
  "zwebner",
  "wurtzel",
  "hamburg",
  "benmeleh",
  "nachman-shimshon",
  "mansheim",
  "ozer",
];

const excluded = new Set(excludedTagSlugs);
export function isPublicLessonTag(tag: { slug: string; taxonomy: string }) {
  return (
    tag.taxonomy !== "post_tag" || !excluded.has(tag.slug.trim().toLowerCase())
  );
}
