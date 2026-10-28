import "server-only";

type Entry = { etag: string; body: string; status: number; contentType: string; expiresAt: number };
const entries = new Map<string, Entry>();
const maxEntries = 100;

export function readProfessionalPatientCache(key: string) {
  const entry = entries.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) { entries.delete(key); return null; }
  return entry;
}

export function writeProfessionalPatientCache(key: string, entry: Omit<Entry, "expiresAt">) {
  if (entries.size >= maxEntries) entries.delete(entries.keys().next().value as string);
  entries.set(key, { ...entry, expiresAt: Date.now() + 15_000 });
}

export function clearProfessionalPatientCache(sessionEpoch?: string) {
  if (!sessionEpoch) { entries.clear(); return; }
  for (const key of entries.keys()) if (key.startsWith(`${sessionEpoch}:`)) entries.delete(key);
}
