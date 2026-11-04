import { NextRequest } from "next/server";
import {
  isMt01CareContextsEnabled,
  isMt03ProfessionalPatientsEnabled,
  isValidOpaqueUuid,
  normalizeProfessionalPatientsQuery,
  professionalProfileHeaders,
} from "../../../../../lib/professional/care-context-policy";
import { professionalApiFetch } from "../../../../../lib/professional/professional-session";
import { readProfessionalPatientsFresh } from "../../../../../lib/professional/professional-patient-reader";
import { correlatedResponseHeaders } from "../../../../../lib/request-correlation";

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
  const headers = professionalProfileHeaders(profileId, request.headers.get("x-request-id"));
  const upstream = await readProfessionalPatientsFresh(
    professionalApiFetch,
    `/api/care/v2/professional/patients?${normalized}`,
    headers,
  );
  const body = await upstream.text();
  const contentType = upstream.headers.get("content-type") || "application/json";
  return new Response(body || null, {
    status: upstream.status,
    headers: correlatedResponseHeaders(upstream, request.headers.get("x-request-id"), {
      ...browserHeaders,
      "content-type": contentType,
    }),
  });
}
