import assert from "node:assert/strict";
import test from "node:test";
import { HEALTH_PROFESSIONAL_TERMS } from "../lib/legal-documents.ts";
import { assessProfessionalTermsCompatibility, loadProfessionalTerms } from "../lib/professional-terms-api.ts";
import {
  GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT,
  parseGetCurrentProfessionalTermsResponse,
} from "../lib/generated/professional-terms-contract.ts";

const currentPayload = (overrides: Record<string, unknown> = {}) => ({
  version: HEALTH_PROFESSIONAL_TERMS.acceptanceId,
  acceptanceId: HEALTH_PROFESSIONAL_TERMS.acceptanceId,
  documentVersion: HEALTH_PROFESSIONAL_TERMS.version,
  path: HEALTH_PROFESSIONAL_TERMS.path,
  url: HEALTH_PROFESSIONAL_TERMS.canonicalUrl,
  legalReviewStatus: HEALTH_PROFESSIONAL_TERMS.approvalStatus,
  ...overrides,
});

test("generated parser derives the stabilized terms identity contract", () => {
  const result = parseGetCurrentProfessionalTermsResponse(currentPayload());
  assert.equal(result.ok, true);
  assert.equal(GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT.path, "/care/professional/terms");
  assert.match(GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT.sourceSha, /^[a-f0-9]{40}$/);
  assert.equal(GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT.sourceChecksum, "6d2391ec25a20047d71e039c06f43bd2c6d67d519fbb159163b288fc6ba1153b");
});

test("generated parser rejects malformed fields and enum without leaking values", () => {
  const result = parseGetCurrentProfessionalTermsResponse(currentPayload({
    acceptanceId: 7,
    url: "javascript:secret",
    legalReviewStatus: "APPROVED_WITH_SECRET",
  }));
  assert.deepEqual(result, {
    ok: false,
    error: { code: "INVALID_RESPONSE", issues: ["acceptanceId", "url", "legalReviewStatus"] },
  });
  assert.equal(JSON.stringify(result).includes("secret"), false);
});

test("compatibility check accepts distinct technical and editorial identities", () => {
  assert.equal(assessProfessionalTermsCompatibility(currentPayload()).status, "MATCH");
});

test("legacy version alias is accepted only as acceptanceId fallback", () => {
  const legacyPayload = Object.fromEntries(
    Object.entries(currentPayload()).filter(([key]) => key !== "acceptanceId"),
  );
  assert.equal(assessProfessionalTermsCompatibility(legacyPayload).status, "MATCH");
});

test("mismatch in acceptanceId, alias, or documentVersion fails closed", () => {
  assert.equal(assessProfessionalTermsCompatibility(currentPayload({ acceptanceId: "professional-terms-v2" })).status, "MISMATCH");
  assert.equal(assessProfessionalTermsCompatibility(currentPayload({ version: "professional-terms-v0" })).status, "MISMATCH");
  assert.equal(assessProfessionalTermsCompatibility(currentPayload({ documentVersion: "2.0" })).status, "MISMATCH");
});

test("capability loader uses generated path and returns no deprecated alias", async () => {
  let requestedUrl = "";
  const result = await loadProfessionalTerms("https://api.momiz.test/", async (input) => {
    requestedUrl = String(input);
    return Response.json(currentPayload());
  });
  assert.equal(requestedUrl, "https://api.momiz.test/api/care/professional/terms");
  assert.deepEqual(result, {
    status: "MATCH",
    value: {
      acceptanceId: HEALTH_PROFESSIONAL_TERMS.acceptanceId,
      documentVersion: HEALTH_PROFESSIONAL_TERMS.version,
      path: HEALTH_PROFESSIONAL_TERMS.path,
      url: HEALTH_PROFESSIONAL_TERMS.canonicalUrl,
      legalReviewStatus: "PENDING_LEGAL_REVIEW",
    },
  });
  assert.equal("version" in (result.status === "MATCH" ? result.value : {}), false);
});

test("capability loader normalizes upstream errors without response payload", async () => {
  const result = await loadProfessionalTerms("https://api.momiz.test", async () =>
    new Response("patient@example.com", { status: 503 }));
  assert.deepEqual(result, { status: "UPSTREAM_ERROR" });
  assert.equal(JSON.stringify(result).includes("patient@example.com"), false);
});
