import { randomBytes, createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
const directory = resolve(process.env.APP_DATA_DIR || "data"),
  database = resolve(directory, "breslov.sqlite");
if (existsSync(database)) {
  const db = new DatabaseSync(database);
  if (
    db.prepare("SELECT name FROM sqlite_master WHERE name='users'").get() &&
    db.prepare("SELECT id FROM users WHERE role='admin'").get()
  ) {
    db.close();
    throw Error(
      "An administrator already exists. Use member administration for password recovery.",
    );
  }
  db.close();
}
mkdirSync(directory, { recursive: true, mode: 0o700 });
const token = randomBytes(32).toString("hex");
writeFileSync(
  resolve(directory, "admin-setup.json"),
  JSON.stringify({
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expires: Date.now() + 1800000,
  }),
  { mode: 0o600 },
);
console.log(
  `${process.env.APP_ORIGIN || "http://127.0.0.1:3000"}/admin/setup?token=${token}`,
);
