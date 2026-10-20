import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  reporter: "list",
  use: { headless: true, screenshot: "only-on-failure" },
  webServer: [
    {
      command: "python tests/serve-website.py",
      url: "http://localhost:4175",
      reuseExistingServer: true,
    },
    {
      command: "npm run dev -w @plugnear/admin -- --port 4173",
      url: "http://localhost:4173",
      reuseExistingServer: true,
    },
    {
      command: "python -m http.server 4174 --directory apps/mobile/dist-web",
      url: "http://localhost:4174",
      reuseExistingServer: true,
    },
  ],
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
