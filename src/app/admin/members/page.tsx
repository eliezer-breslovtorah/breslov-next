import { redirect } from "next/navigation";
import { getCurrentUser, authDb } from "@/lib/auth";
import { MemberEditor, ResetLinkButton } from "@/components/admin-editor";
export const dynamic = "force-dynamic";
export default async function Members({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");
  const { q = "", page = "1" } = await searchParams,
    p = Math.max(1, parseInt(page) || 1);
  const members = authDb()
    .prepare(
      "SELECT id,email,name,role,member_until AS memberUntil FROM users WHERE role!='admin' AND (email LIKE ? OR name LIKE ?) ORDER BY created_at DESC LIMIT 30 OFFSET ?",
    )
    .all(`%${q.slice(0, 100)}%`, `%${q.slice(0, 100)}%`, (p - 1) * 30) as {
    id: string;
    email: string;
    name: string;
    role: string;
    memberUntil?: string;
  }[];
  return (
    <div className="container section">
      <h1>Member access</h1>
      <p>
        Grant access only after confirming an existing membership or payment.
        This does not create a charge or subscription.
      </p>
      <form>
        <label>
          Find a member
          <input name="q" type="search" defaultValue={q} />
        </label>
        <button className="button">Search</button>
      </form>
      {members.map((m) => (
        <article className="admin-member" key={m.id}>
          <h2>{m.name}</h2>
          <p>{m.email}</p>
          <ResetLinkButton id={m.id} />
          <MemberEditor id={m.id} role={m.role} until={m.memberUntil} />
        </article>
      ))}
      <p>
        <a href={`?q=${encodeURIComponent(q)}&page=${Math.max(1, p - 1)}`}>
          Previous
        </a>{" "}
        · <a href={`?q=${encodeURIComponent(q)}&page=${p + 1}`}>Next</a>
      </p>
    </div>
  );
}
