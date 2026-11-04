import { NextRequest } from "next/server";
import {
  parseResolvedCareContext,
  uuidPattern,
} from "../../../../../lib/professional/care-context";
import { isMt01CareContextsEnabled } from "../../../../../lib/professional/care-context-policy";
import {
  professionalApiFetch,
  professionalSessionEpoch,
  saveProfessionalContextPreference,
} from "../../../../../lib/professional/professional-session";

const noStore = { "cache-control": "private, no-store" };

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!isMt01CareContextsEnabled()) {
    return Response.json({ message: "Contextos de cuidado indisponíveis." }, { status: 404, headers: noStore });
  }
  if (!sameOrigin(request)) return Response.json({ message: "Origem inválida." }, { status: 403, headers: noStore });
  const body = await request.json().catch(() => null) as {
    profileId?: string;
    pregnancyId?: string;
    expectedProfileVersion?: number;
  } | null;
  if (
    !body || !uuidPattern.test(body.profileId || "") || !uuidPattern.test(body.pregnancyId || "") ||
    !Number.isInteger(body.expectedProfileVersion) || Number(body.expectedProfileVersion) < 1
  ) {
    return Response.json({
      error: { code: "CARE_CONTEXT_INVALID", message: "Contexto inválido.", requestId: "" },
    }, { status: 400, headers: noStore });
  }
  const upstream = await professionalApiFetch("/api/account/care-context/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) return Response.json(payload || {}, { status: upstream.status, headers: noStore });
  try {
    const parsed = parseResolvedCareContext(payload);
    if (parsed.context.profileId !== body.profileId || parsed.context.pregnancyId !== body.pregnancyId) {
      throw new Error("CARE_CONTEXT_MISMATCH");
    }
    const sessionEpoch = await professionalSessionEpoch();
    await saveProfessionalContextPreference({ profileId: body.profileId, pregnancyId: body.pregnancyId });
    return Response.json({ ...parsed, sessionEpoch }, { headers: noStore });
  } catch {
    return Response.json({
      error: { code: "CARE_CONTEXT_MISMATCH", message: "A API retornou outro contexto.", requestId: "" },
    }, { status: 502, headers: noStore });
  }
}
