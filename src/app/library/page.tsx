import { Library, type BrowseQuery } from "@/components/library";
import { getLessons } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = { title: "Lesson library" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query: BrowseQuery = Object.fromEntries(
    [
      "q",
      "teacher",
      "category",
      "collection",
      "topic",
      "format",
      "sort",
      "page",
    ].map((key) => [key, typeof raw[key] === "string" ? raw[key] : undefined]),
  );
  const result = getLessons(query);
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">EXPLORE. LISTEN. GROW.</p>
        <h1>The lesson library</h1>
        <p>Find your next moment of inspiration in the teachings of Breslov.</p>
      </header>
      <Library result={result} query={query} />
    </div>
  );
}
