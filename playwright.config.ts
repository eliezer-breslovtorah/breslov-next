import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./qa",
  testMatch: "**/*.spec.ts",
  timeout: 30000,
  use: {
    baseURL: process.env.QA_BASE_URL || "http://127.0.0.1:3000",
    headless: true,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "small-mobile", use: { viewport: { width: 320, height: 740 } } },
  ],
  reporter: "list",
});
