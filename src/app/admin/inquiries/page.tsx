import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { inquiriesDb } from "@/lib/inquiries";
import { InquiryStatus } from "@/components/contact-form";
export const dynamic = "force-dynamic";
export default async function Inquiries({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  if ((await getCurrentUser())?.role !== "admin") redirect("/admin");
  const params = await searchParams,
    page = Math.max(1, Math.min(100000, parseInt(params.page || "1") || 1)),
    status = ["new", "read", "resolved"].includes(params.status || "")
      ? params.status
      : "";
  const db = inquiriesDb(),
    where = status ? "WHERE status=?" : "",
    args = status ? [status] : [];
  const total = Number(
    (
      db.prepare(`SELECT COUNT(*) n FROM inquiries ${where}`).get(...args) as {
        n: number;
      }
    ).n,
  );
  const items = db
    .prepare(
      `SELECT *, EXISTS(SELECT 1 FROM inquiry_attachments a WHERE a.inquiry_id=inquiries.id) AS has_attachment FROM inquiries ${where} ORDER BY created_at DESC LIMIT 20 OFFSET ?`,
    )
    .all(...args, (page - 1) * 20) as {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
    has_attachment: number;
  }[];
  return (
    <div className="container section">
      <h1>Contact and community inquiries</h1>
      <p>
        Messages are stored privately here. Reply using the team’s normal email
        account; this page does not send email.
      </p>
      <form>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <button className="button">Filter</button>
      </form>
      {items.length ? (
        items.map((i) => (
          <article className="admin-member" key={i.id}>
            <h2>{i.subject || "Contact message"}</h2>
            <p>
              {i.name} · <a href={`mailto:${i.email}`}>{i.email}</a> ·{" "}
              {i.created_at.slice(0, 10)}
            </p>
            <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {i.message}
            </p>
            {Boolean(i.has_attachment) && (
              <p>
                <a href={`/api/admin/inquiries/${i.id}/attachment`}>
                  Download private photo
                </a>
              </p>
            )}
            <InquiryStatus id={i.id} status={i.status} />
          </article>
        ))
      ) : (
        <p>No messages found.</p>
      )}
      <p>
        {total} messages · Page {page}
      </p>
      {page > 1 && (
        <a className="button" href={`?status=${status}&page=${page - 1}`}>
          Previous
        </a>
      )}
      {page * 20 < total && (
        <a className="button" href={`?status=${status}&page=${page + 1}`}>
          Next
        </a>
      )}
    </div>
  );
}
