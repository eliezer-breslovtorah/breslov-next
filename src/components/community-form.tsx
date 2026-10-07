"use client";
import { useState } from "react";
import type { CommunityFormDefinition } from "@/lib/community-forms";
export function CommunityForm({
  definition,
}: {
  definition: CommunityFormDefinition;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  if (sent)
    return (
      <div role="status">
        <h2>Thank you</h2>
        <p>
          Your information has been received for private review by the Breslov
          Torah team.
        </p>
      </div>
    );
  return (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const r = await fetch(`/api/community/${definition.slug}`, {
            method: "POST",
            body: new FormData(e.currentTarget),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setSent(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Please try again");
          setBusy(false);
        }
      }}
    >
      {definition.fields.map((f) => {
        const name = `field_${f.id}`,
          required = f.isRequired || f.type === "name" || f.type === "email";
        if (f.type === "radio")
          return (
            <fieldset key={f.id}>
              <legend>
                {f.label}
                {required ? " *" : ""}
              </legend>
              {f.choices.map((c) => (
                <label
                  key={c.value}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    style={{ width: "auto" }}
                    type="radio"
                    name={name}
                    value={c.value}
                    required={required}
                  />
                  {c.text}
                </label>
              ))}
            </fieldset>
          );
        return (
          <label key={f.id}>
            {f.label}
            {required ? " *" : ""}
            {f.type === "textarea" ||
            f.type === "list" ||
            f.type === "address" ? (
              <>
                <textarea
                  name={name}
                  required={required}
                  rows={f.type === "address" ? 3 : 5}
                  maxLength={5000}
                />
                {f.type === "list" && (
                  <small>
                    Enter one entry per line:{" "}
                    {f.choices.map((c) => c.text).join(", ")}.
                  </small>
                )}
              </>
            ) : f.type === "fileupload" ? (
              <>
                <input type="file" name={name} accept="image/jpeg,image/png" />
                <small>
                  Optional JPEG or PNG photo, up to 5 MB. Only authorized staff
                  can view it.
                </small>
              </>
            ) : (
              <input
                name={name}
                type={
                  f.type === "email"
                    ? "email"
                    : f.type === "phone"
                      ? "tel"
                      : f.type === "number"
                        ? "number"
                        : f.type === "date"
                          ? "date"
                          : "text"
                }
                required={required}
                maxLength={f.type === "email" ? 254 : 500}
                autoComplete={
                  f.type === "name"
                    ? "name"
                    : f.type === "email"
                      ? "email"
                      : f.type === "phone"
                        ? "tel"
                        : undefined
                }
              />
            )}
          </label>
        );
      })}
      <div aria-hidden="true" style={{ position: "absolute", left: -10000 }}>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p>
        Your information is stored privately for staff review. Please share only
        information you wish the matchmaking team to receive.
      </p>
      {error && <p role="alert">{error}</p>}
      <button className="button primary" disabled={busy}>
        {busy ? "Submitting…" : "Submit questionnaire"}
      </button>
    </form>
  );
}
