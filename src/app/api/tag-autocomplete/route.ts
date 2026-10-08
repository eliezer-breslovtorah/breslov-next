import { autocompleteTags } from "@/lib/tag-search";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  return Response.json(
    { tags: autocompleteTags(q) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
