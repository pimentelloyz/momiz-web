import assert from "node:assert/strict";
import test from "node:test";
import { AdminApiError } from "../app/admin/ui/admin-api-client.ts";
import {
  isCurrentPilotReadinessRequest,
  isPilotGateVersionConflict,
  pilotGatePatch,
  readPilotReadiness,
  updatePilotGateWithReconciliation,
} from "../app/admin/ui/admin-pilot-readiness.ts";

const gate = {
  id: "gate-1",
  key: "SECURITY_REVIEW",
  label: "Revisão de segurança",
  description: "Validar controles do piloto.",
  status: "PENDING",
  decidedAt: null,
  updatedAt: "2026-11-12T12:00:00.000Z",
};

test("pilot readiness projects only the minimized response", () => {
  const readiness = readPilotReadiness({ readiness: {
    ready: false,
    advisoryOnly: true,
    rolloutAutomaticallyEnabled: false,
    approvedCount: 0,
    requiredCount: 1,
    gates: [{ ...gate, reason: "must-not-leak", evidenceReference: "must-not-leak", decidedBy: { email: "must-not-leak" }, auditLogs: [{ actor: "must-not-leak" }] }],
  } });
  assert.deepEqual(readiness.gates, [gate]);
  assert.equal("reason" in readiness.gates[0], false);
  assert.equal("auditLogs" in readiness.gates[0], false);
});

test("pilot readiness accepts an unpersisted gate with null identifiers and version", () => {
  const readiness = readPilotReadiness({ readiness: {
    ready: false,
    advisoryOnly: true,
    rolloutAutomaticallyEnabled: false,
    approvedCount: 0,
    requiredCount: 1,
    gates: [{ ...gate, id: null, updatedAt: null }],
  } });
  assert.equal(readiness.gates[0]?.id, null);
  assert.equal(readiness.gates[0]?.updatedAt, null);
});

test("pilot gate patch uses optimistic version when available and keeps legacy compatibility", () => {
  assert.deepEqual(pilotGatePatch("APPROVED", "  justificativa válida  ", " ticket-1 ", gate.updatedAt), {
    status: "APPROVED",
    reason: "justificativa válida",
    evidenceReference: "ticket-1",
    expectedUpdatedAt: gate.updatedAt,
  });
  assert.deepEqual(pilotGatePatch("BLOCKED", "risco identificado", "", null), {
    status: "BLOCKED",
    reason: "risco identificado",
    evidenceReference: null,
  });
});

test("pilot gate conflict is identified without treating other 409 errors as version conflict", () => {
  const conflict = new AdminApiError({ message: "Conflito.", code: "PROFESSIONAL_PILOT_GATE_VERSION_CONFLICT", requestId: "req-conflict", status: 409 });
  const other = new AdminApiError({ message: "Outro conflito.", code: "OTHER_CONFLICT", requestId: "req-other", status: 409 });
  assert.equal(isPilotGateVersionConflict(conflict), true);
  assert.equal(isPilotGateVersionConflict(other), false);
});

test("pilot gate conflict reloads authoritative state and still rejects without false success", async () => {
  const conflict = new AdminApiError({ message: "Conflito.", code: "PROFESSIONAL_PILOT_GATE_VERSION_CONFLICT", requestId: "req-conflict", status: 409 });
  let reloads = 0;
  await assert.rejects(
    updatePilotGateWithReconciliation(async () => { throw conflict; }, async () => { reloads += 1; }),
    (error) => error === conflict,
  );
  assert.equal(reloads, 1);
});

test("pilot readiness ignores stale request versions", () => {
  assert.equal(isCurrentPilotReadinessRequest(4, 4), true);
  assert.equal(isCurrentPilotReadinessRequest(3, 4), false);
});
