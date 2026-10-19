const EVENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeEventId(value: string) {
  const normalized = value.trim().toLowerCase();
  return EVENT_ID_PATTERN.test(normalized) ? normalized : null;
}

export function buildEventDeepLink(value: string) {
  const eventId = normalizeEventId(value);
  return eventId ? `momiz://events/${encodeURIComponent(eventId)}` : null;
}

export function buildInviteDeepLink(slug: string, guest?: string) {
  const query = guest ? `?guest=${encodeURIComponent(guest)}` : "";
  return `momiz://convite/${encodeURIComponent(slug)}${query}`;
}
