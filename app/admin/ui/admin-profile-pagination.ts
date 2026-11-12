export const professionalVerificationStatuses = ["DRAFT", "PENDING_VERIFICATION", "NEEDS_CORRECTION", "VERIFIED", "REJECTED", "SUSPENDED", "EXPIRED"] as const;
export const professionalPrimaryProfessions = ["OBSTETRICIAN", "DOULA", "OBSTETRIC_NURSE", "PELVIC_PHYSIOTHERAPIST"] as const;
export const professionalCredentialStatuses = ["PENDING", "VERIFIED", "REJECTED", "EXPIRED"] as const;

export type ProfessionalVerificationStatus = typeof professionalVerificationStatuses[number];
export type ProfessionalCredential = {
  id: string; type: string; status: typeof professionalCredentialStatuses[number]; issuer: string | null;
  registrationNumber: string | null; jurisdiction: string | null; expiresAt: string | null;
  documentFileName: string | null; renewalOfCredentialId: string | null; reviewedAt: string | null;
  createdAt: string; updatedAt: string;
};
export type AdminProfessionalProfile = {
  id: string; displayName: string; primaryProfession: typeof professionalPrimaryProfessions[number];
  verificationStatus: ProfessionalVerificationStatus; submittedAt: string | null; verifiedAt: string | null;
  city: string | null; state: string | null; bio: string | null; updatedAt: string;
  user: { name: string; email: string }; credentials: ProfessionalCredential[];
  reviewLogs: Array<{ id: string; action: string; previousStatus: ProfessionalVerificationStatus | null; resultingStatus: ProfessionalVerificationStatus | null; reason: string | null; createdAt: string }>;
};
export type AdminProfilePage = { items: AdminProfessionalProfile[]; nextCursor: string | null };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invalid = () => new Error("Resposta inválida da fila de cadastros.");
const isIso = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));

function nullableString(value: unknown) { if (value === null) return null; if (typeof value === "string") return value; throw invalid(); }
function nullableIso(value: unknown) { if (value === null) return null; if (isIso(value)) return value; throw invalid(); }
function nullableUuid(value: unknown) { if (value === null) return null; if (typeof value === "string" && uuid.test(value)) return value; throw invalid(); }
function nullableStatus(value: unknown) {
  if (value === null) return null;
  if (typeof value === "string" && professionalVerificationStatuses.includes(value as ProfessionalVerificationStatus)) return value as ProfessionalVerificationStatus;
  throw invalid();
}

function readCredential(raw: unknown): ProfessionalCredential {
  if (!raw || typeof raw !== "object") throw invalid();
  const value = raw as Record<string, unknown>;
  if (typeof value.id !== "string" || !uuid.test(value.id) || typeof value.type !== "string" || !value.type || typeof value.status !== "string" || !professionalCredentialStatuses.includes(value.status as ProfessionalCredential["status"]) || !isIso(value.createdAt) || !isIso(value.updatedAt)) throw invalid();
  return {
    id: value.id, type: value.type, status: value.status as ProfessionalCredential["status"],
    issuer: nullableString(value.issuer), registrationNumber: nullableString(value.registrationNumber),
    jurisdiction: nullableString(value.jurisdiction), expiresAt: nullableIso(value.expiresAt),
    documentFileName: nullableString(value.documentFileName), renewalOfCredentialId: nullableUuid(value.renewalOfCredentialId),
    reviewedAt: nullableIso(value.reviewedAt), createdAt: value.createdAt, updatedAt: value.updatedAt,
  };
}

function readProfile(raw: unknown): AdminProfessionalProfile {
  if (!raw || typeof raw !== "object") throw invalid();
  const value = raw as Record<string, unknown>;
  const user = value.user as Record<string, unknown> | null;
  if (typeof value.id !== "string" || !uuid.test(value.id) || typeof value.displayName !== "string" || typeof value.primaryProfession !== "string" || !professionalPrimaryProfessions.includes(value.primaryProfession as AdminProfessionalProfile["primaryProfession"]) || typeof value.verificationStatus !== "string" || !professionalVerificationStatuses.includes(value.verificationStatus as ProfessionalVerificationStatus) || !isIso(value.updatedAt) || !user || typeof user.name !== "string" || typeof user.email !== "string" || !Array.isArray(value.credentials) || value.credentials.length > 50 || !Array.isArray(value.reviewLogs) || value.reviewLogs.length > 50) throw invalid();
  const reviewLogs = value.reviewLogs.map((rawLog) => {
    if (!rawLog || typeof rawLog !== "object") throw invalid();
    const log = rawLog as Record<string, unknown>;
    if (typeof log.id !== "string" || !uuid.test(log.id) || typeof log.action !== "string" || !log.action || !isIso(log.createdAt)) throw invalid();
    return { id: log.id, action: log.action, previousStatus: nullableStatus(log.previousStatus), resultingStatus: nullableStatus(log.resultingStatus), reason: nullableString(log.reason), createdAt: log.createdAt };
  });
  return {
    id: value.id, displayName: value.displayName, primaryProfession: value.primaryProfession as AdminProfessionalProfile["primaryProfession"],
    verificationStatus: value.verificationStatus as ProfessionalVerificationStatus, submittedAt: nullableIso(value.submittedAt),
    verifiedAt: nullableIso(value.verifiedAt), city: nullableString(value.city), state: nullableString(value.state),
    bio: nullableString(value.bio), updatedAt: value.updatedAt, user: { name: user.name, email: user.email },
    credentials: value.credentials.map(readCredential), reviewLogs,
  };
}

export function readAdminProfilePage(payload: unknown): AdminProfilePage {
  if (!payload || typeof payload !== "object") throw invalid();
  const value = payload as { items?: unknown; profiles?: unknown; nextCursor?: unknown };
  const source = Array.isArray(value.items) ? value.items : Array.isArray(value.profiles) ? value.profiles : null;
  if (!source || (value.nextCursor !== null && value.nextCursor !== undefined && typeof value.nextCursor !== "string")) throw invalid();
  return { items: source.map(readProfile), nextCursor: typeof value.nextCursor === "string" ? value.nextCursor : null };
}

export function mergeAdminProfilePages<T extends { id: string }>(current: T[], incoming: T[]) {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}
