import assert from "node:assert/strict";
import test from "node:test";
import {
  HEALTH_PROFESSIONAL_TERMS,
  LEGAL_DOCUMENT_HISTORY,
  legalDocumentsManifest,
} from "../lib/legal-documents.ts";
import {
  correlatedResponseHeaders,
  requestCorrelationHeaders,
  safeRequestId,
} from "../lib/request-correlation.ts";

test("professional terms expose one canonical current version and an auditable archive", () => {
  assert.equal(HEALTH_PROFESSIONAL_TERMS.version, "1.0");
  assert.equal(HEALTH_PROFESSIONAL_TERMS.acceptanceId, "professional-terms-v1");
  assert.equal(HEALTH_PROFESSIONAL_TERMS.effectiveDate, "2026-11-04");
  assert.match(HEALTH_PROFESSIONAL_TERMS.canonicalUrl, /^https:\/\/momiz\.com\.br\//);
  assert.match(HEALTH_PROFESSIONAL_TERMS.archiveUrl, /\/legal\/health-professional-terms\/1\.0$/);
  assert.equal(new Set(LEGAL_DOCUMENT_HISTORY.map((document) => document.version)).size, LEGAL_DOCUMENT_HISTORY.length);
  assert.equal(HEALTH_PROFESSIONAL_TERMS.approvalStatus, "PENDING_LEGAL_REVIEW");

  const manifest = legalDocumentsManifest();
  assert.equal(manifest.documents[0].currentVersion, HEALTH_PROFESSIONAL_TERMS.version);
  assert.equal(manifest.documents[0].acceptanceId, HEALTH_PROFESSIONAL_TERMS.acceptanceId);
  assert.equal(manifest.documents[0].documentVersion, HEALTH_PROFESSIONAL_TERMS.version);
  assert.equal(manifest.documents[0].canonicalUrl, HEALTH_PROFESSIONAL_TERMS.canonicalUrl);
  assert.equal(manifest.documents[0].versions.length, LEGAL_DOCUMENT_HISTORY.length);
});

test("request correlation accepts opaque identifiers and rejects PII or control characters", () => {
  assert.equal(safeRequestId("req_01.H-safe:trace"), "req_01.H-safe:trace");
  assert.equal(safeRequestId("patient@example.com"), null);
  assert.equal(safeRequestId("req-safe\r\nx-leak:true"), null);
  assert.equal(requestCorrelationHeaders("patient@example.com").has("x-request-id"), false);
});

test("response correlation prefers a safe upstream id without copying payload data", () => {
  const upstream = new Response(JSON.stringify({ email: "patient@example.com", token: "secret" }), {
    headers: { "x-request-id": "upstream-safe-01", "x-internal-debug": "do-not-forward" },
  });
  const headers = correlatedResponseHeaders(upstream, "incoming-safe-01", { "content-type": "application/json" });
  assert.equal(headers.get("x-request-id"), "upstream-safe-01");
  assert.equal(headers.get("x-internal-debug"), null);
  assert.equal([...headers.values()].some((value) => value.includes("patient@example.com") || value.includes("secret")), false);
});
