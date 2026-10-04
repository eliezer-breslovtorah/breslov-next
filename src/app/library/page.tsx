import { Library } from "@/components/library";
import { lessons } from "@/lib/catalog";
export const metadata = { title: "Lesson library" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <p className="eyebrow">EXPLORE. LISTEN. GROW.</p>
        <h1>The lesson library</h1>
        <p>Find your next moment of inspiration in the teachings of Breslov.</p>
      </header>
      <Library lessons={lessons} initialQuery={q} />
    </div>
  );
}
