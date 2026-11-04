type ProfessionalApiFetch = (path: string, init?: RequestInit) => Promise<Response>;

export function readProfessionalPatientsFresh(
  apiFetch: ProfessionalApiFetch,
  path: string,
  headers: Headers,
) {
  return apiFetch(path, { headers, cache: "no-store" });
}
