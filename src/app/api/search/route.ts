import { readBrowseQuery } from "@/lib/browse-query";
import { getLessons } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  return Response.json(
    getLessons({
      ...readBrowseQuery(Object.fromEntries(q)),
      sort: q.get("sort") || "relevance",
    }),
    { headers: { "Cache-Control": "no-store" } },
  );
}
