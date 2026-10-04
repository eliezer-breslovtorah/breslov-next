import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const output = resolve(root, ".next/standalone");
if (!existsSync(resolve(output, "server.js")))
  throw new Error("Run npm run build before starting the server.");
cpSync(resolve(root, "public"), resolve(output, "public"), { recursive: true });
cpSync(resolve(root, ".next/static"), resolve(output, ".next/static"), {
  recursive: true,
});
process.env.HOSTNAME = process.env.APP_HOST || "127.0.0.1";
process.env.PORT = process.env.PORT || "3000";
process.env.NODE_ENV = "production";
await import(pathToFileURL(resolve(output, "server.js")).href);
