export type AdminReportPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export function readAdminReportPage<T>(payload: unknown): AdminReportPage<T> {
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida da fila de denúncias.");
  const value = payload as { items?: unknown; reports?: unknown; nextCursor?: unknown };
  const items = Array.isArray(value.items) ? value.items : Array.isArray(value.reports) ? value.reports : null;
  if (!items || (value.nextCursor !== null && value.nextCursor !== undefined && typeof value.nextCursor !== "string")) {
    throw new Error("Resposta inválida da fila de denúncias.");
  }
  return { items: items as T[], nextCursor: typeof value.nextCursor === "string" ? value.nextCursor : null };
}

export function mergeAdminReportPages<T extends { id: string }>(current: T[], incoming: T[]) {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}
