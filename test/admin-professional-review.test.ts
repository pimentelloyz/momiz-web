import assert from "node:assert/strict";
import test from "node:test";
import { AdminApiError } from "../app/admin/ui/admin-api-client.ts";
import {
  isCurrentProfessionalProfileRequest,
  professionalReviewPayload,
  readProfessionalReviewResult,
  submitProfessionalReviewWithReconciliation,
} from "../app/admin/ui/admin-professional-review.ts";

const updatedAt = "2026-11-12T12:00:00.000Z";
const response = {
  profile: {
    id: "10000000-0000-4000-8000-000000000001",
    verificationStatus: "VERIFIED",
    updatedAt,
  },
  reviewedRenewal: false,
};

test("professional review builds current and legacy payloads with local reason validation", () => {
  assert.deepEqual(professionalReviewPayload("reject", "  motivo válido  ", updatedAt), {
    decision: "reject",
    reason: "motivo válido",
    expectedUpdatedAt: updatedAt,
  });
  assert.deepEqual(professionalReviewPayload("verify", "ignored", null), { decision: "verify" });
  assert.throws(() => professionalReviewPayload("suspend", "", updatedAt), /motivo/);
  assert.throws(() => professionalReviewPayload("reject", "x".repeat(1001), updatedAt), /1000/);
});

test("professional review response keeps only the minimal allowlist", () => {
  assert.deepEqual(readProfessionalReviewResult({
    ...response,
    profile: { ...response.profile, user: { email: "must-not-leak" }, credentials: ["must-not-leak"], reason: "must-not-leak" },
    audit: "must-not-leak",
  }), response);
});

test("professional review success validates response and reloads authoritatively", async () => {
  let reloads = 0;
  const result = await submitProfessionalReviewWithReconciliation(async () => response, async () => { reloads += 1; });
  assert.deepEqual(result, response);
  assert.equal(reloads, 1);
});

test("professional review conflict reloads once, preserves correlation and never retries POST", async () => {
  const conflict = new AdminApiError({ message: "Perfil atualizado.", code: "PROFESSIONAL_REVIEW_VERSION_CONFLICT", requestId: "req-review-conflict", status: 409 });
  let posts = 0;
  let reloads = 0;
  await assert.rejects(
    submitProfessionalReviewWithReconciliation(async () => { posts += 1; throw conflict; }, async () => { reloads += 1; }),
    (error) => error === conflict,
  );
  assert.equal(posts, 1);
  assert.equal(reloads, 1);
  assert.equal(conflict.requestId, "req-review-conflict");
});

test("professional profile reload ignores stale responses", () => {
  assert.equal(isCurrentProfessionalProfileRequest(5, 5), true);
  assert.equal(isCurrentProfessionalProfileRequest(4, 5), false);
});
