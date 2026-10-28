export const appointmentStatuses = ["PROPOSED", "SCHEDULED", "CONFIRMED", "RESCHEDULE_REQUESTED", "CANCELED", "COMPLETED", "NO_SHOW"] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number] | "UNKNOWN";
export const appointmentModalities = ["IN_PERSON", "REMOTE", "HYBRID"] as const;
export type AppointmentModality = (typeof appointmentModalities)[number] | "UNKNOWN";

export type CareAppointment = {
  id: string; pregnancyId: string; patientProfileId: string; responsibleProfessionalProfileId: string;
  relationshipId: string; startsAt: string; endAt: string; timezone: string; type: string;
  modality: AppointmentModality; title: string; location: string | null; meetingUrl: string | null;
  status: AppointmentStatus; version: number; proposedByProfileId: string | null;
  pendingStartsAt: string | null; pendingEndAt: string | null; pendingTimezone: string | null;
  allowedActions: string[];
};
export type AppointmentPage = { items: CareAppointment[]; nextCursor: string | null; requestId: string };
export type AppointmentEvent = { id: string; appointmentVersion: number; action: string; fromStatus: AppointmentStatus; toStatus: AppointmentStatus; actorRole: string; createdAt: string };
export type AppointmentEventsPage = { items: AppointmentEvent[]; nextCursor: string | null; requestId: string };

function object(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value !== null ? value as Record<string, unknown> : null; }
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function nullableText(value: unknown) { return typeof value === "string" ? value : null; }
function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | "UNKNOWN" { return typeof value === "string" && values.includes(value) ? value as T[number] : "UNKNOWN"; }

export function parseAppointment(raw: unknown): CareAppointment {
  const root = object(raw);
  if (!root || !text(root.id) || !text(root.pregnancyId) || !text(root.startsAt) || !text(root.endAt)) throw new Error("APPOINTMENT_RESPONSE_INVALID");
  return {
    id: text(root.id), pregnancyId: text(root.pregnancyId), patientProfileId: text(root.patientProfileId),
    responsibleProfessionalProfileId: text(root.responsibleProfessionalProfileId), relationshipId: text(root.relationshipId),
    startsAt: text(root.startsAt), endAt: text(root.endAt), timezone: text(root.timezone), type: text(root.type),
    modality: enumValue(root.modality, appointmentModalities), title: text(root.title) || "Consulta",
    location: nullableText(root.location), meetingUrl: nullableText(root.meetingUrl), status: enumValue(root.status, appointmentStatuses),
    version: Number.isInteger(root.version) ? Number(root.version) : 0, proposedByProfileId: nullableText(root.proposedByProfileId),
    pendingStartsAt: nullableText(root.pendingStartsAt), pendingEndAt: nullableText(root.pendingEndAt), pendingTimezone: nullableText(root.pendingTimezone),
    allowedActions: Array.isArray(root.allowedActions) ? root.allowedActions.filter((item): item is string => typeof item === "string").slice(0, 20) : [],
  };
}

export function parseAppointmentMutation(value: unknown) {
  const root = object(value); if (!root) throw new Error("APPOINTMENT_RESPONSE_INVALID");
  return { appointment: parseAppointment(root.appointment || root), requestId: text(root.requestId) };
}

export function parseAppointmentsPage(value: unknown): AppointmentPage {
  const root = object(value); if (!root || !Array.isArray(root.items)) throw new Error("APPOINTMENT_RESPONSE_INVALID");
  return { items: root.items.map(parseAppointment), nextCursor: nullableText(root.nextCursor), requestId: text(root.requestId) };
}

export function parseAppointmentEvents(value: unknown): AppointmentEventsPage {
  const root = object(value); if (!root || !Array.isArray(root.items)) throw new Error("APPOINTMENT_EVENTS_INVALID");
  return { nextCursor: nullableText(root.nextCursor), requestId: text(root.requestId), items: root.items.flatMap((raw) => {
    const item = object(raw); if (!item || !text(item.id)) return [];
    return [{ id: text(item.id), appointmentVersion: Number.isInteger(item.appointmentVersion) ? Number(item.appointmentVersion) : 0,
      action: text(item.action), fromStatus: enumValue(item.fromStatus, appointmentStatuses), toStatus: enumValue(item.toStatus, appointmentStatuses),
      actorRole: text(item.actorRole), createdAt: text(item.createdAt) }];
  }) };
}

export function appendAppointments(current: CareAppointment[], incoming: CareAppointment[]) {
  const seen = new Set(current.map((item) => item.id)); return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

export function appointmentStatusLabel(value: AppointmentStatus) {
  return ({ PROPOSED: "Proposta", SCHEDULED: "Agendado", CONFIRMED: "Confirmado", RESCHEDULE_REQUESTED: "Reagendamento solicitado", CANCELED: "Cancelado", COMPLETED: "Concluído", NO_SHOW: "Paciente ausente", UNKNOWN: "Indisponível" } as const)[value];
}

export function appointmentActionAllowed(item: CareAppointment, ...actions: string[]) { return actions.some((action) => item.allowedActions.includes(action)); }

export function buildProfessionalAppointmentProposal(input: {
  relationshipId: string; responsibleProfessionalProfileId: string; startsAt: string; endAt: string;
  timezone: string; modality: Exclude<AppointmentModality, "UNKNOWN">; title: string; location?: string; meetingUrl?: string;
}) {
  return { ...input, type: "CONSULTATION" as const };
}

export function localDateTimeWithOffset(value: string, timezone: string, browserTimezone: string) {
  if (!value || timezone !== browserTimezone) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value); if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
  if ([date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()].some((part, index) => part !== Number(match[index + 1]))) return null;
  const ambiguous = [30, 60, 90, 120].some((minutes) => {
    const alternate = new Date(date.getTime() + minutes * 60_000);
    return alternate.getFullYear() === Number(match[1]) && alternate.getMonth() + 1 === Number(match[2]) && alternate.getDate() === Number(match[3]) && alternate.getHours() === Number(match[4]) && alternate.getMinutes() === Number(match[5]);
  });
  if (ambiguous) return null;
  const offset = -date.getTimezoneOffset(); const sign = offset >= 0 ? "+" : "-"; const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0"); const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  return `${value}:00${sign}${hours}:${minutes}`;
}
