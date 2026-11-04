import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.SMOKE_BASE_URL;
if (!baseURL) throw new Error('SMOKE_BASE_URL is required for release E2E.');

export default defineConfig({
  testDir: './e2e',
  testMatch: 'release-auth.spec.ts',
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    screenshot: 'off',
    trace: 'off',
    video: 'off',
    ...devices['Desktop Chrome'],
    extraHTTPHeaders: process.env.SMOKE_BYPASS_TOKEN
      ? { 'x-vercel-protection-bypass': process.env.SMOKE_BYPASS_TOKEN }
      : undefined,
  },
});
