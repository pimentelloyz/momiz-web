const uuidSource = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const uuidPattern = new RegExp(`^${uuidSource}$`, "i");

export function isMt01CareContextsEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT01_CARE_CONTEXTS) {
  return value === "true";
}

export function isMt02CareRelationshipsEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS) {
  return value === "true";
}

export function isMt03ProfessionalPatientsEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT03_PROFESSIONAL_PATIENTS) {
  return value === "true";
}

export function isMt04DocumentSharesEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT04_DOCUMENT_SHARES) {
  return value === "true";
}

export function isMt05AppointmentsEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT05_APPOINTMENTS) { return value === "true"; }
export function isMt06CareChatEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT06_CARE_CHAT) { return value === "true"; }
export function isMt07LaborEventsEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT07_LABOR_EVENTS) { return value === "true"; }

export function isAllowedContextualCarePath(
  path: string,
  method = "GET",
  mt02Enabled = isMt02CareRelationshipsEnabled(),
  mt04Enabled = isMt04DocumentSharesEnabled(),
  mt05Enabled = isMt05AppointmentsEnabled(),
  mt06Enabled = isMt06CareChatEnabled(),
  mt07Enabled = isMt07LaborEventsEnabled(),
) {
  if (method === "GET" && path === "summary") return true;
  if (mt04Enabled) {
    if (method === "GET" && path === "documents") return true;
    if (method === "GET" && new RegExp(`^documents/${uuidSource}/collaboration$`, "i").test(path)) return true;
    if (method === "POST" && new RegExp(`^documents/${uuidSource}/(download-url|comments)$`, "i").test(path)) return true;
    if (method === "PUT" && new RegExp(`^documents/${uuidSource}/review$`, "i").test(path)) return true;
  }
  if (mt05Enabled) {
    if (method === "GET" && ["appointments", "appointments/calendar.ics"].includes(path)) return true;
    if (method === "POST" && path === "appointments") return true;
    if (method === "GET" && new RegExp(`^appointments/${uuidSource}(?:/events)?$`, "i").test(path)) return true;
    if (method === "POST" && new RegExp(`^appointments/${uuidSource}/(?:respond|reschedule|reschedule/respond|cancel|complete|no-show)$`, "i").test(path)) return true;
  }
  if (mt06Enabled) {
    if (method === "GET" && new RegExp(`^relationships/${uuidSource}/messages(?:/policy)?$`, "i").test(path)) return true;
    if (method === "POST" && new RegExp(`^relationships/${uuidSource}/messages(?:/read-receipts)?$`, "i").test(path)) return true;
  }
  if (mt07Enabled && method === "GET" && path === "labor-events") return true;
  if (!mt02Enabled) return false;
  if (method === "GET" && path === "relationships") return true;
  if (method === "POST" && path === "invitations") return true;
  if (method === "POST" && new RegExp(`^invitations/${uuidSource}/(resend|decline)$`, "i").test(path)) return true;
  if (method === "DELETE" && new RegExp(`^invitations/${uuidSource}$`, "i").test(path)) return true;
  return method === "POST" && new RegExp(`^relationships/${uuidSource}/terminate$`, "i").test(path);
}

export function contextualCareUpstreamPath(pregnancyId: string, path: string) {
  if (path === "summary" || path === "relationships" || path === "invitations" || path === "documents" || path === "appointments" || path === "appointments/calendar.ics" || path === "labor-events" || new RegExp(`^documents/${uuidSource}/(download-url|collaboration|review|comments)$`, "i").test(path) || new RegExp(`^appointments/${uuidSource}(?:/(?:events|respond|reschedule|reschedule/respond|cancel|complete|no-show))?$`, "i").test(path) || new RegExp(`^relationships/${uuidSource}/messages(?:/(?:read-receipts|policy))?$`, "i").test(path)) {
    return `/api/care/v2/pregnancies/${pregnancyId}/${path}`;
  }
  if (new RegExp(`^invitations/${uuidSource}/(resend|decline)$`, "i").test(path) || new RegExp(`^invitations/${uuidSource}$`, "i").test(path)) {
    return `/api/care/v2/${path}`;
  }
  if (new RegExp(`^relationships/${uuidSource}/terminate$`, "i").test(path)) return `/api/care/v2/${path}`;
  return null;
}

export function contextualCareRequiresIdempotency(path: string, method: string) {
  if (method === "GET" || /\/download-url$/i.test(path)) return false;
  return true;
}

const documentQueryKeys = new Set(["cursor", "limit", "q", "clinicalCategory", "clinicalDateFrom", "clinicalDateTo", "tags"]);
export function normalizeContextualCareQuery(path: string, input: URLSearchParams) {
  if (path === "labor-events") return normalizeLaborEventQuery(input);
  if (/^relationships\/[0-9a-f-]+\/messages$/i.test(path)) return normalizeMessageQuery(input);
  if (path === "appointments" || path === "appointments/calendar.ics" || /\/events$/i.test(path)) return normalizeAppointmentQuery(path, input);
  if (path !== "documents") return input.size === 0 ? new URLSearchParams() : null;
  if ([...input.keys()].some((key) => !documentQueryKeys.has(key))) return null;
  const limit = input.get("limit");
  const category = input.get("clinicalCategory");
  const cursor = input.get("cursor");
  const query = input.get("q");
  const dates = [input.get("clinicalDateFrom"), input.get("clinicalDateTo")].filter(Boolean) as string[];
  if (limit && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50)) return null;
  if (category && !["LAB_RESULT", "IMAGING", "CLINICAL_REPORT", "PRESCRIPTION", "OTHER"].includes(category)) return null;
  if (cursor && (cursor.length > 2048 || !/^[A-Za-z0-9._~-]+$/.test(cursor))) return null;
  if (query && query.trim().length > 120) return null;
  if (dates.some((value) => !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value))) return null;
  if (input.getAll("tags").length > 10 || input.getAll("tags").some((value) => value.trim().length > 80)) return null;
  const normalized = new URLSearchParams();
  for (const key of documentQueryKeys) {
    for (const raw of input.getAll(key)) {
      const value = raw.trim();
      if (value) normalized.append(key, value);
    }
  }
  if (!normalized.has("limit")) normalized.set("limit", "25");
  return normalized;
}

function normalizeLaborEventQuery(input: URLSearchParams) {
  const allowed = new Set(["cursor", "limit"]); if ([...input.keys()].some((key) => !allowed.has(key))) return null;
  const limit = input.get("limit"); const cursor = input.get("cursor"); if (limit && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100)) return null; if (cursor && (cursor.length > 2048 || !/^[A-Za-z0-9._~-]+$/.test(cursor))) return null;
  const result = new URLSearchParams({ limit: limit || "30" }); if (cursor) result.set("cursor", cursor); return result;
}

function normalizeMessageQuery(input: URLSearchParams) {
  const allowed = new Set(["limit", "cursor", "direction"]); if ([...input.keys()].some((key) => !allowed.has(key))) return null;
  const limit = input.get("limit"); const cursor = input.get("cursor"); const direction = input.get("direction") || "OLDER";
  if (limit && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100)) return null;
  if (cursor && (cursor.length > 2048 || !/^[A-Za-z0-9._~-]+$/.test(cursor))) return null;
  if (!["OLDER", "NEWER"].includes(direction)) return null;
  const normalized = new URLSearchParams({ limit: limit || "30", direction }); if (cursor) normalized.set("cursor", cursor); return normalized;
}

const appointmentStatuses = new Set(["PROPOSED", "SCHEDULED", "CONFIRMED", "RESCHEDULE_REQUESTED", "CANCELED", "COMPLETED", "NO_SHOW"]);
function normalizeAppointmentQuery(path: string, input: URLSearchParams) {
  const calendar = path === "appointments/calendar.ics"; const events = /\/events$/i.test(path);
  const allowed = new Set(calendar ? ["from", "to"] : events ? ["cursor", "limit"] : ["from", "to", "status", "responsibleProfessionalProfileId", "limit", "cursor"]);
  if ([...input.keys()].some((key) => !allowed.has(key))) return null;
  const limit = input.get("limit"); const cursor = input.get("cursor"); const from = input.get("from"); const to = input.get("to");
  if (limit && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50)) return null;
  if (cursor && (cursor.length > 2048 || !/^[A-Za-z0-9._~-]+$/.test(cursor))) return null;
  if ((from && !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(to))) return null;
  if (calendar && (!from || !to)) return null;
  const status = input.get("status"); if (status && status.split(",").some((value) => !appointmentStatuses.has(value))) return null;
  const responsible = input.get("responsibleProfessionalProfileId"); if (responsible && !uuidPattern.test(responsible)) return null;
  const normalized = new URLSearchParams(); for (const key of allowed) { const value = input.get(key)?.trim(); if (value) normalized.set(key, value); }
  if (!calendar && !normalized.has("limit")) normalized.set("limit", events ? "25" : "20"); return normalized;
}

export function isValidCareContextPath(profileId: string, pregnancyId: string) {
  return uuidPattern.test(profileId) && uuidPattern.test(pregnancyId);
}

export function isValidOpaqueUuid(value: string) {
  return uuidPattern.test(value);
}

export function contextualCareHeaders(profileId: string, pregnancyId: string, requestId?: string | null) {
  const headers = new Headers();
  headers.set("x-momiz-profile-id", profileId);
  headers.set("x-momiz-pregnancy-id", pregnancyId);
  if (requestId && requestId.length <= 128) headers.set("x-request-id", requestId);
  return headers;
}

export function professionalProfileHeaders(profileId: string, requestId?: string | null) {
  const headers = new Headers();
  headers.set("x-momiz-profile-id", profileId);
  if (requestId && requestId.length <= 128) headers.set("x-request-id", requestId);
  return headers;
}

const patientQueryKeys = new Set(["cursor", "limit", "q", "relationshipStatus", "pregnancyStatus"]);
export function normalizeProfessionalPatientsQuery(input: URLSearchParams) {
  if ([...input.keys()].some((key) => !patientQueryKeys.has(key))) return null;
  const query = new URLSearchParams();
  const cursor = input.get("cursor");
  const search = input.get("q")?.trim();
  const limit = input.get("limit") || "25";
  const relationshipStatus = input.get("relationshipStatus") || "ACTIVE,READ_ONLY";
  const pregnancyStatus = input.get("pregnancyStatus") || "ACTIVE";
  if (cursor) query.set("cursor", cursor);
  query.set("limit", limit);
  if (search) query.set("q", search);
  query.set("relationshipStatus", relationshipStatus);
  query.set("pregnancyStatus", pregnancyStatus);
  return query;
}
