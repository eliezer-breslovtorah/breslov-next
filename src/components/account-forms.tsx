"use client";
import { useState } from "react";
export function AccountForm({
  action,
}: {
  action: "login" | "signup" | "password";
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const body = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const response = await fetch(`/api/auth/${action}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }),
            data = await response.json();
          if (!response.ok) throw Error(data.error);
          if (action === "password") {
            setError("Password updated.");
            setBusy(false);
          } else {
            const next = new URLSearchParams(window.location.search).get(
              "next",
            );
            window.location.assign(
              next &&
                next.startsWith("/") &&
                !next.startsWith("//") &&
                !next.includes("\\")
                ? next
                : "/account",
            );
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Please try again");
          setBusy(false);
        }
      }}
    >
      {action === "signup" && (
        <label>
          Name
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
      )}
      {action !== "password" && (
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
      )}
      {action === "password" && (
        <label>
          Current password
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
      )}
      <label>
        {action === "password" ? "New password" : "Password"}
        <input
          name="password"
          type="password"
          required
          minLength={action === "login" ? 1 : 12}
          maxLength={256}
          autoComplete={
            action === "login" ? "current-password" : "new-password"
          }
        />
      </label>
      {action !== "login" && <p>Use at least 12 characters.</p>}
      {error && <p role="status">{error}</p>}
      <button className="button primary" disabled={busy}>
        {busy
          ? "Please wait…"
          : action === "login"
            ? "Sign in"
            : action === "signup"
              ? "Create account"
              : "Update password"}
      </button>
    </form>
  );
}
export function LogoutButton() {
  return (
    <button
      className="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign("/account");
      }}
    >
      Sign out
    </button>
  );
}
export function BookmarkButton({ lessonId }: { lessonId: string }) {
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        className="button"
        onClick={async () => {
          const r = await fetch("/api/account/bookmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId }),
          });
          const d = await r.json();
          setMessage(
            r.ok
              ? d.saved
                ? "Saved to your account"
                : "Removed from saved lessons"
              : d.error,
          );
        }}
      >
        Save lesson
      </button>
      {message && <p role="status">{message}</p>}
    </>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  return (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const r = await fetch("/api/account/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...Object.fromEntries(new FormData(e.currentTarget)),
              token,
            }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          window.location.assign("/account?reset=done");
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Please try again");
        }
      }}
    >
      <label>
        New password
        <input
          name="password"
          type="password"
          minLength={12}
          maxLength={256}
          required
          autoComplete="new-password"
        />
      </label>
      {message && <p role="alert">{message}</p>}
      <button className="button primary">Reset password</button>
    </form>
  );
}
