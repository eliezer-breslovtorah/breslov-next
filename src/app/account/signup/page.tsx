import { AccountForm } from "@/components/account-forms";
export default function Signup() {
  return (
    <div className="container section">
      <h1>Create your learning account</h1>
      <p>
        Save lessons and keep track of your learning. Creating an account does
        not purchase membership.
      </p>
      <AccountForm action="signup" />
    </div>
  );
}
