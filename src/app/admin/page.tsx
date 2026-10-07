import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLessons, catalogStats } from "@/lib/store";
import { AccountForm } from "@/components/account-forms";
export const dynamic = "force-dynamic";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user)
    return (
      <div className="container section">
        <h1>Team sign in</h1>
        <AccountForm action="login" />
        <p>
          Administrators are configured by the server owner. No default account
          is provided.
        </p>
      </div>
    );
  if (user.role !== "admin") redirect("/account");
  const params = await searchParams,
    result = getLessons({ ...params, includeDrafts: true, pageSize: 30 }),
    stats = catalogStats();
  return (
    <div className="container section">
      <h1>Lesson administration</h1>
      <p>
        {stats.lessons.toLocaleString()} published · {stats.drafts} drafts
      </p>
      <p>
        <Link className="button primary" href="/admin/lessons/new">
          New lesson
        </Link>{" "}
        <Link className="button" href="/admin/members">
          Manage members
        </Link>
        <Link className="button" href="/admin/taxonomy">
          Categories and teachers
        </Link>{" "}
        <Link className="button" href="/admin/inquiries">
          Contact inquiries
        </Link>
      </p>
      <form>
        <label>
          Find a lesson
          <input name="q" defaultValue={params.q} type="search" />
        </label>
        <button className="button">Search</button>
      </form>
      <div className="admin-list">
        {result.items.map((l) => (
          <article key={l.id}>
            <Link href={`/admin/lessons/${l.id}`}>{l.title}</Link>
            <p>
              {l.speaker} · {l.status} · {l.access}
            </p>
          </article>
        ))}
      </div>
      <p>
        Page {result.page} of{" "}
        {Math.max(1, Math.ceil(result.total / result.pageSize))}
      </p>
      {result.page > 1 && (
        <Link
          className="button"
          href={`?q=${encodeURIComponent(params.q || "")}&page=${result.page - 1}`}
        >
          Previous
        </Link>
      )}
      {result.page * result.pageSize < result.total && (
        <Link
          className="button"
          href={`?q=${encodeURIComponent(params.q || "")}&page=${result.page + 1}`}
        >
          Next
        </Link>
      )}
    </div>
  );
}
