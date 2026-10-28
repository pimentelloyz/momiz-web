import {
  parseCareProfilesResponse,
  isSelectableContext,
} from "../../../../../lib/professional/care-context";
import { isMt01CareContextsEnabled } from "../../../../../lib/professional/care-context-policy";
import {
  clearProfessionalContextPreference,
  professionalApiFetch,
  professionalSessionEpoch,
  readProfessionalContextPreference,
} from "../../../../../lib/professional/professional-session";

const noStore = { "cache-control": "private, no-store" };

export async function GET() {
  if (!isMt01CareContextsEnabled()) {
    return Response.json({ message: "Contextos de cuidado indisponíveis." }, { status: 404, headers: noStore });
  }
  const upstream = await professionalApiFetch("/api/account/care-profiles");
  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) return Response.json(payload || {}, { status: upstream.status, headers: noStore });
  try {
    const parsed = parseCareProfilesResponse(payload);
    const stored = await readProfessionalContextPreference();
    const preference = stored && parsed.profiles.some(
      (profile) => profile.id === stored.profileId && isSelectableContext(profile, stored.pregnancyId),
    ) ? stored : null;
    if (stored && !preference) await clearProfessionalContextPreference();
    return Response.json({
      ...parsed,
      preference,
      sessionEpoch: await professionalSessionEpoch(),
    }, { headers: noStore });
  } catch {
    return Response.json({
      error: { code: "CARE_CONTEXT_INVALID", message: "Resposta de contexto inválida.", requestId: "" },
    }, { status: 502, headers: noStore });
  }
}
