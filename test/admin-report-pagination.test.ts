import assert from "node:assert/strict";
import test from "node:test";
import {
  isCurrentAdminReportDetailRequest,
  mergeAdminReportPages,
  readAdminReportDetail,
  readAdminReportPage,
} from "../app/admin/ui/admin-report-pagination.ts";

const listItem = {
  id: "report-one",
  patientUserId: "patient-one",
  relationshipId: "relationship-one",
  messageId: "message-one",
  reporterUserId: "reporter-one",
  category: "HARASSMENT",
  details: "Descrição",
  status: "OPEN",
  resolvedAt: null,
  resolvedByUserId: null,
  resolutionNote: null,
  createdAt: "2026-11-18T12:00:00.000Z",
  updatedAt: "2026-11-18T12:00:00.000Z",
} as const;

test("report pagination parses the minimal list contract and preserves the opaque continuation", () => {
  const page = readAdminReportPage({
    items: [listItem],
    reports: [{ ...listItem, id: "legacy" }],
    nextCursor: "opaque-report-cursor",
  });
  assert.deepEqual(page, { items: [listItem], nextCursor: "opaque-report-cursor" });
  assert.equal("patient" in page.items[0], false);
});

test("report pagination temporarily accepts the legacy reports alias", () => {
  assert.deepEqual(readAdminReportPage({ reports: [listItem] }), {
    items: [listItem],
    nextCursor: null,
  });
});

test("report detail parser projects only the explicit contract without email", () => {
  const detail = readAdminReportDetail({
    report: {
      ...listItem,
      patient: { id: "patient-one", name: "Paciente" },
      reporter: { id: "reporter-one", name: "Denunciante" },
      resolvedBy: null,
      message: { id: "message-one", content: "Conteúdo", authorUserId: "author-one", createdAt: listItem.createdAt },
      relationship: {
        id: "relationship-one",
        status: "ACTIVE",
        communicationBlockedAt: null,
        professionalProfile: {
          id: "profile-one",
          displayName: "Profissional",
          primaryProfession: "DOULA",
          user: { id: "professional-one", name: "Pessoa profissional" },
        },
      },
    },
  });
  assert.deepEqual(detail.patient, { id: "patient-one", name: "Paciente" });
  assert.deepEqual(detail.reporter, { id: "reporter-one", name: "Denunciante" });
  assert.deepEqual(detail.relationship.professionalProfile.user, { id: "professional-one", name: "Pessoa profissional" });
  assert.equal("email" in detail.patient, false);
  assert.equal("email" in detail.relationship.professionalProfile.user, false);
});

test("report pages append without duplicate ids and refresh repeated entries", () => {
  assert.deepEqual(mergeAdminReportPages(
    [listItem, { ...listItem, id: "report-two" }],
    [{ ...listItem, id: "report-two", status: "RESOLVED", resolvedAt: listItem.updatedAt }, { ...listItem, id: "report-three" }],
  ), [
    listItem,
    { ...listItem, id: "report-two", status: "RESOLVED", resolvedAt: listItem.updatedAt },
    { ...listItem, id: "report-three" },
  ]);
});

test("report parsers reject malformed list and detail payloads", () => {
  assert.throws(() => readAdminReportPage(null), /Resposta inválida/);
  assert.throws(() => readAdminReportPage({ items: [], nextCursor: 42 }), /Resposta inválida/);
  assert.throws(() => readAdminReportPage({ items: [{ ...listItem, status: "UNKNOWN" }] }), /Resposta inválida/);
  assert.throws(() => readAdminReportPage({ items: [{ ...listItem, patient: { id: "patient-one", name: "Paciente" } }] }), /Resposta inválida/);
  assert.throws(() => readAdminReportDetail({ report: listItem }), /Resposta inválida/);
  assert.throws(() => readAdminReportDetail({
    report: {
      ...listItem,
      patient: { id: "patient-one", name: "Paciente", email: "patient@example.test" },
      reporter: { id: "reporter-one", name: "Denunciante" },
      resolvedBy: null,
      message: null,
      relationship: {
        id: "relationship-one",
        status: "ACTIVE",
        communicationBlockedAt: null,
        professionalProfile: {
          id: "profile-one",
          displayName: "Profissional",
          primaryProfession: "DOULA",
          user: { id: "professional-one", name: "Pessoa profissional" },
        },
      },
    },
  }), /Resposta inválida/);
});

test("report detail request identity rejects stale ids and versions", () => {
  assert.equal(isCurrentAdminReportDetailRequest("report-one", "report-one", 4, 4), true);
  assert.equal(isCurrentAdminReportDetailRequest("report-one", "report-two", 4, 4), false);
  assert.equal(isCurrentAdminReportDetailRequest("report-one", "report-one", 3, 4), false);
});
