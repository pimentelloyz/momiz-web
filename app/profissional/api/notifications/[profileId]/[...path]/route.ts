import { NextRequest } from "next/server";
import { isValidOpaqueUuid, professionalProfileHeaders } from "../../../../../../lib/professional/care-context-policy";
import { isAllowedNotificationPath, normalizeNotificationQuery, notificationUpstreamPath } from "../../../../../../lib/professional/notification-policy";
import { professionalApiFetch } from "../../../../../../lib/professional/professional-session";

const noStore = { "cache-control": "private, no-store" };
function sameOrigin(request: NextRequest) { const origin = request.headers.get("origin"); return !origin || origin === request.nextUrl.origin; }

async function forward(request: NextRequest, context: { params: Promise<{ profileId: string; path: string[] }> }) {
  const { profileId, path } = await context.params; const relativePath = path.join("/");
  if (!isValidOpaqueUuid(profileId) || !isAllowedNotificationPath(relativePath, request.method)) return Response.json({ message: "Rota de notificações indisponível." }, { status: 404, headers: noStore });
  if (request.method !== "GET" && !sameOrigin(request)) return Response.json({ message: "Origem inválida." }, { status: 403, headers: noStore });
  const upstreamPath = notificationUpstreamPath(relativePath); const query = normalizeNotificationQuery(relativePath, request.nextUrl.searchParams);
  if (!upstreamPath || !query) return Response.json({ message: "Filtros inválidos." }, { status: 400, headers: noStore });
  const headers = professionalProfileHeaders(profileId, request.headers.get("x-request-id"));
  if (request.method !== "GET") { const key = request.headers.get("idempotency-key"); if (!key || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) return Response.json({ error: { code: "CARE_NOTIFICATION_PREFERENCE_INVALID", message: "Chave idempotente inválida.", requestId: "" } }, { status: 422, headers: noStore }); headers.set("idempotency-key", key); headers.set("content-type", "application/json"); }
  const upstream = await professionalApiFetch(`${upstreamPath}${query.size ? `?${query}` : ""}`, { method: request.method, headers, body: request.method === "GET" ? undefined : await request.text() || undefined });
  return new Response(await upstream.text() || null, { status: upstream.status, headers: { ...noStore, "content-type": upstream.headers.get("content-type") || "application/json" } });
}
export const GET = forward;
export const PATCH = forward;
export const POST = forward;
