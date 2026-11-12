import assert from "node:assert/strict";
import test from "node:test";
import {
  areAdminCareMetricsEmpty,
  isCurrentAdminCareMetricsRequest,
  readAdminCareMetrics,
} from "../app/admin/ui/admin-care-metrics.ts";

const apiMetrics = {
  activeRelationships: 4,
  pausedRelationships: 1,
  expiringRelationships: 2,
  blockedCommunications: 3,
  openReports: 5,
  pendingProfiles: 6,
  expiringCredentials: 7,
  expiredProfiles: 8,
  auditEventsLast24h: 9,
  deniedAuditEventsLast24h: 10,
};

test("care metrics validates and maps the ten contract counters", () => {
  assert.deepEqual(readAdminCareMetrics({ metrics: apiMetrics }), {
    active: 4,
    paused: 1,
    expiring: 2,
    blocked: 3,
    openReports: 5,
    pendingProfiles: 6,
    expiringCredentials: 7,
    expiredProfiles: 8,
    auditEvents: 9,
    deniedAuditEvents: 10,
  });
});

test("care metrics discards legacy envelope and metric extras", () => {
  const parsed = readAdminCareMetrics({
    metrics: { ...apiMetrics, generatedAt: "must-not-survive", patientName: "must-not-survive" },
    generatedAt: "must-not-survive",
  });
  assert.equal("generatedAt" in parsed, false);
  assert.equal("patientName" in parsed, false);
  assert.equal(Object.keys(parsed).length, 10);
});

test("care metrics rejects missing, negative, fractional and unsafe counters", () => {
  const missing: Partial<typeof apiMetrics> = { ...apiMetrics };
  delete missing.activeRelationships;
  assert.throws(() => readAdminCareMetrics({ metrics: missing }), /Resposta inválida/);
  assert.throws(() => readAdminCareMetrics({ metrics: { ...apiMetrics, activeRelationships: -1 } }), /Resposta inválida/);
  assert.throws(() => readAdminCareMetrics({ metrics: { ...apiMetrics, activeRelationships: 1.5 } }), /Resposta inválida/);
  assert.throws(() => readAdminCareMetrics({ metrics: { ...apiMetrics, activeRelationships: Number.MAX_SAFE_INTEGER + 1 } }), /Resposta inválida/);
});

test("zero metrics preserve the explicit empty state", () => {
  const zero = readAdminCareMetrics({ metrics: Object.fromEntries(Object.keys(apiMetrics).map((key) => [key, 0])) });
  assert.equal(areAdminCareMetricsEmpty(zero), true);
  assert.equal(areAdminCareMetricsEmpty({ ...zero, openReports: 1 }), false);
});

test("care metrics ignores stale request versions", () => {
  assert.equal(isCurrentAdminCareMetricsRequest(3, 3), true);
  assert.equal(isCurrentAdminCareMetricsRequest(2, 3), false);
});
