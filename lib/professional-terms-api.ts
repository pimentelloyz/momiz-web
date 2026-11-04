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

function withLegacyAcceptanceIdFallback(input: unknown): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return input;
  const payload = input as Record<string, unknown>;
  if (payload.acceptanceId !== undefined || typeof payload.version !== "string") return input;
  return { ...payload, acceptanceId: payload.version };
}

export function assessProfessionalTermsCompatibility(input: unknown): ProfessionalTermsCompatibility {
  const terms = parseGetCurrentProfessionalTermsResponse(withLegacyAcceptanceIdFallback(input));
  if (!terms.ok) return { status: "INVALID_RESPONSE", terms };

  const matches = terms.value.acceptanceId === HEALTH_PROFESSIONAL_TERMS.acceptanceId &&
    terms.value.version === terms.value.acceptanceId &&
    terms.value.documentVersion === HEALTH_PROFESSIONAL_TERMS.version &&
    terms.value.path === HEALTH_PROFESSIONAL_TERMS.path &&
    terms.value.url === HEALTH_PROFESSIONAL_TERMS.canonicalUrl &&
    terms.value.legalReviewStatus === HEALTH_PROFESSIONAL_TERMS.approvalStatus;
  return { status: matches ? "MATCH" : "MISMATCH", terms };
}

export type ProfessionalTermsLoadResult =
  | { status: "MATCH"; value: {
    acceptanceId: string;
    documentVersion: string;
    path: string;
    url: string;
    legalReviewStatus: string;
  } }
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
    const { acceptanceId, documentVersion, path, url, legalReviewStatus } = compatibility.terms.value;
    return { status: "MATCH", value: { acceptanceId, documentVersion, path, url, legalReviewStatus } };
  } catch {
    return { status: "UPSTREAM_ERROR" };
  }
}
