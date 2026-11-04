import assert from "node:assert/strict";
import test from "node:test";
import { HEALTH_PROFESSIONAL_TERMS } from "../lib/legal-documents.ts";
import { assessProfessionalTermsCompatibility, loadProfessionalTerms } from "../lib/professional-terms-api.ts";
import {
  GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT,
  parseGetCurrentProfessionalTermsResponse,
} from "../lib/generated/professional-terms-contract.ts";

test("generated parser accepts the contracted professional terms response", () => {
  const result = parseGetCurrentProfessionalTermsResponse({
    version: HEALTH_PROFESSIONAL_TERMS.version,
    url: HEALTH_PROFESSIONAL_TERMS.canonicalUrl,
  });
  assert.equal(result.ok, true);
  assert.equal(GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT.path, "/care/professional/terms");
  assert.match(GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT.sourceSha, /^[a-f0-9]{40}$/);
});

test("generated parser rejects malformed payloads without leaking their values", () => {
  const result = parseGetCurrentProfessionalTermsResponse({ version: 7, url: "javascript:secret" });
  assert.deepEqual(result, {
    ok: false,
    error: { code: "INVALID_RESPONSE", issues: ["version", "url"] },
  });
  assert.equal(JSON.stringify(result).includes("secret"), false);
});

test("compatibility check detects API and Web manifest drift", () => {
  const result = assessProfessionalTermsCompatibility({
    version: "professional-terms-vNext",
    url: HEALTH_PROFESSIONAL_TERMS.canonicalUrl,
  });
  assert.equal(result.status, "MISMATCH");
});

test("compatibility check accepts the current Web manifest", () => {
  const result = assessProfessionalTermsCompatibility({
    version: HEALTH_PROFESSIONAL_TERMS.version,
    url: HEALTH_PROFESSIONAL_TERMS.canonicalUrl,
  });
  assert.equal(result.status, "MATCH");
});

test("capability loader uses the generated path and returns a matching response", async () => {
  let requestedUrl = "";
  const result = await loadProfessionalTerms("https://api.momiz.test/", async (input) => {
    requestedUrl = String(input);
    return Response.json({
      version: HEALTH_PROFESSIONAL_TERMS.version,
      url: HEALTH_PROFESSIONAL_TERMS.canonicalUrl,
    });
  });
  assert.equal(requestedUrl, "https://api.momiz.test/api/care/professional/terms");
  assert.equal(result.status, "MATCH");
});

test("capability loader normalizes upstream errors without response payload", async () => {
  const result = await loadProfessionalTerms("https://api.momiz.test", async () =>
    new Response("patient@example.com", { status: 503 }));
  assert.deepEqual(result, { status: "UPSTREAM_ERROR" });
  assert.equal(JSON.stringify(result).includes("patient@example.com"), false);
});
