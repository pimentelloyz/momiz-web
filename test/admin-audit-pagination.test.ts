import assert from "node:assert/strict";
import test from "node:test";
import { isUuidFilter, mergeAdminAuditPages, readAdminAuditPage } from "../app/admin/ui/admin-audit-pagination.ts";

const item = {
  id: "audit-1",
  patientUserId: "10000000-0000-4000-8000-000000000001",
  actorUserId: null,
  relationshipId: null,
  pregnancyId: null,
  profileId: null,
  resource: "CARE_PROFILE",
  action: "READ",
  outcome: "ALLOWED",
  requestId: "req-audit",
  createdAt: "2026-11-11T12:00:00.000Z",
};

test("audit pagination prefers items and strips fields outside the minimized contract", () => {
  const page = readAdminAuditPage({
    items: [{ ...item, patientName: "must-not-leak", actorEmail: "must-not-leak", metadata: { secret: true } }],
    auditLogs: [{ ...item, id: "legacy" }],
    nextCursor: "opaque-audit-cursor",
  });
  assert.deepEqual(page.items, [item]);
  assert.equal(page.nextCursor, "opaque-audit-cursor");
  assert.equal("patientName" in page.items[0], false);
  assert.equal("metadata" in page.items[0], false);
});

test("audit pagination temporarily accepts auditLogs and validates nullable fields", () => {
  assert.deepEqual(readAdminAuditPage({ auditLogs: [item] }), { items: [item], nextCursor: null });
  assert.throws(() => readAdminAuditPage({ items: [{ ...item, actorUserId: 42 }] }), /Resposta inválida/);
});

test("audit pages merge by id without duplicates", () => {
  assert.deepEqual(mergeAdminAuditPages([item], [{ ...item, outcome: "DENIED" }, { ...item, id: "audit-2" }]), [
    { ...item, outcome: "DENIED" },
    { ...item, id: "audit-2" },
  ]);
});

test("audit patient filter accepts UUIDs only", () => {
  assert.equal(isUuidFilter("10000000-0000-4000-8000-000000000001"), true);
  assert.equal(isUuidFilter("not-a-uuid"), false);
  assert.equal(isUuidFilter("10000000-0000-4000-0000-000000000001"), false);
});
