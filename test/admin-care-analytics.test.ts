import assert from "node:assert/strict";
import test from "node:test";
import {
  analyticsGroupKeys,
  isAnalyticsDateRangeValid,
  isCurrentCareAnalyticsRequest,
  readCareAnalyticsReport,
} from "../app/admin/ui/admin-care-analytics.ts";

function payload() {
  return {
    report: {
      generatedAt: "2026-11-12T12:00:00.000Z",
      period: { from: "2026-11-01T00:00:00.000Z", to: "2026-11-12T23:59:59.999Z" },
      privacy: { method: "MINIMUM_COHORT_SUPPRESSION", minimumCohortSize: 5, suppressedValue: null, containsDirectIdentifiers: false },
      totals: {
        professionalProfilesCreated: { value: 5, suppressed: false },
        relationshipsCreated: { value: null, suppressed: true },
        uniquePatientsWithNewRelationship: { value: 6, suppressed: false },
        appointmentsInPeriod: { value: 7, suppressed: false },
        accessEvents: { value: 8, suppressed: false },
        careMessagesCreated: { value: 9, suppressed: false },
      },
      groups: {
        profilesByProfession: [{ key: "DOULA", count: { value: 5, suppressed: false } }],
        profilesByStatus: [],
        relationshipsByProfession: [],
        relationshipsByStatus: [],
        appointmentsByType: [],
        appointmentsByStatus: [],
        accessByOutcome: [],
        accessByResource: [],
      },
    },
  };
}

test("care analytics accepts visible and suppressed totals and empty suppressed groups", () => {
  const report = readCareAnalyticsReport(payload());
  assert.deepEqual(report.totals.professionalProfilesCreated, { value: 5, suppressed: false });
  assert.deepEqual(report.totals.relationshipsCreated, { value: null, suppressed: true });
  assert.deepEqual(report.groups.profilesByProfession, [{ key: "DOULA", count: { value: 5, suppressed: false } }]);
  for (const key of analyticsGroupKeys.filter((key) => key !== "profilesByProfession")) assert.deepEqual(report.groups[key], []);
});

test("care analytics rejects a missing contractual dimension", () => {
  const source = payload();
  delete (source.report.groups as Partial<typeof source.report.groups>).accessByResource;
  assert.throws(() => readCareAnalyticsReport(source), /Resposta inválida/);
});

test("care analytics discards envelope, total, group and enum extras", () => {
  const source = payload();
  Object.assign(source.report, { patientName: "must-not-leak" });
  Object.assign(source.report.totals, { unknownTotal: { value: 999, suppressed: false } });
  Object.assign(source.report.groups, {
    unknownGroup: [{ key: "SECRET", count: { value: 999, suppressed: false } }],
    profilesByProfession: [
      { key: "DOULA", count: { value: 5, suppressed: false }, patientEmail: "must-not-leak" },
      { key: "UNKNOWN_PROFESSION", count: { value: 999, suppressed: false } },
    ],
  });
  const report = readCareAnalyticsReport(source);
  assert.equal("patientName" in report, false);
  assert.equal("unknownTotal" in report.totals, false);
  assert.equal("unknownGroup" in report.groups, false);
  assert.deepEqual(report.groups.profilesByProfession, [{ key: "DOULA", count: { value: 5, suppressed: false } }]);
});

test("care analytics rejects invalid privacy, period and counts", () => {
  const privacy = payload();
  privacy.report.privacy.minimumCohortSize = 4;
  assert.throws(() => readCareAnalyticsReport(privacy), /Resposta inválida/);

  const period = payload();
  period.report.period.to = "2025-01-01T00:00:00.000Z";
  assert.throws(() => readCareAnalyticsReport(period), /Resposta inválida/);

  const total = payload();
  total.report.totals.professionalProfilesCreated = { value: 4, suppressed: false };
  assert.throws(() => readCareAnalyticsReport(total), /Resposta inválida/);

  const group = payload();
  group.report.groups.profilesByProfession[0].count.value = 1.5;
  assert.throws(() => readCareAnalyticsReport(group), /Resposta inválida/);
});

test("care analytics enforces a maximum inclusive period of 366 days", () => {
  assert.equal(isAnalyticsDateRangeValid("2026-01-01", "2026-12-31"), true);
  assert.equal(isAnalyticsDateRangeValid("2024-01-01", "2025-01-01"), false);
  assert.equal(isAnalyticsDateRangeValid("2026-02-01", "2026-01-01"), false);
});

test("care analytics ignores stale responses", () => {
  assert.equal(isCurrentCareAnalyticsRequest(7, 7), true);
  assert.equal(isCurrentCareAnalyticsRequest(6, 7), false);
});
