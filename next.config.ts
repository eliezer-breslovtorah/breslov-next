import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["node:sqlite"],
  outputFileTracingIncludes: { "/*": ["./content/*.json"] },
  distDir: process.env.NEXT_OUTPUT_DIR || ".next",
};
export default config;
