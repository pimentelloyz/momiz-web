export type CareMessage = { id: string; clientMessageId: string; authorProfileId: string; content: string; createdAt: string; readByCounterpartyAt: string | null };
export type OfficeHoursInterval = { dayOfWeek: number; start: string; end: string };
export type CommunicationPolicy = { timezone: string; officeHours: OfficeHoursInterval[] | null; expectedResponseBusinessHours: number | null; warningCode: string; version: number };
export type MessagePage = { messages: CareMessage[]; nextCursor: string | null; policy: CommunicationPolicy; requestId: string };

function object(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value !== null ? value as Record<string, unknown> : null; }
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function nullableText(value: unknown) { return typeof value === "string" ? value : null; }

export function parseCommunicationPolicy(value: unknown): CommunicationPolicy {
  const root = object(value); if (!root) throw new Error("CARE_COMMUNICATION_POLICY_INVALID");
  const officeHours = root.officeHours === null || root.officeHours === undefined ? null : Array.isArray(root.officeHours) ? root.officeHours.flatMap((raw) => {
    const item = object(raw); const day = Number(item?.dayOfWeek); const start = text(item?.start); const end = text(item?.end);
    return Number.isInteger(day) && day >= 1 && day <= 7 && /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) ? [{ dayOfWeek: day, start, end }] : [];
  }) : null;
  return { timezone: text(root.timezone), officeHours, expectedResponseBusinessHours: Number.isInteger(root.expectedResponseBusinessHours) ? Number(root.expectedResponseBusinessHours) : null, warningCode: text(root.warningCode), version: Number.isInteger(root.version) ? Number(root.version) : 0 };
}

export function parseMessagePage(value: unknown): MessagePage {
  const root = object(value); if (!root || !Array.isArray(root.messages)) throw new Error("CARE_MESSAGE_RESPONSE_INVALID");
  return { nextCursor: nullableText(root.nextCursor), requestId: text(root.requestId), policy: parseCommunicationPolicy(root.policy), messages: root.messages.map((raw) => {
    const item = object(raw); if (!item || !text(item.id) || !text(item.authorProfileId) || !text(item.createdAt)) throw new Error("CARE_MESSAGE_RESPONSE_INVALID");
    return { id: text(item.id), clientMessageId: text(item.clientMessageId), authorProfileId: text(item.authorProfileId), content: text(item.content), createdAt: text(item.createdAt), readByCounterpartyAt: nullableText(item.readByCounterpartyAt) };
  }) };
}

export function parseSentMessage(value: unknown) {
  const root = object(value); const item = object(root?.message); if (!root || !item) throw new Error("CARE_MESSAGE_RESPONSE_INVALID");
  return { message: parseMessagePage({ messages: [item], policy: { warningCode: "NON_EMERGENCY_V1" } }).messages[0], requestId: text(root.requestId) };
}

export function mergeMessages(current: CareMessage[], incoming: CareMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message])); for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function buildCareMessage(content: string, clientMessageId: string) { return { clientMessageId, content: content.trim() }; }
export function isComposerPolicyAcknowledgable(policy: CommunicationPolicy) { return policy.warningCode === "NON_EMERGENCY_V1"; }
