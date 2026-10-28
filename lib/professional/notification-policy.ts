export function isMt08NotificationsEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT08_NOTIFICATIONS) { return value === "true"; }
export function isMt08NotificationPreferencesEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT08_NOTIFICATION_PREFERENCES) { return value === "true"; }
export function isAllowedNotificationPath(path: string, method: string, feedEnabled = isMt08NotificationsEnabled(), preferencesEnabled = isMt08NotificationPreferencesEnabled()) {
  if (path === "preferences") return preferencesEnabled && (method === "GET" || method === "PATCH");
  if (!feedEnabled) return false;
  if (path === "feed" && method === "GET") return true;
  const match = /^feed\/([A-Za-z0-9_-]{1,128})\/opened$/.exec(path); return method === "POST" && Boolean(match);
}
export function notificationUpstreamPath(path: string) { if (path === "preferences") return "/api/account/notification-preferences"; if (path === "feed") return "/api/account/notifications"; const match = /^feed\/([A-Za-z0-9_-]{1,128})\/opened$/.exec(path); return match ? `/api/account/notifications/${match[1]}/opened` : null; }
export function normalizeNotificationQuery(path: string, input: URLSearchParams) {
  if (path !== "feed") return input.size === 0 ? new URLSearchParams() : null;
  const allowed = new Set(["cursor", "limit", "category", "status"]); if ([...input.keys()].some((key) => !allowed.has(key))) return null;
  const limit = input.get("limit"); const cursor = input.get("cursor"); const category = input.get("category"); const status = input.get("status");
  if (limit && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50)) return null;
  if (cursor && (cursor.length > 2048 || !/^[A-Za-z0-9._~-]+$/.test(cursor))) return null;
  if (category && !["INVITATION", "RELATIONSHIP", "APPOINTMENT", "REMINDER", "DOCUMENT", "MESSAGE"].includes(category)) return null;
  if (status && !["QUEUED", "SENT", "FAILED", "OPENED", "CANCELED"].includes(status)) return null;
  const result = new URLSearchParams({ limit: limit || "20" }); if (cursor) result.set("cursor", cursor); if (category) result.set("category", category); if (status) result.set("status", status); return result;
}
