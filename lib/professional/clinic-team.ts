import { professionalProfessions, type ProfessionalProfession } from "./professional-profile.ts";

export const clinicRoles = ["OWNER", "ADMIN", "MEMBER"] as const;
export const clinicMemberStatuses = ["ACTIVE", "SUSPENDED"] as const;
export const clinicStatuses = ["ACTIVE", "SUSPENDED", "ARCHIVED"] as const;
export const clinicInvitationStatuses = ["PENDING", "ACCEPTED", "CANCELED", "EXPIRED"] as const;
export const clinicAuditActions = ["CLINIC_CREATED", "INVITATION_CREATED", "INVITATION_ACCEPTED", "INVITATION_CANCELED", "INVITATION_EXPIRED", "MEMBER_SUSPENDED", "MEMBER_REACTIVATED", "OWNER_TRANSFERRED"] as const;

export type ClinicRole = typeof clinicRoles[number];
export type ClinicMemberStatus = typeof clinicMemberStatuses[number];
export type ClinicStatus = typeof clinicStatuses[number];
export type ClinicInvitationStatus = typeof clinicInvitationStatuses[number];
export type ClinicAuditAction = typeof clinicAuditActions[number];
export type Clinic = { id: string; name: string; seatLimit: number; status: ClinicStatus };
export type ClinicMembership = { id: string; role: ClinicRole; status: ClinicMemberStatus };
export type ClinicListItem = Clinic & { memberships: ClinicMembership[]; _count: { memberships: number; invitations: number } };
export type ClinicMember = ClinicMembership & { professionalProfile: { id: string; displayName: string; primaryProfession: ProfessionalProfession; user: { name: string | null } } };
export type ClinicInvitation = { id: string; recipientEmail: string; role: "ADMIN" | "MEMBER"; status: ClinicInvitationStatus; expiresAt: string; createdAt: string };
export type ClinicAudit = { id: string; action: ClinicAuditAction; createdAt: string; actor: { name: string | null } | null };
export type ClinicTeam = { clinic: Clinic; membership: ClinicMembership; members: ClinicMember[]; invitations: ClinicInvitation[]; auditLogs: ClinicAudit[] };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const token = /^[A-Za-z0-9_-]{32,128}$/;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalid = (): never => { throw new Error("A API retornou uma resposta de clínica inválida."); };
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : invalid();
function exact(value: Record<string, unknown>, keys: string[]) { if (Object.keys(value).length !== keys.length || keys.some((key) => !(key in value))) invalid(); }
function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] { return typeof value === "string" && values.includes(value) ? value as T[number] : invalid(); }
function id(value: unknown) { return typeof value === "string" && uuid.test(value) ? value : invalid(); }
function text(value: unknown) { return typeof value === "string" ? value : invalid(); }
function date(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? value : invalid(); }
function count(value: unknown, minimum = 0) { return Number.isSafeInteger(value) && Number(value) >= minimum ? Number(value) : invalid(); }
function nullableText(value: unknown) { return value === null ? null : text(value); }
function nullableDate(value: unknown) { return value === null ? null : date(value); }
function array(value: unknown, limit: number) { return Array.isArray(value) && value.length <= limit ? value : invalid(); }

function readClinic(value: unknown): Clinic { const v = record(value); exact(v, ["id", "name", "seatLimit", "status"]); const name = text(v.name); if (name.length < 2 || name.length > 160) invalid(); return { id: id(v.id), name, seatLimit: count(v.seatLimit, 1), status: enumValue(v.status, clinicStatuses) }; }
function readMembership(value: unknown): ClinicMembership { const v = record(value); exact(v, ["id", "role", "status"]); return { id: id(v.id), role: enumValue(v.role, clinicRoles), status: enumValue(v.status, clinicMemberStatuses) }; }
function readMember(value: unknown): ClinicMember { const v = record(value); exact(v, ["id", "role", "status", "professionalProfile"]); const p = record(v.professionalProfile); exact(p, ["id", "displayName", "primaryProfession", "user"]); const user = record(p.user); exact(user, ["name"]); return { ...readMembership({ id: v.id, role: v.role, status: v.status }), professionalProfile: { id: id(p.id), displayName: text(p.displayName), primaryProfession: enumValue(p.primaryProfession, professionalProfessions), user: { name: nullableText(user.name) } } }; }
function readInvitation(value: unknown): ClinicInvitation { const v = record(value); exact(v, ["id", "recipientEmail", "role", "status", "expiresAt", "createdAt"]); const recipientEmail = text(v.recipientEmail); if (!email.test(recipientEmail) || recipientEmail.length > 254) invalid(); return { id: id(v.id), recipientEmail, role: enumValue(v.role, ["ADMIN", "MEMBER"] as const), status: enumValue(v.status, clinicInvitationStatuses), expiresAt: date(v.expiresAt), createdAt: date(v.createdAt) }; }
function readAudit(value: unknown): ClinicAudit { const v = record(value); exact(v, ["id", "action", "createdAt", "actor"]); let actor: ClinicAudit["actor"] = null; if (v.actor !== null) { const a = record(v.actor); exact(a, ["name"]); actor = { name: nullableText(a.name) }; } return { id: id(v.id), action: enumValue(v.action, clinicAuditActions), createdAt: date(v.createdAt), actor }; }

export function readClinicListResponse(value: unknown) { const v = record(value); exact(v, ["clinics"]); return { clinics: array(v.clinics, 50).map((item): ClinicListItem => { const row = record(item); exact(row, ["id", "name", "seatLimit", "status", "memberships", "_count"]); const counts = record(row._count); exact(counts, ["memberships", "invitations"]); return { ...readClinic({ id: row.id, name: row.name, seatLimit: row.seatLimit, status: row.status }), memberships: array(row.memberships, 1).map(readMembership), _count: { memberships: count(counts.memberships), invitations: count(counts.invitations) } }; }) }; }
export function readClinicResponse(value: unknown) { const v = record(value); exact(v, ["clinic"]); return { clinic: readClinic(v.clinic) }; }
export function readClinicTeamResponse(value: unknown): ClinicTeam { const v = record(value); exact(v, ["clinic", "membership", "members", "invitations", "auditLogs"]); return { clinic: readClinic(v.clinic), membership: readMembership(v.membership), members: array(v.members, 100).map(readMember), invitations: array(v.invitations, 100).map(readInvitation), auditLogs: array(v.auditLogs, 50).map(readAudit) }; }
export function readClinicInvitationCreateResponse(value: unknown) { const v = record(value); exact(v, ["invitation", "token"]); return { invitation: readInvitation(v.invitation), token: typeof v.token === "string" && token.test(v.token) ? v.token : invalid() }; }
export function readClinicInvitationAcceptResponse(value: unknown) { const v = record(value); exact(v, ["clinic", "membership"]); return { clinic: readClinic(v.clinic), membership: readMember(v.membership) }; }
export function readClinicInvitationCancelResponse(value: unknown) { const v = record(value); exact(v, ["invitation"]); const invitation = record(v.invitation); exact(invitation, ["id", "role", "status", "canceledAt"]); return { invitation: { id: id(invitation.id), role: enumValue(invitation.role, ["ADMIN", "MEMBER"] as const), status: enumValue(invitation.status, clinicInvitationStatuses), canceledAt: nullableDate(invitation.canceledAt) } }; }
export function readClinicMemberResponse(value: unknown) { const v = record(value); exact(v, ["membership"]); return { membership: readMember(v.membership) }; }
