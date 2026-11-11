import { defineConfig, devices } from "@playwright/test";
import { validatePreviewCredentialEnvironment } from "./scripts/preview-credential-smoke.mjs";

const failures = validatePreviewCredentialEnvironment(process.env);
if (failures.length) throw new Error(`Preview credential preflight failed: ${failures.join(", ")}.`);

export default defineConfig({
  testDir: "./e2e",
  testMatch: "preview-credential.spec.ts",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.SMOKE_BASE_URL,
    screenshot: "off",
    trace: "off",
    video: "off",
    ...devices["Desktop Chrome"],
    extraHTTPHeaders: process.env.SMOKE_BYPASS_TOKEN
      ? { "x-vercel-protection-bypass": process.env.SMOKE_BYPASS_TOKEN }
      : undefined,
  },
});
