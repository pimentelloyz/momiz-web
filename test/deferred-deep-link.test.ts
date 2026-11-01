import assert from "node:assert/strict";
import test from "node:test";
import { buildIosResumeLink, buildPlayInstallUrl, handoffCode } from "../lib/deferred-deep-link.ts";

const token = "A".repeat(43);

test("Play URL carries only the opaque first-party handoff token", () => {
  const value = buildPlayInstallUrl("https://play.google.com/store/apps/details?id=com.lifeados.momiz.app", token);
  assert.ok(value);
  const url = new URL(value);
  assert.equal(url.searchParams.get("id"), "com.lifeados.momiz.app");
  assert.equal(url.searchParams.get("referrer"), `momiz_ddl_v1=${token}`);
  assert.equal(value.includes("guest"), false);
  assert.equal(value.includes("convite"), false);
});

test("store URL and opaque token are validated", () => {
  assert.equal(buildPlayInstallUrl("https://evil.example/app", token), null);
  assert.equal(buildPlayInstallUrl("https://play.google.com/app", "slug-visible"), null);
});

test("iOS resume link and manual code contain only the opaque token", () => {
  assert.equal(buildIosResumeLink(token), `momiz://handoff?token=${token}`);
  assert.equal(handoffCode(token), token);
  assert.equal(buildIosResumeLink("invalid"), null);
});
