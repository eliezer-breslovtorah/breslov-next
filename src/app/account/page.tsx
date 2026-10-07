import Link from "next/link";
import { getCurrentUser, authDb, canAccessMembers } from "@/lib/auth";
import { getLessonById } from "@/lib/store";
import { AccountForm, LogoutButton } from "@/components/account-forms";
export const dynamic = "force-dynamic";
export default async function Account() {
  const user = await getCurrentUser();
  if (!user)
    return (
      <div className="container section">
        <h1>Your learning account</h1>
        <p>Sign in to save lessons and return to your learning.</p>
        <AccountForm action="login" />
        <p>
          <Link href="/account/reset">Forgot your password?</Link>
        </p>
        <p>
          New here? <Link href="/account/signup">Create an account</Link>
        </p>
        <p>
          Existing Breslov Torah members can sign in with their current email
          and password.
        </p>
      </div>
    );
  const db = authDb();
  const bookmarks = db
    .prepare(
      "SELECT lesson_id FROM bookmarks WHERE user_id=? ORDER BY created_at DESC LIMIT 100",
    )
    .all(user.id) as { lesson_id: string }[];
  const history = db
    .prepare(
      "SELECT lesson_id,position FROM listening_history WHERE user_id=? ORDER BY updated_at DESC LIMIT 50",
    )
    .all(user.id) as { lesson_id: string; position: number }[];
  return (
    <div className="container section">
      <h1>Welcome, {user.name}</h1>
      <p>
        {user.email} ·{" "}
        {canAccessMembers(user) ? "Member access" : "Learning account"}
        {user.memberUntil && ` through ${user.memberUntil.slice(0, 10)}`}
      </p>
      <LogoutButton />
      {user.role === "admin" && (
        <p>
          <Link href="/admin">Open administration</Link>
        </p>
      )}
      <h2>Saved lessons</h2>
      {bookmarks.length ? (
        bookmarks.map((b) => {
          const l = getLessonById(b.lesson_id);
          return l ? (
            <p key={b.lesson_id}>
              <Link href={`/lessons/${l.slug}`}>{l.title}</Link>
            </p>
          ) : null;
        })
      ) : (
        <p>You haven’t saved any lessons yet.</p>
      )}
      <h2>Recently listened</h2>
      {history.length ? (
        history.map((b) => {
          const l = getLessonById(b.lesson_id);
          return l ? (
            <p key={b.lesson_id}>
              <Link href={`/lessons/${l.slug}`}>{l.title}</Link> ·{" "}
              {Math.floor(b.position / 60)} minutes in
            </p>
          ) : null;
        })
      ) : (
        <p>Your listening history will appear here.</p>
      )}
      <h2>Change password</h2>
      <AccountForm action="password" />
    </div>
  );
}
