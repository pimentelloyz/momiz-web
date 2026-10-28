export const patientRelationshipStatuses = ["PENDING_VERIFICATION", "ACTIVE", "READ_ONLY", "PAUSED"] as const;
export type PatientRelationshipStatus = (typeof patientRelationshipStatuses)[number] | "UNKNOWN";
export const pregnancyStatuses = ["ACTIVE", "ARCHIVED"] as const;
export type PregnancyStatus = (typeof pregnancyStatuses)[number] | "UNKNOWN";

export type ProfessionalPatient = {
  pregnancyId: string;
  relationshipId: string;
  relationshipVersion: number;
  relationshipStatus: PatientRelationshipStatus;
  patient: { profileId: string; displayName: string; photoUrl: string | null };
  pregnancyStatus: PregnancyStatus;
  grantedScopes: string[];
  summary: { unreadMessages?: number };
  updatedAt: string;
};

export type ProfessionalPatientsPage = {
  items: ProfessionalPatient[];
  nextCursor: string | null;
  requestId: string;
};

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | "UNKNOWN" {
  return typeof value === "string" && values.includes(value) ? value as T[number] : "UNKNOWN";
}

export function parseProfessionalPatientsPage(value: unknown): ProfessionalPatientsPage {
  const root = object(value);
  if (!root || !Array.isArray(root.items)) throw new Error("CARE_PATIENT_RESPONSE_INVALID");
  return {
    nextCursor: typeof root.nextCursor === "string" ? root.nextCursor : null,
    requestId: text(root.requestId),
    items: root.items.flatMap((raw) => {
      const item = object(raw);
      const patient = object(item?.patient);
      const summary = object(item?.summary);
      if (!item || !patient || !text(item.pregnancyId) || !text(item.relationshipId) || !text(patient.profileId)) return [];
      const unread = summary?.unreadMessages;
      return [{
        pregnancyId: text(item.pregnancyId),
        relationshipId: text(item.relationshipId),
        relationshipVersion: Number.isInteger(item.relationshipVersion) ? Number(item.relationshipVersion) : 0,
        relationshipStatus: enumValue(item.relationshipStatus, patientRelationshipStatuses),
        patient: {
          profileId: text(patient.profileId),
          displayName: text(patient.displayName) || "Paciente",
          photoUrl: typeof patient.photoUrl === "string" ? patient.photoUrl : null,
        },
        pregnancyStatus: enumValue(item.pregnancyStatus, pregnancyStatuses),
        grantedScopes: Array.isArray(item.grantedScopes) ? item.grantedScopes.filter((scope): scope is string => typeof scope === "string") : [],
        summary: Number.isInteger(unread) && Number(unread) >= 0 ? { unreadMessages: Math.min(Number(unread), 999) } : {},
        updatedAt: text(item.updatedAt),
      }];
    }),
  };
}

export function patientPageCacheKey(epoch: string, profileId: string, queryFingerprint: string) {
  return `${epoch}:${profileId}:${queryFingerprint}`;
}

export function appendPatientPage(current: ProfessionalPatient[], incoming: ProfessionalPatient[]) {
  const seen = new Set(current.map((item) => item.relationshipId));
  return [...current, ...incoming.filter((item) => !seen.has(item.relationshipId))];
}

export function relationshipStatusLabel(status: PatientRelationshipStatus) {
  return ({
    PENDING_VERIFICATION: "Aguardando verificação", ACTIVE: "Ativo", READ_ONLY: "Somente leitura",
    PAUSED: "Pausado", UNKNOWN: "Indisponível",
  } as const)[status];
}

export function isPatientCardAvailable(status: PatientRelationshipStatus) {
  return status === "ACTIVE" || status === "READ_ONLY";
}
