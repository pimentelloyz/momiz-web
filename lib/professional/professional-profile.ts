export const professionalProfessions = [
  "OBSTETRICIAN",
  "DOULA",
  "OBSTETRIC_NURSE",
  "PELVIC_PHYSIOTHERAPIST",
] as const;
export const professionalVerificationStatuses = [
  "DRAFT",
  "PENDING_VERIFICATION",
  "NEEDS_CORRECTION",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
  "EXPIRED",
] as const;
export const professionalCredentialTypes = [
  "CRM",
  "RQE_MEDICAL",
  "COREN",
  "CREFITO",
  "RQE_PHYSIO",
  "DOULA_CERTIFICATE",
] as const;
export const professionalCredentialStatuses = ["PENDING", "VERIFIED", "REJECTED", "EXPIRED"] as const;

export type ProfessionalProfession = typeof professionalProfessions[number];
export type ProfessionalVerificationStatus = typeof professionalVerificationStatuses[number];
export type ProfessionalCredential = {
  id: string;
  type: typeof professionalCredentialTypes[number];
  registrationNumber: string | null;
  status: typeof professionalCredentialStatuses[number];
  expiresAt: string | null;
  renewalOfCredentialId: string | null;
};
export type ProfessionalProfile = {
  id: string;
  primaryProfession: ProfessionalProfession;
  displayName: string;
  verificationStatus: ProfessionalVerificationStatus;
  bio: string | null;
  credentials: ProfessionalCredential[];
};
export type ProfessionalProfileResponse = { profile: ProfessionalProfile | null };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ProfessionalProfileResponseError extends Error {
  constructor() {
    super("A API retornou um perfil profissional inválido.");
    this.name = "ProfessionalProfileResponseError";
  }
}

function invalid(): never {
  throw new ProfessionalProfileResponseError();
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
}

function nullableString(value: unknown) {
  if (value === null) return null;
  if (typeof value === "string") return value;
  return invalid();
}

function nullableUuid(value: unknown) {
  if (value === null) return null;
  if (typeof value === "string" && uuidPattern.test(value)) return value;
  return invalid();
}

function nullableIsoDate(value: unknown) {
  if (value === null) return null;
  if (isIsoDate(value)) return value;
  return invalid();
}

function readCredential(raw: unknown): ProfessionalCredential {
  if (!raw || typeof raw !== "object") return invalid();
  const value = raw as Record<string, unknown>;
  if (
    typeof value.id !== "string" || !uuidPattern.test(value.id) ||
    typeof value.type !== "string" || !professionalCredentialTypes.includes(value.type as ProfessionalCredential["type"]) ||
    typeof value.status !== "string" || !professionalCredentialStatuses.includes(value.status as ProfessionalCredential["status"])
  ) return invalid();
  return {
    id: value.id,
    type: value.type as ProfessionalCredential["type"],
    registrationNumber: nullableString(value.registrationNumber),
    status: value.status as ProfessionalCredential["status"],
    expiresAt: nullableIsoDate(value.expiresAt),
    renewalOfCredentialId: nullableUuid(value.renewalOfCredentialId),
  };
}

export function readProfessionalProfileResponse(payload: unknown, options: { allowNull?: boolean } = {}): ProfessionalProfileResponse {
  if (!payload || typeof payload !== "object") return invalid();
  const value = payload as Record<string, unknown>;
  if (value.profile === null) {
    if (options.allowNull === false) return invalid();
    return { profile: null };
  }
  if (!value.profile || typeof value.profile !== "object") return invalid();
  const profile = value.profile as Record<string, unknown>;
  if (
    typeof profile.id !== "string" || !uuidPattern.test(profile.id) ||
    typeof profile.primaryProfession !== "string" || !professionalProfessions.includes(profile.primaryProfession as ProfessionalProfession) ||
    typeof profile.displayName !== "string" ||
    typeof profile.verificationStatus !== "string" || !professionalVerificationStatuses.includes(profile.verificationStatus as ProfessionalVerificationStatus) ||
    !Array.isArray(profile.credentials) || profile.credentials.length > 100
  ) return invalid();
  return {
    profile: {
      id: profile.id,
      primaryProfession: profile.primaryProfession as ProfessionalProfession,
      displayName: profile.displayName,
      verificationStatus: profile.verificationStatus as ProfessionalVerificationStatus,
      bio: nullableString(profile.bio),
      credentials: profile.credentials.map(readCredential),
    },
  };
}
