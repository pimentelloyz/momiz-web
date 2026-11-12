export const adminRelationshipStatuses = [
  "PENDING_VERIFICATION",
  "ACTIVE",
  "READ_ONLY",
  "PAUSED",
  "REVOKED",
  "EXPIRED",
] as const;

export type AdminRelationshipStatus = typeof adminRelationshipStatuses[number];

export type AdminRelationshipListItem = {
  id: string;
  patientUserId: string;
  professionalProfileId: string;
  profession: string;
  status: AdminRelationshipStatus;
  startsAt: string | null;
  expiresAt: string | null;
  pausedAt: string | null;
  revokedAt: string | null;
  communicationBlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  scopes: Array<{ capability: string }>;
};

export type AdminRelationshipPage = { items: AdminRelationshipListItem[]; nextCursor: string | null };

function nullableString(value: unknown) {
  if (value === null) return null;
  if (typeof value === "string") return value;
  throw new Error("Resposta inválida da fila de vínculos.");
}

export function readAdminRelationshipPage(payload: unknown): AdminRelationshipPage {
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida da fila de vínculos.");
  const envelope = payload as { items?: unknown; relationships?: unknown; nextCursor?: unknown };
  const source = Array.isArray(envelope.items) ? envelope.items : Array.isArray(envelope.relationships) ? envelope.relationships : null;
  if (!source || (envelope.nextCursor !== null && envelope.nextCursor !== undefined && typeof envelope.nextCursor !== "string")) {
    throw new Error("Resposta inválida da fila de vínculos.");
  }
  const items = source.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Resposta inválida da fila de vínculos.");
    const item = raw as Record<string, unknown>;
    for (const field of ["id", "patientUserId", "professionalProfileId", "profession", "createdAt", "updatedAt"]) {
      if (typeof item[field] !== "string") throw new Error("Resposta inválida da fila de vínculos.");
    }
    if (typeof item.status !== "string" || !adminRelationshipStatuses.includes(item.status as AdminRelationshipStatus) || !Array.isArray(item.scopes)) {
      throw new Error("Resposta inválida da fila de vínculos.");
    }
    const scopes = item.scopes.map((scope) => {
      if (!scope || typeof scope !== "object" || typeof (scope as { capability?: unknown }).capability !== "string") {
        throw new Error("Resposta inválida da fila de vínculos.");
      }
      return { capability: (scope as { capability: string }).capability };
    });
    return {
      id: item.id as string,
      patientUserId: item.patientUserId as string,
      professionalProfileId: item.professionalProfileId as string,
      profession: item.profession as string,
      status: item.status as AdminRelationshipStatus,
      startsAt: nullableString(item.startsAt),
      expiresAt: nullableString(item.expiresAt),
      pausedAt: nullableString(item.pausedAt),
      revokedAt: nullableString(item.revokedAt),
      communicationBlockedAt: nullableString(item.communicationBlockedAt),
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
      scopes,
    };
  });
  return { items, nextCursor: typeof envelope.nextCursor === "string" ? envelope.nextCursor : null };
}

export function mergeAdminRelationshipPages(current: AdminRelationshipListItem[], incoming: AdminRelationshipListItem[]) {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}
