import assert from "node:assert/strict";
import test from "node:test";
import {
  activeAgendaFilterCount,
  agendaFilterQuery,
  emptyAgendaFilter,
  filterAgenda,
} from "../lib/professional/agenda.ts";
import { isAllowedProfessionalCarePath } from "../lib/professional/care-proxy-policy.ts";

test("professional proxy exposes only the portal read endpoints", () => {
  assert.equal(isAllowedProfessionalCarePath("professional/profile"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/patients"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/agenda"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/agenda/export.ics"), true);
  assert.equal(isAllowedProfessionalCarePath("team"), false);
  assert.equal(isAllowedProfessionalCarePath("professional/profile/submit"), false);
  assert.equal(isAllowedProfessionalCarePath("../admin/users"), false);
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
