export const notificationCategories = ["INVITATION", "RELATIONSHIP", "APPOINTMENT", "REMINDER", "DOCUMENT", "MESSAGE"] as const;
export type NotificationCategory = (typeof notificationCategories)[number] | "UNKNOWN";
export const notificationChannels = ["IN_APP", "PUSH"] as const;
export type NotificationChannel = (typeof notificationChannels)[number] | "UNKNOWN";
export const notificationStatuses = ["QUEUED", "SENT", "FAILED", "OPENED", "CANCELED"] as const;
export type NotificationStatus = (typeof notificationStatuses)[number] | "UNKNOWN";
export const notificationDeepLinks = ["CARE_INVITATIONS", "CARE_RELATIONSHIPS", "CARE_APPOINTMENTS", "CARE_DOCUMENTS", "CARE_MESSAGES"] as const;
export type NotificationDeepLink = (typeof notificationDeepLinks)[number] | "UNKNOWN";

export type NotificationPreference = { category: NotificationCategory; channel: NotificationChannel; enabled: boolean };
export type NotificationPreferences = { version: number; preferences: NotificationPreference[]; requestId: string };
export type CareNotification = { notificationId: string; category: NotificationCategory; type: string; status: NotificationStatus; deepLink: NotificationDeepLink; title: string; body: string; createdAt: string; expiresAt: string | null };
export type NotificationPage = { items: CareNotification[]; nextCursor: string | null; requestId: string };

function object(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value !== null ? value as Record<string, unknown> : null; }
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | "UNKNOWN" { return typeof value === "string" && values.includes(value) ? value as T[number] : "UNKNOWN"; }

export function parseNotificationPreferences(value: unknown): NotificationPreferences {
  const root = object(value); if (!root || !Array.isArray(root.preferences)) throw new Error("CARE_NOTIFICATION_PREFERENCES_INVALID");
  return { version: Number.isInteger(root.version) ? Number(root.version) : 0, requestId: text(root.requestId), preferences: root.preferences.map((raw) => {
    const item = object(raw); if (!item || typeof item.enabled !== "boolean") throw new Error("CARE_NOTIFICATION_PREFERENCES_INVALID");
    return { category: enumValue(item.category, notificationCategories), channel: enumValue(item.channel, notificationChannels), enabled: item.enabled };
  }) };
}

export function parseNotificationPage(value: unknown): NotificationPage {
  const root = object(value); const values = Array.isArray(root?.items) ? root.items : Array.isArray(root?.notifications) ? root.notifications : null;
  if (!root || !values) throw new Error("CARE_NOTIFICATION_FEED_INVALID");
  return { nextCursor: typeof root.nextCursor === "string" ? root.nextCursor : null, requestId: text(root.requestId), items: values.map((raw) => {
    const item = object(raw); if (!item || !text(item.notificationId) || !text(item.createdAt)) throw new Error("CARE_NOTIFICATION_FEED_INVALID");
    return { notificationId: text(item.notificationId), category: enumValue(item.category, notificationCategories), type: text(item.type), status: enumValue(item.status, notificationStatuses), deepLink: enumValue(item.deepLink, notificationDeepLinks), title: text(item.title) || "Atualização Momiz", body: text(item.body) || "Há uma atualização no seu cuidado.", createdAt: text(item.createdAt), expiresAt: typeof item.expiresAt === "string" ? item.expiresAt : null };
  }) };
}

export function mergeNotifications(current: CareNotification[], incoming: CareNotification[]) { const seen = new Set(current.map((item) => item.notificationId)); return [...current, ...incoming.filter((item) => !seen.has(item.notificationId))]; }
export function notificationStatusLabel(status: NotificationStatus) { return ({ QUEUED: "Na fila", SENT: "Enviada ao canal", FAILED: "Falha de entrega", OPENED: "Aberta explicitamente", CANCELED: "Cancelada", UNKNOWN: "Estado indisponível" } as const)[status]; }
export function notificationCategoryLabel(category: NotificationCategory) { return ({ INVITATION: "Convites", RELATIONSHIP: "Vínculos", APPOINTMENT: "Consultas", REMINDER: "Lembretes", DOCUMENT: "Documentos", MESSAGE: "Mensagens", UNKNOWN: "Categoria indisponível" } as const)[category]; }
export function notificationDeepLinkTarget(deepLink: NotificationDeepLink) { return ({ CARE_INVITATIONS: "care-relationships-title", CARE_RELATIONSHIPS: "care-relationships-title", CARE_APPOINTMENTS: "appointments-title", CARE_DOCUMENTS: "shared-documents-title", CARE_MESSAGES: "care-chat-title", UNKNOWN: "notification-feed-title" } as const)[deepLink]; }
export function isCompletePreferenceMatrix(preferences: NotificationPreference[]) { return notificationCategories.every((category) => notificationChannels.every((channel) => preferences.some((item) => item.category === category && item.channel === channel && typeof item.enabled === "boolean"))); }
