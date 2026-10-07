export const metadata = { referrer: "no-referrer" as const };
import { ResetForm } from "@/components/account-forms";
export const dynamic = "force-dynamic";
export default async function Reset({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container section">
      <h1>Reset your password</h1>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p>
          Contact the Breslov Torah team for a secure, one-time password reset
          link.
        </p>
      )}
    </div>
  );
}
