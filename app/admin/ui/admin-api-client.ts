import { safeRequestId } from "../../../lib/request-correlation.ts";

const errorCodePattern = /^[A-Z][A-Z0-9_]{1,79}$/;

type ErrorEnvelope = {
  message?: unknown;
  code?: unknown;
  requestId?: unknown;
  error?: unknown;
};

export class AdminApiError extends Error {
  readonly code: string | null;
  readonly requestId: string | null;
  readonly status: number;

  constructor({ message, code, requestId, status }: {
    message: string;
    code: string | null;
    requestId: string | null;
    status: number;
  }) {
    super(message);
    this.name = "AdminApiError";
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }
}

function objectEnvelope(value: unknown): ErrorEnvelope | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as ErrorEnvelope
    : null;
}

function safeMessage(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > 500 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) return null;
  return normalized;
}

function safeCode(value: unknown) {
  return typeof value === "string" && errorCodePattern.test(value) ? value : null;
}

export async function readAdminApiError(
  response: Pick<Response, "status" | "json"> & Partial<Pick<Response, "headers">>,
  fallback = "Não foi possível concluir a operação.",
) {
  const payload = await response.json().catch(() => null) as unknown;
  const outer = objectEnvelope(payload);
  const inner = objectEnvelope(outer?.error);
  return new AdminApiError({
    message: safeMessage(outer?.message) ?? safeMessage(inner?.message) ?? fallback,
    code: safeCode(outer?.code) ?? safeCode(inner?.code),
    requestId: safeRequestId(outer?.requestId)
      ?? safeRequestId(inner?.requestId)
      ?? safeRequestId(response.headers?.get("x-request-id")),
    status: response.status,
  });
}

export function isAdminSessionExpired(error: unknown) {
  return error instanceof AdminApiError && error.status === 401;
}

export function adminErrorMessage(error: unknown, fallback = "Erro inesperado.") {
  if (!(error instanceof AdminApiError)) return error instanceof Error ? error.message : fallback;
  return error.requestId ? `${error.message} Identificador: ${error.requestId}.` : error.message;
}

export async function adminApi(path: string, init?: RequestInit) {
  const response = await fetch(`/admin/api/access/${path}`, init);
  if (!response.ok) throw await readAdminApiError(response);
  return await response.json().catch(() => ({})) as unknown;
}

export function jsonRequest(method: "POST" | "PUT" | "PATCH", body: unknown) {
  return {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  } satisfies RequestInit;
}
