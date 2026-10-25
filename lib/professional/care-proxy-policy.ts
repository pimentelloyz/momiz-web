const readOnlyProfessionalCarePaths = new Set([
  "professional/profile",
  "professional/patients",
  "professional/agenda",
  "professional/agenda/export.ics",
]);

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const token = "[A-Za-z0-9_-]{32,128}";

const clinicRoutes: Array<{ method: string; pattern: RegExp }> = [
  { method: "GET", pattern: /^professional\/clinics$/ },
  { method: "POST", pattern: /^professional\/clinics$/ },
  { method: "GET", pattern: new RegExp(`^professional/clinics/${uuid}/members$`, "i") },
  { method: "POST", pattern: new RegExp(`^professional/clinics/${uuid}/invitations$`, "i") },
  { method: "POST", pattern: new RegExp(`^professional/clinics/invitations/${token}/accept$`) },
  { method: "DELETE", pattern: new RegExp(`^professional/clinics/${uuid}/invitations/${uuid}$`, "i") },
  { method: "PATCH", pattern: new RegExp(`^professional/clinics/${uuid}/members/${uuid}$`, "i") },
];

export function isAllowedProfessionalCarePath(path: string, method = "GET") {
  if (method === "GET" && readOnlyProfessionalCarePaths.has(path)) return true;
  return clinicRoutes.some((route) => route.method === method && route.pattern.test(path));
}
