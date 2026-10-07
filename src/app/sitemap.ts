import type { MetadataRoute } from "next";
import {
  getLessons,
  getCollections,
  getTeachers,
  getPublicPages,
} from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.SITE_URL || process.env.APP_ORIGIN || "http://localhost:3000";
  const paths = [
    "",
    "/library",
    "/courses",
    "/teachers",
    "/about",
    "/donate",
    "/dedications",
    "/contact",
    "/community",
    "/calendar",
  ];
  const first = getLessons({ pageSize: 100 });
  for (let page = 1; page <= Math.ceil(first.total / 100); page++)
    for (const l of getLessons({ page, pageSize: 100 }).items)
      paths.push(`/lessons/${encodeURIComponent(l.slug)}`);
  paths.push(
    ...getCollections().map((c) => `/courses/${encodeURIComponent(c.slug)}`),
    ...getTeachers().map((t) => `/teachers/${t.slug}`),
    ...getPublicPages().map((p) => `/pages/${encodeURIComponent(p.slug)}`),
  );
  return paths.map((path) => ({ url: base + path }));
}
