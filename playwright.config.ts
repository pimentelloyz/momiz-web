import { defineConfig, devices } from "@playwright/test";

const appUrl = "http://127.0.0.1:3121";
const mockApiUrl = "http://127.0.0.1:3122";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["release-auth.spec.ts", "preview-credential.spec.ts"],
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
      env: { MOMIZ_E2E_MOCK_PORT: "3122" },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "npx next start --hostname 127.0.0.1 --port 3121",
      url: appUrl,
      env: {
        API_BASE_URL: mockApiUrl,
        SITE_URL: appUrl,
        VERCEL_ENV: "",
        MOMIZ_AUTH_CONFIG_REQUIRED: "false",
        FIREBASE_WEB_API_KEY: "",
        FIREBASE_PROJECT_ID: "",
        FIREBASE_AUTH_DOMAIN: "",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
