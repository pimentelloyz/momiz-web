const allowedProfessionalCarePaths = new Set([
  "professional/profile",
  "professional/patients",
  "professional/agenda",
  "professional/agenda/export.ics",
]);

export function isAllowedProfessionalCarePath(path: string) {
  return allowedProfessionalCarePaths.has(path);
}
