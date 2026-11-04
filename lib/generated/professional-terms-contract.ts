// GENERATED FILE — DO NOT EDIT. Run npm run openapi:generate.
// Source: momiz-openapi-cf9ca805c5c621b46af82898bd1d99fa1b1ae8ab; contract 1.0.0; sha256 0210e6b6141a74c974fb9103d344524e1b6741f2e3be47ac40ecd962752b6726

export const GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT = {
  operationId: "getCurrentProfessionalTerms",
  method: "GET",
  path: "/care/professional/terms",
  sourceSha: "cf9ca805c5c621b46af82898bd1d99fa1b1ae8ab",
  sourceChecksum: "0210e6b6141a74c974fb9103d344524e1b6741f2e3be47ac40ecd962752b6726",
} as const;

export type GetCurrentProfessionalTermsResponse = {
  version: string;
  url: string;
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
  if (typeof payload.url !== "string" || (typeof payload.url === "string" && !isHttpUrl(payload.url))) issues.push("url");
  if (issues.length > 0) return { ok: false, error: { code: "INVALID_RESPONSE", issues } };
  return {
    ok: true,
    value: {
      version: payload.version as string,
      url: payload.url as string,
    },
  };
}
