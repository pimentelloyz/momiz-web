import assert from "node:assert/strict";
import test from "node:test";
import {
  contentSecurityPolicyReportOnly,
  globalSecurityHeaders,
  sensitiveResponseHeaders,
} from "../lib/security-headers.ts";

function headerMap(headers: { key: string; value: string }[]) {
  return new Map(headers.map(({ key, value }) => [key.toLowerCase(), value]));
}

test("global headers defend MIME, framing, referrer and browser capabilities", () => {
  const headers = headerMap(globalSecurityHeaders("momiz-production.firebaseapp.com"));
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(headers.get("permissions-policy") || "", /camera=\(\).*microphone=\(\).*geolocation=\(\)/);
});

test("report-only CSP is fail-closed for framing and inventories Firebase without unsafe-eval", () => {
  const policy = contentSecurityPolicyReportOnly("momiz-production.firebaseapp.com");
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /https:\/\/identitytoolkit\.googleapis\.com/);
  assert.match(policy, /https:\/\/accounts\.google\.com/);
  assert.match(policy, /https:\/\/momiz-production\.firebaseapp\.com/);
  assert.doesNotMatch(policy, /unsafe-eval|https:\/\/\*/);
});

test("sensitive responses disable storage and indexing", () => {
  const headers = headerMap(sensitiveResponseHeaders);
  assert.match(headers.get("cache-control") || "", /private.*no-store.*max-age=0/);
  assert.equal(headers.get("pragma"), "no-cache");
  assert.equal(headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
});
