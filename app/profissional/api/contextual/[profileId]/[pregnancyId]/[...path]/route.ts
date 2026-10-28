import { NextRequest } from "next/server";
import {
  isAllowedContextualCarePath,
  contextualCareHeaders,
  contextualCareUpstreamPath,
  contextualCareRequiresIdempotency,
  isMt01CareContextsEnabled,
  isValidCareContextPath,
  normalizeContextualCareQuery,
} from "../../../../../../../lib/professional/care-context-policy";
import { professionalApiFetch, professionalSessionEpoch } from "../../../../../../../lib/professional/professional-session";
import { clearProfessionalPatientCache } from "../../../../../../../lib/professional/professional-patient-cache";

const noStore = { "cache-control": "private, no-store" };

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function forward(
  request: NextRequest,
  context: { params: Promise<{ profileId: string; pregnancyId: string; path: string[] }> },
) {
  if (!isMt01CareContextsEnabled()) {
    return Response.json({ message: "Contextos de cuidado indisponíveis." }, { status: 404, headers: noStore });
  }
  const { profileId, pregnancyId, path } = await context.params;
  const relativePath = path.join("/");
  if (!isValidCareContextPath(profileId, pregnancyId) || !isAllowedContextualCarePath(relativePath, request.method)) {
    return Response.json({ message: "Rota contextual inválida." }, { status: 404, headers: noStore });
  }
  if (request.method !== "GET" && !sameOrigin(request)) {
    return Response.json({ message: "Origem inválida." }, { status: 403, headers: noStore });
  }
  const upstreamPath = contextualCareUpstreamPath(pregnancyId, relativePath);
  if (!upstreamPath) return Response.json({ message: "Rota contextual inválida." }, { status: 404, headers: noStore });
  const normalizedQuery = normalizeContextualCareQuery(relativePath, request.nextUrl.searchParams);
  if (!normalizedQuery) return Response.json({ message: "Filtros inválidos." }, { status: 400, headers: noStore });
  const headers = contextualCareHeaders(profileId, pregnancyId, request.headers.get("x-request-id"));
  const idempotencyKey = request.headers.get("idempotency-key");
  if (contextualCareRequiresIdempotency(relativePath, request.method)) {
    const minimumLength = relativePath.startsWith("appointments") ? 1 : 16;
    if (!idempotencyKey || idempotencyKey.length < minimumLength || idempotencyKey.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)) {
      return Response.json({
        error: { code: "CARE_INVITATION_INVALID", message: "Chave de idempotência inválida.", requestId: "" },
      }, { status: 400, headers: noStore });
    }
    headers.set("idempotency-key", idempotencyKey);
  }
  if (request.method !== "GET") headers.set("content-type", "application/json");
  const upstream = await professionalApiFetch(
    `${upstreamPath}${normalizedQuery.size ? `?${normalizedQuery}` : ""}`,
    { method: request.method, headers, body: request.method === "GET" ? undefined : await request.text() || undefined },
  );
  const responseBody = await upstream.text();
  if (request.method !== "GET" && upstream.ok) clearProfessionalPatientCache(await professionalSessionEpoch());
  return new Response(responseBody || null, {
    status: upstream.status,
    headers: {
      ...noStore,
      "content-type": upstream.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
