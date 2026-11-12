import { AdminApiError } from "./admin-api-client.ts";

export type ProfessionalReviewDecision = "verify" | "request_correction" | "reject" | "suspend";
export type ProfessionalVerificationStatus = "DRAFT" | "PENDING_VERIFICATION" | "NEEDS_CORRECTION" | "VERIFIED" | "REJECTED" | "SUSPENDED" | "EXPIRED";

export type ProfessionalReviewResult = {
  profile: { id: string; verificationStatus: ProfessionalVerificationStatus; updatedAt: string };
  reviewedRenewal: boolean;
};

const statuses: ProfessionalVerificationStatus[] = ["DRAFT", "PENDING_VERIFICATION", "NEEDS_CORRECTION", "VERIFIED", "REJECTED", "SUSPENDED", "EXPIRED"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function iso(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
}

export function professionalReviewPayload(decision: ProfessionalReviewDecision, reason: string, updatedAt?: string | null) {
  const normalizedReason = reason.trim();
  if (decision !== "verify" && !normalizedReason) throw new Error("Informe o motivo antes de concluir a análise.");
  if (decision !== "verify" && normalizedReason.length > 1000) throw new Error("O motivo deve ter no máximo 1000 caracteres.");
  if (updatedAt && !iso(updatedAt)) throw new Error("A versão do perfil é inválida.");
  return {
    decision,
    ...(decision === "verify" ? {} : { reason: normalizedReason }),
    ...(updatedAt ? { expectedUpdatedAt: updatedAt } : {}),
  };
}

export function readProfessionalReviewResult(payload: unknown): ProfessionalReviewResult {
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida da revisão profissional.");
  const value = payload as { profile?: unknown; reviewedRenewal?: unknown };
  if (!value.profile || typeof value.profile !== "object" || typeof value.reviewedRenewal !== "boolean") {
    throw new Error("Resposta inválida da revisão profissional.");
  }
  const profile = value.profile as Record<string, unknown>;
  if (typeof profile.id !== "string" || !uuid.test(profile.id) || typeof profile.verificationStatus !== "string" || !statuses.includes(profile.verificationStatus as ProfessionalVerificationStatus) || !iso(profile.updatedAt)) {
    throw new Error("Resposta inválida da revisão profissional.");
  }
  return {
    profile: {
      id: profile.id,
      verificationStatus: profile.verificationStatus as ProfessionalVerificationStatus,
      updatedAt: profile.updatedAt as string,
    },
    reviewedRenewal: value.reviewedRenewal,
  };
}

export function isProfessionalReviewVersionConflict(error: unknown) {
  return error instanceof AdminApiError && error.status === 409 && error.code === "PROFESSIONAL_REVIEW_VERSION_CONFLICT";
}

export function isCurrentProfessionalProfileRequest(requestedVersion: number, currentVersion: number) {
  return requestedVersion === currentVersion;
}

export async function submitProfessionalReviewWithReconciliation(
  post: () => Promise<unknown>,
  reload: () => Promise<void>,
) {
  try {
    const response = readProfessionalReviewResult(await post());
    await reload();
    return response;
  } catch (error) {
    if (isProfessionalReviewVersionConflict(error)) {
      try {
        await reload();
      } finally {
        throw error;
      }
    }
    throw error;
  }
}
