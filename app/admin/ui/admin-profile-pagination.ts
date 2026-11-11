export type AdminProfilePage<T> = {
  items: T[];
  nextCursor: string | null;
};

export function readAdminProfilePage<T>(payload: unknown): AdminProfilePage<T> {
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida da fila de cadastros.");
  const value = payload as { items?: unknown; profiles?: unknown; nextCursor?: unknown };
  const items = Array.isArray(value.items) ? value.items : Array.isArray(value.profiles) ? value.profiles : null;
  if (!items || (value.nextCursor !== null && value.nextCursor !== undefined && typeof value.nextCursor !== "string")) {
    throw new Error("Resposta inválida da fila de cadastros.");
  }
  return { items: items as T[], nextCursor: typeof value.nextCursor === "string" ? value.nextCursor : null };
}

export function mergeAdminProfilePages<T extends { id: string }>(current: T[], incoming: T[]) {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}
