import assert from "node:assert/strict";
import test from "node:test";
import { localAdminFixtureCookies, readSyntheticAccount } from "../e2e/authenticated-smoke-fixture.ts";

test("authenticated smoke fixture stays disabled without secrets", () => {
  assert.equal(readSyntheticAccount({}), null);
  assert.equal(readSyntheticAccount({ SMOKE_AUTH_EMAIL: "synthetic@example.test" }), null);
});

test("local admin fixture fails closed outside loopback and contains no real secret", () => {
  assert.equal(localAdminFixtureCookies("https://preview.example.test"), null);
  assert.equal(localAdminFixtureCookies("not-a-url"), null);
  const cookies = localAdminFixtureCookies("http://127.0.0.1:3021");
  assert.equal(cookies?.length, 2);
  assert.equal(cookies?.every((cookie) => cookie.httpOnly && cookie.url.startsWith("http://127.0.0.1:3021/admin")), true);
  assert.equal(JSON.stringify(cookies).includes("SMOKE_AUTH_PASSWORD"), false);
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
