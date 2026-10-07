import { getLessons, getCollections, getTeachers } from "@/lib/catalog";
export const dynamic = "force-dynamic";
const normalize = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase();
export function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") || "")
    .trim()
    .slice(0, 200);
  if (q.length < 2)
    return Response.json({ lessons: [], teachers: [], collections: [] });
  const words = normalize(q).split(/\s+/).filter(Boolean);
  const matches = (value: string) =>
    words.every((word) => normalize(value).includes(word));
  return Response.json(
    {
      lessons: getLessons({ q, pageSize: 6, sort: "relevance" }).items.map(
        ({ slug, title, speaker }) => ({ slug, title, speaker }),
      ),
      teachers: getTeachers()
        .filter((t) => matches(t.name))
        .slice(0, 3)
        .map(({ slug, name }) => ({ slug, name })),
      collections: getCollections()
        .filter((c) => matches(`${c.title} ${c.hebrewTitle || ""}`))
        .slice(0, 4)
        .map(({ slug, title }) => ({ slug, title })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
