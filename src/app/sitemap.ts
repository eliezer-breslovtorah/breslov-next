import type { MetadataRoute } from "next";
import { lessons, collections, teachers } from "@/lib/catalog";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return [
    "",
    "/library",
    "/courses",
    "/teachers",
    "/about",
    ...lessons.map((l) => `/lessons/${l.slug}`),
    ...collections.map((c) => `/courses/${c.slug}`),
    ...teachers.map((t) => `/teachers/${t.slug}`),
  ].map((path) => ({ url: `${base}${path}` }));
}
