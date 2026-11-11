export type AdminCareAuditListItem = {
  id: string;
  patientUserId: string;
  actorUserId: string | null;
  relationshipId: string | null;
  pregnancyId: string | null;
  profileId: string | null;
  resource: string;
  action: string;
  outcome: string;
  requestId: string | null;
  createdAt: string;
};

export type AdminAuditPage = { items: AdminCareAuditListItem[]; nextCursor: string | null };

export function isUuidFilter(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function nullableString(value: unknown) {
  if (value === null) return null;
  if (typeof value === "string") return value;
  throw new Error("Resposta inválida da auditoria administrativa.");
}

export function readAdminAuditPage(payload: unknown): AdminAuditPage {
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida da auditoria administrativa.");
  const envelope = payload as { items?: unknown; auditLogs?: unknown; nextCursor?: unknown };
  const source = Array.isArray(envelope.items) ? envelope.items : Array.isArray(envelope.auditLogs) ? envelope.auditLogs : null;
  if (!source || (envelope.nextCursor !== null && envelope.nextCursor !== undefined && typeof envelope.nextCursor !== "string")) {
    throw new Error("Resposta inválida da auditoria administrativa.");
  }
  const items = source.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Resposta inválida da auditoria administrativa.");
    const item = raw as Record<string, unknown>;
    for (const field of ["id", "patientUserId", "resource", "action", "outcome", "createdAt"]) {
      if (typeof item[field] !== "string") throw new Error("Resposta inválida da auditoria administrativa.");
    }
    return {
      id: item.id as string,
      patientUserId: item.patientUserId as string,
      actorUserId: nullableString(item.actorUserId),
      relationshipId: nullableString(item.relationshipId),
      pregnancyId: nullableString(item.pregnancyId),
      profileId: nullableString(item.profileId),
      resource: item.resource as string,
      action: item.action as string,
      outcome: item.outcome as string,
      requestId: nullableString(item.requestId),
      createdAt: item.createdAt as string,
    };
  });
  return { items, nextCursor: typeof envelope.nextCursor === "string" ? envelope.nextCursor : null };
}

export function mergeAdminAuditPages(current: AdminCareAuditListItem[], incoming: AdminCareAuditListItem[]) {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}
