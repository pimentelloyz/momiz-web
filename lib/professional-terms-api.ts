import {
  GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT,
  parseGetCurrentProfessionalTermsResponse,
  type GetCurrentProfessionalTermsParseResult,
} from "./generated/professional-terms-contract.ts";
import { HEALTH_PROFESSIONAL_TERMS } from "./legal-documents.ts";

export type ProfessionalTermsCompatibility =
  | { status: "MATCH"; terms: GetCurrentProfessionalTermsParseResult & { ok: true } }
  | { status: "INVALID_RESPONSE"; terms: GetCurrentProfessionalTermsParseResult & { ok: false } }
  | { status: "MISMATCH"; terms: GetCurrentProfessionalTermsParseResult & { ok: true } };

export function assessProfessionalTermsCompatibility(input: unknown): ProfessionalTermsCompatibility {
  const terms = parseGetCurrentProfessionalTermsResponse(input);
  if (!terms.ok) return { status: "INVALID_RESPONSE", terms };

  const matches = terms.value.version === HEALTH_PROFESSIONAL_TERMS.version &&
    terms.value.url === HEALTH_PROFESSIONAL_TERMS.canonicalUrl;
  return { status: matches ? "MATCH" : "MISMATCH", terms };
}

export type ProfessionalTermsLoadResult =
  | { status: "MATCH"; value: { version: string; url: string } }
  | { status: "MISMATCH" | "INVALID_RESPONSE" | "UPSTREAM_ERROR" };

export async function loadProfessionalTerms(
  apiBaseUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<ProfessionalTermsLoadResult> {
  try {
    const response = await fetcher(
      `${apiBaseUrl.replace(/\/+$/, "")}/api${GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT.path}`,
      { headers: { accept: "application/json" }, cache: "no-store" },
    );
    if (!response.ok) return { status: "UPSTREAM_ERROR" };

    const compatibility = assessProfessionalTermsCompatibility(await response.json());
    if (compatibility.status !== "MATCH") return { status: compatibility.status };
    return { status: "MATCH", value: compatibility.terms.value };
  } catch {
    return { status: "UPSTREAM_ERROR" };
  }
}
