import { AdminApiError } from "./admin-api-client.ts";

export type PilotGateStatus = "PENDING" | "APPROVED" | "BLOCKED";
export type PilotGate = {
  id: string | null;
  key: string;
  label: string;
  description: string;
  status: PilotGateStatus;
  decidedAt: string | null;
  updatedAt: string | null;
};

export type PilotReadiness = {
  ready: boolean;
  advisoryOnly: boolean;
  rolloutAutomaticallyEnabled: boolean;
  approvedCount: number;
  requiredCount: number;
  gates: PilotGate[];
};

export type PilotGatePatch = {
  status: PilotGateStatus;
  reason: string;
  evidenceReference: string | null;
  expectedUpdatedAt?: string;
};

function nullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  throw new Error("Resposta inválida da prontidão do piloto.");
}

export function readPilotReadiness(payload: unknown): PilotReadiness {
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida da prontidão do piloto.");
  const envelope = payload as { readiness?: unknown };
  if (!envelope.readiness || typeof envelope.readiness !== "object") throw new Error("Resposta inválida da prontidão do piloto.");
  const value = envelope.readiness as Record<string, unknown>;
  if (
    typeof value.ready !== "boolean" ||
    typeof value.advisoryOnly !== "boolean" ||
    typeof value.rolloutAutomaticallyEnabled !== "boolean" ||
    typeof value.approvedCount !== "number" ||
    typeof value.requiredCount !== "number" ||
    !Array.isArray(value.gates)
  ) throw new Error("Resposta inválida da prontidão do piloto.");
  const gates = value.gates.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Resposta inválida da prontidão do piloto.");
    const gate = raw as Record<string, unknown>;
    for (const field of ["key", "label", "description"]) {
      if (typeof gate[field] !== "string") throw new Error("Resposta inválida da prontidão do piloto.");
    }
    if (gate.status !== "PENDING" && gate.status !== "APPROVED" && gate.status !== "BLOCKED") {
      throw new Error("Resposta inválida da prontidão do piloto.");
    }
    return {
      id: nullableString(gate.id),
      key: gate.key as string,
      label: gate.label as string,
      description: gate.description as string,
      status: gate.status as PilotGateStatus,
      decidedAt: nullableString(gate.decidedAt),
      updatedAt: nullableString(gate.updatedAt),
    };
  });
  return {
    ready: value.ready,
    advisoryOnly: value.advisoryOnly,
    rolloutAutomaticallyEnabled: value.rolloutAutomaticallyEnabled,
    approvedCount: value.approvedCount,
    requiredCount: value.requiredCount,
    gates,
  };
}

export function pilotGatePatch(
  status: PilotGateStatus,
  reason: string,
  evidenceReference: string,
  updatedAt: string | null,
): PilotGatePatch {
  return {
    status,
    reason: reason.trim(),
    evidenceReference: evidenceReference.trim() || null,
    ...(updatedAt ? { expectedUpdatedAt: updatedAt } : {}),
  };
}

export function isPilotGateVersionConflict(error: unknown) {
  return error instanceof AdminApiError && error.status === 409 && error.code === "PROFESSIONAL_PILOT_GATE_VERSION_CONFLICT";
}

export function isCurrentPilotReadinessRequest(requestedVersion: number, currentVersion: number) {
  return requestedVersion === currentVersion;
}

export async function updatePilotGateWithReconciliation(
  patch: () => Promise<void>,
  reload: () => Promise<void>,
) {
  try {
    await patch();
  } catch (error) {
    if (isPilotGateVersionConflict(error)) {
      try {
        await reload();
      } finally {
        throw error;
      }
    }
    throw error;
  }
  await reload();
}
