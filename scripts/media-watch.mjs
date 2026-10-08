#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createMediaWatcher } from "./lib/media-watch.mjs";

const once = process.argv.includes("--once");
if (process.argv.includes("--help")) {
  console.log(
    "Usage: npm run media:watch [-- --once]\nConfigure MEDIA_ROOT, MEDIA_WATCH_DIR, APP_DATA_DIR; see docs/MEDIA-WATCHER.md.",
  );
  process.exit(0);
}
if (process.argv.slice(2).some((arg) => arg !== "--once"))
  throw Error("Unknown watcher option; use --help");
if (!process.env.MEDIA_ROOT)
  throw Error("MEDIA_ROOT is required (original storage parent)");
const interval = Number(process.env.MEDIA_WATCH_INTERVAL_MS || 30000);
const stableMs = Number(process.env.MEDIA_WATCH_STABLE_MS || 30000);
if (!Number.isSafeInteger(interval) || interval < 1000)
  throw Error("Watch interval must be at least 1000 milliseconds");
if (!Number.isSafeInteger(stableMs) || stableMs < 1000)
  throw Error("Stability interval must be at least 1000 milliseconds");
const mediaRoot = resolve(process.env.MEDIA_ROOT);
const watchDirectory = resolve(
  process.env.MEDIA_WATCH_DIR || resolve(mediaRoot, "media"),
);
const rules = process.env.MEDIA_WATCH_RULES_PATH
  ? JSON.parse(
      await readFile(resolve(process.env.MEDIA_WATCH_RULES_PATH), "utf8"),
    )
  : [];
if (!Array.isArray(rules)) throw Error("Watcher rules must be a JSON array");
const options = {
  dataDirectory: resolve(process.env.APP_DATA_DIR || "data"),
  mediaRoot,
  watchDirectory,
  stableMs,
  access: process.env.MEDIA_WATCH_ACCESS || "members",
  rules,
  logger: (event) =>
    console.log(JSON.stringify({ at: new Date().toISOString(), ...event })),
};
const stop = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => stop.abort());
let watcher;
try {
  do {
    try {
      watcher ||= await createMediaWatcher(options);
      await watcher.scan();
    } catch (error) {
      console.error(
        JSON.stringify({
          at: new Date().toISOString(),
          event: "error",
          message: error.message,
        }),
      );
      if (once) {
        process.exitCode = 1;
        break;
      }
    }
    if (once || stop.signal.aborted) break;
    await delay(interval, undefined, { signal: stop.signal }).catch((error) => {
      if (error.name !== "AbortError") throw error;
    });
  } while (!stop.signal.aborted);
} finally {
  watcher?.close();
}
