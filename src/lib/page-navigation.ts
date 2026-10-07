import aliases from "../../content/page-aliases.json";
import links from "../../content/page-links.json";
export const nativePages: Record<string, string> = {
  home: "/",
  blog: "/blog",
  contact: "/contact",
  calendar: "/calendar",
  courses: "/courses",
  topics: "/library",
  parsha: "/calendar",
  "about-us": "/about",
  "rabbi-maimon-media-library": "/teachers/nasan-maimon",
  "rabbi-rosenfeld": "/teachers/zvi-aryeh-rosenfeld",
  "rabbi-yechiel-michel-dorfman-zal": "/teachers/michel-dorfman",
  "become-a-member": "/donate",
  "join-our-mailing-list": "/newsletter",
  "parsha-email-the-breslov-bridge": "/newsletter",
  "parsha-newsletter-the-breslov-bridge-archive": "/newsletter",
  "the-matchmakers-chair": "/community/matchmaking",
  "matchmaker-follow-up-questionnaire": "/community/matchmaking/follow-up",
};
export function nativePageDestination(slug: string) {
  return Object.prototype.hasOwnProperty.call(nativePages, slug)
    ? nativePages[slug]
    : undefined;
}
export function legacyDestination(path: string) {
  const key = path.replace(/\/$/, "");
  const map = aliases as Record<string, string>;
  const candidates = [key, encodeURI(key)];
  try {
    candidates.push(decodeURI(key));
  } catch {}
  for (const candidate of candidates) {
    const value = map[candidate];
    if (
      typeof value === "string" &&
      value.startsWith("/") &&
      !value.startsWith("//")
    )
      return value;
  }
}
export function publicPageLinks(slug: string) {
  const map = links as Record<string, { label: string; href: string }[]>;
  return Object.prototype.hasOwnProperty.call(map, slug) ? map[slug] : [];
}
