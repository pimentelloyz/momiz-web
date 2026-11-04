import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function runPreflight(env: Record<string, string>) {
  return spawnSync(process.execPath, ["scripts/release-preflight.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("release preflight accepts a local dry-run with environment, URL and SHA", () => {
  const result = runPreflight({
    SMOKE_BASE_URL: "http://127.0.0.1:3021",
    SMOKE_ENVIRONMENT: "preview",
    SMOKE_EXPECTED_SHA: "1234567890abcdef",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Release preflight passed/);
});

test("release preflight blocks invalid deployment inputs", () => {
  const result = runPreflight({
    SMOKE_BASE_URL: "https://user:password@example.com/path",
    SMOKE_ENVIRONMENT: "staging",
    SMOKE_EXPECTED_SHA: "not-a-sha",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Release preflight failed/);
  assert.doesNotMatch(result.stderr, /password/);
});
