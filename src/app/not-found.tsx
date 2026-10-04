import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-wrap empty-state">
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>Let’s find your next teaching.</h1>
      <p>The page may have moved. Explore the library or return home.</p>
      <Link className="button" href="/library">
        Explore the library
      </Link>
    </div>
  );
}
