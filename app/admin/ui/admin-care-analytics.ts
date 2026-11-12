export type AnalyticsMetric = { value: number; suppressed: false } | { value: null; suppressed: true };
export type AnalyticsGroupItem = { key: string; count: { value: number; suppressed: false } };

export const analyticsTotalKeys = [
  "professionalProfilesCreated", "relationshipsCreated", "uniquePatientsWithNewRelationship",
  "appointmentsInPeriod", "accessEvents", "careMessagesCreated",
] as const;

export const analyticsGroupKeys = [
  "profilesByProfession", "profilesByStatus", "relationshipsByProfession", "relationshipsByStatus",
  "appointmentsByType", "appointmentsByStatus", "accessByOutcome", "accessByResource",
] as const;

const professions = ["OBSTETRICIAN", "DOULA", "OBSTETRIC_NURSE", "PELVIC_PHYSIOTHERAPIST"];
const profileStatuses = ["DRAFT", "PENDING_VERIFICATION", "NEEDS_CORRECTION", "VERIFIED", "REJECTED", "SUSPENDED", "EXPIRED"];
const relationshipStatuses = ["PENDING_VERIFICATION", "ACTIVE", "READ_ONLY", "PAUSED", "REVOKED", "EXPIRED"];
const appointmentTypes = ["CONSULTATION", "EXAM", "VACCINE", "PHYSIOTHERAPY", "DOULA_MEETING", "OTHER"];
const appointmentStatuses = ["PROPOSED", "SCHEDULED", "CONFIRMED", "RESCHEDULE_REQUESTED", "COMPLETED", "CANCELED", "NO_SHOW"];
const outcomes = ["ALLOWED", "ALLOWED_ADMIN", "ALLOWED_OWNER", "ALLOWED_SELF", "DENIED"];
const resources = [
  "birth_plan", "care_communication_report", "care_context", "care_coordination_task", "care_document_request",
  "care_invitation", "care_message", "care_note", "care_relationship", "care_team_channel", "digital_document",
  "doula_support_item", "health_appointment", "labor_timeline", "physio_plan", "physio_session", "physio_workspace",
];

const groupAllowlists: Record<typeof analyticsGroupKeys[number], readonly string[]> = {
  profilesByProfession: professions,
  profilesByStatus: profileStatuses,
  relationshipsByProfession: professions,
  relationshipsByStatus: relationshipStatuses,
  appointmentsByType: appointmentTypes,
  appointmentsByStatus: appointmentStatuses,
  accessByOutcome: outcomes,
  accessByResource: resources,
};

export type CareAnalyticsReport = {
  generatedAt: string;
  period: { from: string; to: string };
  privacy: { method: "MINIMUM_COHORT_SUPPRESSION"; minimumCohortSize: 5; suppressedValue: null; containsDirectIdentifiers: false };
  totals: Record<typeof analyticsTotalKeys[number], AnalyticsMetric>;
  groups: Record<typeof analyticsGroupKeys[number], AnalyticsGroupItem[]>;
};

function iso(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
}

function visibleCount(value: unknown) {
  return Number.isSafeInteger(value) && (value as number) >= 5;
}

export function readCareAnalyticsReport(payload: unknown): CareAnalyticsReport {
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida do relatório agregado.");
  const report = (payload as { report?: unknown }).report;
  if (!report || typeof report !== "object") throw new Error("Resposta inválida do relatório agregado.");
  const value = report as Record<string, unknown>;
  const period = value.period as Record<string, unknown> | null;
  const privacy = value.privacy as Record<string, unknown> | null;
  const totalsSource = value.totals as Record<string, unknown> | null;
  const groupsSource = value.groups as Record<string, unknown> | null;
  if (
    !iso(value.generatedAt) || !period || !iso(period.from) || !iso(period.to) ||
    Date.parse(period.from as string) > Date.parse(period.to as string) ||
    Date.parse(period.to as string) - Date.parse(period.from as string) > 366 * 86_400_000
  ) {
    throw new Error("Resposta inválida do relatório agregado.");
  }
  if (!privacy || privacy.method !== "MINIMUM_COHORT_SUPPRESSION" || privacy.minimumCohortSize !== 5 || privacy.suppressedValue !== null || privacy.containsDirectIdentifiers !== false) {
    throw new Error("Resposta inválida do relatório agregado.");
  }
  if (!totalsSource || !groupsSource) throw new Error("Resposta inválida do relatório agregado.");

  const totals = {} as CareAnalyticsReport["totals"];
  for (const key of analyticsTotalKeys) {
    const metric = totalsSource[key];
    if (!metric || typeof metric !== "object") throw new Error("Resposta inválida do relatório agregado.");
    const count = metric as Record<string, unknown>;
    if (count.suppressed === true && count.value === null) totals[key] = { value: null, suppressed: true };
    else if (count.suppressed === false && visibleCount(count.value)) totals[key] = { value: count.value as number, suppressed: false };
    else throw new Error("Resposta inválida do relatório agregado.");
  }

  const groups = {} as CareAnalyticsReport["groups"];
  for (const key of analyticsGroupKeys) {
    const rawGroup = groupsSource[key];
    if (!Array.isArray(rawGroup)) throw new Error("Resposta inválida do relatório agregado.");
    groups[key] = rawGroup.flatMap((raw) => {
      if (!raw || typeof raw !== "object") throw new Error("Resposta inválida do relatório agregado.");
      const item = raw as Record<string, unknown>;
      if (typeof item.key !== "string" || !groupAllowlists[key].includes(item.key)) return [];
      if (!item.count || typeof item.count !== "object") throw new Error("Resposta inválida do relatório agregado.");
      const count = item.count as Record<string, unknown>;
      if (count.suppressed !== false || !visibleCount(count.value)) throw new Error("Resposta inválida do relatório agregado.");
      return [{ key: item.key, count: { value: count.value as number, suppressed: false as const } }];
    });
  }
  return {
    generatedAt: value.generatedAt as string,
    period: { from: period.from as string, to: period.to as string },
    privacy: { method: "MINIMUM_COHORT_SUPPRESSION", minimumCohortSize: 5, suppressedValue: null, containsDirectIdentifiers: false },
    totals,
    groups,
  };
}

export function isCurrentCareAnalyticsRequest(requestedVersion: number, currentVersion: number) {
  return requestedVersion === currentVersion;
}

export function isAnalyticsDateRangeValid(from: string, to: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return false;
  const fromTime = Date.parse(`${from}T00:00:00.000Z`);
  const toTime = Date.parse(`${to}T00:00:00.000Z`);
  return Number.isFinite(fromTime) && Number.isFinite(toTime) && toTime >= fromTime && Math.floor((toTime - fromTime) / 86_400_000) + 1 <= 366;
}
