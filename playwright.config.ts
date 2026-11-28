import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL, channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"], defaultBrowserType: "chromium" },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3100",
      url: baseURL,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `CATALOG_LOCAL_REVIEW=1 npm run dev -- --hostname 127.0.0.1 --port 3101${process.env.PLAYWRIGHT_NEXT_WEBPACK ? " --webpack" : ""}`,
      url: "http://127.0.0.1:3101/research-preview/model",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
