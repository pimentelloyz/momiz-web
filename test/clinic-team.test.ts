import assert from "node:assert/strict";
import test from "node:test";
import {
  readClinicInvitationAcceptResponse,
  readClinicInvitationCancelResponse,
  readClinicInvitationCreateResponse,
  readClinicListResponse,
  readClinicMemberResponse,
  readClinicResponse,
  readClinicTeamResponse,
} from "../lib/professional/clinic-team.ts";

const clinic = { id: "10000000-0000-4000-8000-000000000001", name: "Clínica Aurora", seatLimit: 5, status: "ACTIVE" };
const summary = { id: "20000000-0000-4000-8000-000000000001", role: "OWNER", status: "ACTIVE" };
const member = { ...summary, professionalProfile: { id: "30000000-0000-4000-8000-000000000001", displayName: "Dra. Ana", primaryProfession: "OBSTETRICIAN", user: { name: "Ana" } } };
const invitation = { id: "40000000-0000-4000-8000-000000000001", recipientEmail: "invite@example.test", role: "MEMBER", status: "PENDING", expiresAt: "2026-11-20T12:00:00.000Z", createdAt: "2026-11-13T12:00:00.000Z" };
const audit = { id: "50000000-0000-4000-8000-000000000001", action: "CLINIC_CREATED", createdAt: "2026-11-13T12:00:00.000Z", actor: { name: "Ana" } };

test("clinic parsers accept the seven closed operation responses", () => {
  assert.deepEqual(readClinicListResponse({ clinics: [{ ...clinic, memberships: [summary], _count: { memberships: 1, invitations: 1 } }] }).clinics[0].id, clinic.id);
  assert.deepEqual(readClinicTeamResponse({ clinic, membership: summary, members: [member], invitations: [invitation], auditLogs: [audit] }).members, [member]);
  assert.deepEqual(readClinicResponse({ clinic }), { clinic });
  assert.deepEqual(readClinicInvitationAcceptResponse({ clinic, membership: member }), { clinic, membership: member });
  assert.equal(readClinicInvitationCreateResponse({ invitation, token: "a".repeat(43) }).token.length, 43);
  assert.deepEqual(readClinicInvitationCancelResponse({ invitation: { id: invitation.id, role: "MEMBER", status: "CANCELED", canceledAt: "2026-11-13T13:00:00.000Z" } }).invitation.status, "CANCELED");
  assert.deepEqual(readClinicMemberResponse({ membership: member }), { membership: member });
});

test("clinic parsers reject extras and forbidden identity or metadata at every sensitive level", () => {
  assert.throws(() => readClinicListResponse({ clinics: [], metadata: {} }), /resposta de clínica inválida/);
  assert.throws(() => readClinicTeamResponse({ clinic, membership: summary, members: [{ ...member, professionalProfile: { ...member.professionalProfile, user: { name: "Ana", photoUrl: "https://example.test/photo" } } }], invitations: [], auditLogs: [] }), /inválida/);
  assert.throws(() => readClinicTeamResponse({ clinic, membership: summary, members: [member], invitations: [], auditLogs: [{ ...audit, metadata: { secret: true } }] }), /inválida/);
  assert.throws(() => readClinicMemberResponse({ membership: { ...member, email: "must-not-leak@example.test" } }), /inválida/);
  assert.throws(() => readClinicInvitationAcceptResponse({ clinic, membership: member, token: "must-not-leak" }), /inválida/);
  assert.throws(() => readClinicInvitationCancelResponse({ invitation: { id: invitation.id, role: "MEMBER", status: "CANCELED", canceledAt: null, recipientEmail: invitation.recipientEmail } }), /inválida/);
});

test("clinic parsers reject malformed identifiers, enums, dates, counts and tokens", () => {
  assert.throws(() => readClinicResponse({ clinic: { ...clinic, id: "invalid" } }), /inválida/);
  assert.throws(() => readClinicResponse({ clinic: { ...clinic, status: "UNKNOWN" } }), /inválida/);
  assert.throws(() => readClinicTeamResponse({ clinic, membership: summary, members: [{ ...member, professionalProfile: { ...member.professionalProfile, primaryProfession: "UNKNOWN" } }], invitations: [], auditLogs: [] }), /inválida/);
  assert.throws(() => readClinicTeamResponse({ clinic, membership: summary, members: [member], invitations: [{ ...invitation, expiresAt: "invalid" }], auditLogs: [] }), /inválida/);
  assert.throws(() => readClinicListResponse({ clinics: [{ ...clinic, memberships: [summary], _count: { memberships: -1, invitations: 0 } }] }), /inválida/);
  assert.throws(() => readClinicInvitationCreateResponse({ invitation, token: "unsafe token" }), /inválida/);
});

test("clinic collection limits fail closed instead of truncating", () => {
  assert.throws(() => readClinicListResponse({ clinics: Array.from({ length: 51 }, () => ({ ...clinic, memberships: [summary], _count: { memberships: 1, invitations: 0 } })) }), /inválida/);
  assert.throws(() => readClinicTeamResponse({ clinic, membership: summary, members: Array.from({ length: 101 }, () => member), invitations: [], auditLogs: [] }), /inválida/);
  assert.throws(() => readClinicTeamResponse({ clinic, membership: summary, members: [], invitations: Array.from({ length: 101 }, () => invitation), auditLogs: [] }), /inválida/);
  assert.throws(() => readClinicTeamResponse({ clinic, membership: summary, members: [], invitations: [], auditLogs: Array.from({ length: 51 }, () => audit) }), /inválida/);
});
