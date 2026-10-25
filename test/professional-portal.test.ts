import assert from "node:assert/strict";
import test from "node:test";
import {
  activeAgendaFilterCount,
  agendaFilterQuery,
  emptyAgendaFilter,
  filterAgenda,
} from "../lib/professional/agenda.ts";
import { isAllowedProfessionalCarePath } from "../lib/professional/care-proxy-policy.ts";

test("professional proxy exposes only explicit portal endpoints and methods", () => {
  assert.equal(isAllowedProfessionalCarePath("professional/profile"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/patients"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/agenda"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/agenda/export.ics"), true);
  assert.equal(isAllowedProfessionalCarePath("team"), false);
  assert.equal(isAllowedProfessionalCarePath("professional/profile/submit"), false);
  assert.equal(isAllowedProfessionalCarePath("../admin/users"), false);
  const clinicId = "1bb1ca83-a3aa-4775-9c09-539d208e3bb7";
  const memberId = "32cc3546-d372-4ec7-b633-a81672fbe43d";
  assert.equal(isAllowedProfessionalCarePath("professional/clinics", "GET"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/clinics", "POST"), true);
  assert.equal(isAllowedProfessionalCarePath(`professional/clinics/${clinicId}/members`, "GET"), true);
  assert.equal(isAllowedProfessionalCarePath(`professional/clinics/${clinicId}/members/${memberId}`, "PATCH"), true);
  assert.equal(isAllowedProfessionalCarePath(`professional/clinics/${clinicId}/members`, "DELETE"), false);
  assert.equal(isAllowedProfessionalCarePath("professional/clinics/not-an-id/members", "GET"), false);
});

test("agenda filtering and export query share the same criteria", () => {
  const filter = {
    ...emptyAgendaFilter,
    patientUserId: "patient-1",
    type: "CONSULTATION",
    status: "CONFIRMED",
    from: "2026-10-25",
    to: "2026-10-26",
  };
  const items = [
    {
      id: "included",
      type: "CONSULTATION",
      status: "CONFIRMED",
      scheduledAt: "2026-10-25T15:00:00.000Z",
      user: { id: "patient-1" },
    },
    {
      id: "other-patient",
      type: "CONSULTATION",
      status: "CONFIRMED",
      scheduledAt: "2026-10-25T15:00:00.000Z",
      user: { id: "patient-2" },
    },
  ];

  assert.deepEqual(filterAgenda(items, filter).map((item) => item.id), ["included"]);
  assert.equal(activeAgendaFilterCount(filter), 5);
  const query = new URLSearchParams(agendaFilterQuery(filter));
  assert.equal(query.get("patientUserId"), "patient-1");
  assert.equal(query.get("type"), "CONSULTATION");
  assert.equal(query.get("status"), "CONFIRMED");
  assert.equal(query.get("from"), new Date("2026-10-25T00:00:00").toISOString());
  assert.equal(query.get("to"), new Date("2026-10-26T23:59:59.999").toISOString());
});
