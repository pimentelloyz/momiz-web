export const invitationDirections = ["PATIENT_TO_PROFESSIONAL", "PROFESSIONAL_TO_PATIENT"] as const;
export type InvitationDirection = (typeof invitationDirections)[number] | "UNKNOWN";
export const invitationStatuses = ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELED"] as const;
export type InvitationStatus = (typeof invitationStatuses)[number] | "UNKNOWN";
export const relationshipStatuses = ["PENDING_VERIFICATION", "ACTIVE", "READ_ONLY", "PAUSED", "REVOKED", "EXPIRED"] as const;
export type RelationshipStatus = (typeof relationshipStatuses)[number] | "UNKNOWN";

export type CareInvitation = {
  id: string;
  direction: InvitationDirection;
  status: InvitationStatus;
  cancellationReason: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  version: number;
  expectedProfession: string | null;
  scopes: string[];
  token: string | null;
};

export type CareRelationship = {
  id: string;
  pregnancyId: string;
  status: RelationshipStatus;
  version: number;
  consentVersion: string | null;
  consentedAt: string | null;
  scopes: string[];
};

const scopeLabels: Record<string, string> = {
  "birth.plan.comment": "Comentar plano de parto",
};

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function nullableText(value: unknown) { return typeof value === "string" ? value : null; }
function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | "UNKNOWN" {
  return typeof value === "string" && values.includes(value) ? value as T[number] : "UNKNOWN";
}
function scopes(value: unknown) {
  return Array.isArray(value) ? value.flatMap((item) => {
    if (typeof item === "string") return [item];
    const capability = text(object(item)?.capability);
    return capability ? [capability] : [];
  }) : [];
}

export function parseCareInvitation(value: unknown): CareInvitation {
  const root = object(value);
  const item = object(root?.invitation) || root;
  if (!item || !text(item.id)) throw new Error("CARE_INVITATION_INVALID");
  return {
    id: text(item.id),
    direction: enumValue(item.direction, invitationDirections),
    status: enumValue(item.status, invitationStatuses),
    cancellationReason: nullableText(item.cancellationReason),
    expiresAt: nullableText(item.expiresAt),
    createdAt: nullableText(item.createdAt),
    version: Number.isInteger(item.version) ? Number(item.version) : 0,
    expectedProfession: nullableText(item.expectedProfession),
    scopes: scopes(item.scopes),
    token: nullableText(item.token),
  };
}

export function parseCareRelationships(value: unknown): { relationships: CareRelationship[]; requestId: string } {
  const root = object(value);
  if (!root || !Array.isArray(root.relationships)) throw new Error("CARE_RELATIONSHIPS_INVALID");
  return {
    requestId: text(root.requestId),
    relationships: root.relationships.flatMap((raw) => {
      const item = object(raw);
      if (!item || !text(item.id) || !text(item.pregnancyId)) return [];
      return [{
        id: text(item.id),
        pregnancyId: text(item.pregnancyId),
        status: enumValue(item.status, relationshipStatuses),
        version: Number.isInteger(item.version) ? Number(item.version) : 0,
        consentVersion: nullableText(item.consentVersion),
        consentedAt: nullableText(item.consentedAt),
        scopes: scopes(item.scopes),
      }];
    }),
  };
}

export function scopeLabel(scope: string) {
  return scopeLabels[scope] || "Permissão não reconhecida";
}

export function invitationStatusLabel(status: InvitationStatus, cancellationReason: string | null) {
  if (status === "CANCELED" && cancellationReason === "SUPERSEDED") return "Substituído";
  if (status === "CANCELED") return "Cancelado";
  return ({ PENDING: "Pendente", ACCEPTED: "Aceito", DECLINED: "Recusado", EXPIRED: "Expirado", UNKNOWN: "Indisponível" } as const)[status];
}

export function relationshipStatusLabel(status: RelationshipStatus) {
  return ({
    PENDING_VERIFICATION: "Aguardando verificação", ACTIVE: "Ativo", READ_ONLY: "Somente leitura",
    PAUSED: "Pausado", REVOKED: "Encerrado", EXPIRED: "Expirado", UNKNOWN: "Indisponível",
  } as const)[status];
}

export function canTerminateRelationship(status: RelationshipStatus) {
  return ["PENDING_VERIFICATION", "ACTIVE", "READ_ONLY", "PAUSED"].includes(status);
}
