import { defineConfig, devices } from "@playwright/test";

const appUrl = "http://127.0.0.1:3021";
const mockApiUrl = "http://127.0.0.1:3022";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "release-auth.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: appUrl,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "ipad-webkit",
      use: { ...devices["iPad Pro 11"] },
    },
    {
      name: "android-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-api.mjs",
      url: `${mockApiUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npx next start --hostname 127.0.0.1 --port 3021",
      url: appUrl,
      env: {
        API_BASE_URL: mockApiUrl,
        SITE_URL: appUrl,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
