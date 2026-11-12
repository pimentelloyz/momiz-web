import assert from "node:assert/strict";
import test from "node:test";
import { mergeAdminProfilePages, readAdminProfilePage } from "../app/admin/ui/admin-profile-pagination.ts";

const credential = {
  id: "20000000-0000-4000-8000-000000000001", type: "CRM", status: "PENDING", issuer: "Conselho",
  registrationNumber: "123", jurisdiction: "SP", expiresAt: null, documentFileName: "proof.pdf",
  renewalOfCredentialId: null, reviewedAt: null, createdAt: "2026-11-01T12:00:00.000Z", updatedAt: "2026-11-12T12:00:00.000Z",
};
const log = {
  id: "30000000-0000-4000-8000-000000000001", action: "SUBMITTED", previousStatus: "DRAFT",
  resultingStatus: "PENDING_VERIFICATION", reason: null, createdAt: "2026-11-11T12:00:00.000Z",
};
const profile = {
  id: "10000000-0000-4000-8000-000000000001", displayName: "Profissional Sintética", primaryProfession: "DOULA",
  verificationStatus: "PENDING_VERIFICATION", submittedAt: "2026-11-11T12:00:00.000Z", verifiedAt: null,
  city: "Cidade", state: "SP", bio: null, updatedAt: "2026-11-12T12:00:00.000Z",
  user: { name: "Conta Sintética", email: "synthetic@example.test" }, credentials: [credential], reviewLogs: [log],
};

test("profile pagination prefers items, validates nesting and preserves cursor", () => {
  const page = readAdminProfilePage({ items: [profile], profiles: [{ ...profile, id: "10000000-0000-4000-8000-000000000002" }], nextCursor: "opaque" });
  assert.deepEqual(page.items, [profile]);
  assert.equal(page.nextCursor, "opaque");
});

test("profile parser discards removed fields deeply", () => {
  const parsed = readAdminProfilePage({ items: [{
    ...profile, phone: "must-not-leak", workplace: "must-not-leak", createdAt: "must-not-leak",
    user: { ...profile.user, id: "must-not-leak", photoUrl: "must-not-leak" },
    credentials: [{ ...credential, documentStorageKey: "must-not-leak", reviewReason: "must-not-leak", specialty: "must-not-leak" }],
    reviewLogs: [{ ...log, actor: { email: "must-not-leak" }, credentialIds: ["must-not-leak"], metadata: "must-not-leak" }],
  }] }).items[0];
  assert.deepEqual(parsed, profile);
  assert.equal("phone" in parsed, false);
  assert.equal("id" in parsed.user, false);
  assert.equal("documentStorageKey" in parsed.credentials[0], false);
  assert.equal("actor" in parsed.reviewLogs[0], false);
});

test("profile pagination temporarily accepts profiles alias and merges by id", () => {
  assert.deepEqual(readAdminProfilePage({ profiles: [profile] }), { items: [profile], nextCursor: null });
  assert.deepEqual(mergeAdminProfilePages([profile], [{ ...profile, displayName: "Atualizado" }, { ...profile, id: "10000000-0000-4000-8000-000000000002" }]), [
    { ...profile, displayName: "Atualizado" },
    { ...profile, id: "10000000-0000-4000-8000-000000000002" },
  ]);
});

test("profile parser rejects invalid UUIDs, enums, dates, cursors and oversized nested arrays", () => {
  assert.throws(() => readAdminProfilePage({ items: [{ ...profile, id: "invalid" }] }), /Resposta inválida/);
  assert.throws(() => readAdminProfilePage({ items: [{ ...profile, primaryProfession: "UNKNOWN" }] }), /Resposta inválida/);
  assert.throws(() => readAdminProfilePage({ items: [{ ...profile, credentials: [{ ...credential, status: "UNKNOWN" }] }] }), /Resposta inválida/);
  assert.throws(() => readAdminProfilePage({ items: [{ ...profile, updatedAt: "not-a-date" }] }), /Resposta inválida/);
  assert.throws(() => readAdminProfilePage({ items: [profile], nextCursor: 42 }), /Resposta inválida/);
  assert.throws(() => readAdminProfilePage({ items: [{ ...profile, credentials: Array.from({ length: 51 }, () => credential) }] }), /Resposta inválida/);
  assert.throws(() => readAdminProfilePage({ items: [{ ...profile, reviewLogs: Array.from({ length: 51 }, () => log) }] }), /Resposta inválida/);
});
