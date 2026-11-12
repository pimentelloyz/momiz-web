import assert from "node:assert/strict";
import test from "node:test";
import { mergeAdminRelationshipPages, readAdminRelationshipPage } from "../app/admin/ui/admin-relationship-pagination.ts";

const item = {
  id: "relationship-1",
  patientUserId: "10000000-0000-4000-8000-000000000001",
  professionalProfileId: "20000000-0000-4000-8000-000000000001",
  profession: "DOULA",
  status: "ACTIVE" as const,
  startsAt: "2026-11-01T12:00:00.000Z",
  expiresAt: null,
  pausedAt: null,
  revokedAt: null,
  communicationBlockedAt: null,
  createdAt: "2026-11-01T12:00:00.000Z",
  updatedAt: "2026-11-12T12:00:00.000Z",
  scopes: [{ capability: "care.messages.read" }],
};

test("relationship pagination prefers items and projects the exact allowlist", () => {
  const page = readAdminRelationshipPage({
    items: [{ ...item, patientName: "must-not-leak", professionalEmail: "must-not-leak", credentials: ["secret"], scopes: [{ capability: "care.messages.read", reason: "extra" }] }],
    relationships: [{ ...item, id: "legacy" }],
    nextCursor: "opaque-relationship-cursor",
  });
  assert.deepEqual(page.items, [item]);
  assert.equal(page.nextCursor, "opaque-relationship-cursor");
  assert.equal("patientName" in page.items[0], false);
  assert.equal("credentials" in page.items[0], false);
  assert.deepEqual(page.items[0].scopes, [{ capability: "care.messages.read" }]);
});

test("relationship pagination temporarily accepts the legacy alias", () => {
  assert.deepEqual(readAdminRelationshipPage({ relationships: [item] }), { items: [item], nextCursor: null });
});

test("relationship pages merge by id without duplicates", () => {
  const updated = { ...item, status: "PAUSED" as const, pausedAt: "2026-11-12T13:00:00.000Z" };
  assert.deepEqual(mergeAdminRelationshipPages([item], [updated, { ...item, id: "relationship-2" }]), [
    updated,
    { ...item, id: "relationship-2" },
  ]);
});

test("relationship pagination rejects unknown statuses and malformed scopes", () => {
  assert.throws(() => readAdminRelationshipPage({ items: [{ ...item, status: "UNKNOWN" }] }), /Resposta inválida/);
  assert.throws(() => readAdminRelationshipPage({ items: [{ ...item, scopes: [{ capability: 42 }] }] }), /Resposta inválida/);
});
