// GENERATED FILE — DO NOT EDIT. Run npm run openapi:generate.
// Source: momiz-openapi-d91c5e6422617516458c00ee70a39c2babb72692; contract 1.0.0; sha256 6d2391ec25a20047d71e039c06f43bd2c6d67d519fbb159163b288fc6ba1153b

export const GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT = {
  operationId: "getCurrentProfessionalTerms",
  method: "GET",
  path: "/care/professional/terms",
  sourceSha: "d91c5e6422617516458c00ee70a39c2babb72692",
  sourceChecksum: "6d2391ec25a20047d71e039c06f43bd2c6d67d519fbb159163b288fc6ba1153b",
} as const;

export type GetCurrentProfessionalTermsResponse = {
  /** @deprecated Alias legado; use acceptanceId. */
  version: string;
  acceptanceId: string;
  documentVersion: string;
  path: string;
  url: string;
  legalReviewStatus: "PENDING_LEGAL_REVIEW";
};

export type GetCurrentProfessionalTermsParseResult =
  | { ok: true; value: GetCurrentProfessionalTermsResponse }
  | { ok: false; error: { code: "INVALID_RESPONSE"; issues: string[] } };

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function parseGetCurrentProfessionalTermsResponse(input: unknown): GetCurrentProfessionalTermsParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: { code: "INVALID_RESPONSE", issues: ["response"] } };
  }
  const issues: string[] = [];
  const payload = input as Record<string, unknown>;
  if (typeof payload.version !== "string") issues.push("version");
  if (typeof payload.acceptanceId !== "string") issues.push("acceptanceId");
  if (typeof payload.documentVersion !== "string") issues.push("documentVersion");
  if (typeof payload.path !== "string") issues.push("path");
  if (typeof payload.url !== "string" || (typeof payload.url === "string" && !isHttpUrl(payload.url))) issues.push("url");
  if (typeof payload.legalReviewStatus !== "string" || (typeof payload.legalReviewStatus === "string" && !["PENDING_LEGAL_REVIEW"].includes(payload.legalReviewStatus))) issues.push("legalReviewStatus");
  if (issues.length > 0) return { ok: false, error: { code: "INVALID_RESPONSE", issues } };
  return {
    ok: true,
    value: {
      version: payload.version as string,
      acceptanceId: payload.acceptanceId as string,
      documentVersion: payload.documentVersion as string,
      path: payload.path as string,
      url: payload.url as string,
      legalReviewStatus: payload.legalReviewStatus as "PENDING_LEGAL_REVIEW",
    },
  };
}
