import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import {
  isMt01CareContextsEnabled,
  isMt03ProfessionalPatientsEnabled,
  isValidOpaqueUuid,
  normalizeProfessionalPatientsQuery,
  professionalProfileHeaders,
} from "../../../../../lib/professional/care-context-policy";
import { patientPageCacheKey } from "../../../../../lib/professional/professional-patients";
import {
  clearProfessionalPatientCache,
  readProfessionalPatientCache,
  writeProfessionalPatientCache,
} from "../../../../../lib/professional/professional-patient-cache";
import {
  professionalApiFetch,
  professionalSessionEpoch,
} from "../../../../../lib/professional/professional-session";

const browserHeaders = { "cache-control": "private, no-store" };

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
) {
  if (!isMt01CareContextsEnabled() || !isMt03ProfessionalPatientsEnabled()) {
    return Response.json({ error: { code: "FEATURE_TEMPORARILY_DISABLED", message: "Painel indisponível.", requestId: "" } }, { status: 503, headers: browserHeaders });
  }
  const { profileId } = await context.params;
  if (!isValidOpaqueUuid(profileId)) {
    return Response.json({ error: { code: "CARE_PATIENT_FILTER_INVALID", message: "Perfil inválido.", requestId: "" } }, { status: 400, headers: browserHeaders });
  }
  const normalized = normalizeProfessionalPatientsQuery(request.nextUrl.searchParams);
  if (!normalized) {
    return Response.json({ error: { code: "CARE_PATIENT_FILTER_INVALID", message: "Filtros inválidos.", requestId: "" } }, { status: 400, headers: browserHeaders });
  }
  const epoch = await professionalSessionEpoch();
  const queryFingerprint = createHash("sha256").update(normalized.toString()).digest("base64url");
  const cacheKey = patientPageCacheKey(epoch, profileId, queryFingerprint);
  const cached = readProfessionalPatientCache(cacheKey);
  const headers = professionalProfileHeaders(profileId, request.headers.get("x-request-id"));
  if (cached) headers.set("if-none-match", cached.etag);

  let upstream = await professionalApiFetch(`/api/care/v2/professional/patients?${normalized}`, { headers });
  if (upstream.status === 304 && cached) {
    return new Response(cached.body, { status: cached.status, headers: { ...browserHeaders, "content-type": cached.contentType } });
  }
  if (upstream.status === 304) {
    headers.delete("if-none-match");
    upstream = await professionalApiFetch(`/api/care/v2/professional/patients?${normalized}`, { headers });
  }
  const body = await upstream.text();
  const contentType = upstream.headers.get("content-type") || "application/json";
  const etag = upstream.headers.get("etag");
  if (upstream.ok && etag && body) writeProfessionalPatientCache(cacheKey, { etag, body, status: upstream.status, contentType });
  return new Response(body || null, { status: upstream.status, headers: { ...browserHeaders, "content-type": contentType } });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
) {
  if (!isMt01CareContextsEnabled() || !isMt03ProfessionalPatientsEnabled()) {
    return Response.json({ message: "Painel indisponível." }, { status: 404, headers: browserHeaders });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return Response.json({ message: "Origem inválida." }, { status: 403, headers: browserHeaders });
  const { profileId } = await context.params;
  if (!isValidOpaqueUuid(profileId)) return Response.json({ message: "Perfil inválido." }, { status: 400, headers: browserHeaders });
  clearProfessionalPatientCache(await professionalSessionEpoch());
  return Response.json({ ok: true }, { headers: browserHeaders });
}
