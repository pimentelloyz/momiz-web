import { API_BASE_URL } from "../../../../lib/site-config";
import { loadProfessionalTerms } from "../../../../lib/professional-terms-api";

const responseHeaders = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };

export async function GET() {
  const result = await loadProfessionalTerms(API_BASE_URL);
  if (result.status === "MATCH") {
    return Response.json(result.value, { headers: responseHeaders });
  }

  const status = result.status === "MISMATCH" ? 409 : 502;
  return Response.json(
    { error: result.status === "MISMATCH" ? "TERMS_VERSION_MISMATCH" : "TERMS_UNAVAILABLE" },
    { status, headers: responseHeaders },
  );
}
