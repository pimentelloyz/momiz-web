import assert from "node:assert/strict";
import test from "node:test";
import { readSyntheticAccount } from "../e2e/authenticated-smoke-fixture.ts";

test("authenticated smoke fixture stays disabled without secrets", () => {
  assert.equal(readSyntheticAccount({}), null);
  assert.equal(readSyntheticAccount({ SMOKE_AUTH_EMAIL: "synthetic@example.test" }), null);
});

test("authenticated smoke fixture reads only explicit environment values", () => {
  const account = readSyntheticAccount({
    SMOKE_AUTH_EMAIL: " synthetic@example.test ",
    SMOKE_AUTH_PASSWORD: "not-a-real-secret",
    SMOKE_AUTH_SURFACE: "admin",
    UNRELATED_SECRET: "must-not-be-read",
  });
  assert.deepEqual(account, {
    email: "synthetic@example.test",
    password: "not-a-real-secret",
    surface: "admin",
  });
  assert.equal("UNRELATED_SECRET" in (account || {}), false);
});
