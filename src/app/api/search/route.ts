import { getLessons } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  return Response.json(
    getLessons({
      q: q.get("q") || "",
      page: q.get("page") || "1",
      pageSize: 20,
      teacher: q.get("teacher") || "",
      category: q.get("category") || "",
      format: q.get("format") || "",
      topic: q.get("topic") || "",
      sort: q.get("sort") || "relevance",
    }),
    { headers: { "Cache-Control": "no-store" } },
  );
}
