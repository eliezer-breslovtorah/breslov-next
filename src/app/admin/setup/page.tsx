export const metadata = { referrer: "no-referrer" as const };
import { SetupForm } from "@/components/admin-editor";
export const dynamic = "force-dynamic";
export default async function Setup({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container section">
      <h1>Set up team administration</h1>
      <p>
        This one-time link expires after 30 minutes. Choose the administrator’s
        email and a password of at least 12 characters.
      </p>
      {token ? (
        <SetupForm token={token} />
      ) : (
        <p>Ask the server owner to generate a secure setup link.</p>
      )}
    </div>
  );
}
