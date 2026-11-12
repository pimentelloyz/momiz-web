import { safeRequestId } from "../../../lib/request-correlation.ts";
import { AdminApiError } from "./admin-api-client.ts";

export function safeEphemeralDownloadUrl(
  value: unknown,
  allowLoopback = process.env.NODE_ENV !== "production",
) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const localHttp = allowLoopback && url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    return url.protocol === "https:" || localHttp ? url.href : null;
  } catch {
    return null;
  }
}

export function readCredentialDownload(payload: unknown, nowMs = Date.now()) {
  const envelope = payload !== null && typeof payload === "object" && !Array.isArray(payload)
    ? payload as { downloadUrl?: unknown; expiresAt?: unknown; requestId?: unknown }
    : null;
  const downloadUrl = safeEphemeralDownloadUrl(envelope?.downloadUrl);
  const expiresAt = typeof envelope?.expiresAt === "string" && /^\d{4}-\d{2}-\d{2}T/.test(envelope.expiresAt) ? envelope.expiresAt : null;
  const expiresAtMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  if (downloadUrl && expiresAt && Number.isFinite(expiresAtMs) && expiresAtMs > nowMs && expiresAtMs - nowMs <= 300_000) {
    return { downloadUrl, expiresAt };
  }
  throw new AdminApiError({
    message: "A API não retornou um comprovante temporário válido.",
    code: "ADMIN_CREDENTIAL_DOWNLOAD_INVALID",
    requestId: safeRequestId(envelope?.requestId),
    status: 502,
  });
}

export function openEphemeralCredentialUrl(
  downloadUrl: string,
  openWindow: (url: string, target: string) => Window | null,
) {
  const popup = openWindow("about:blank", "_blank");
  if (!popup) throw new AdminApiError({
    message: "O navegador bloqueou a abertura do comprovante.",
    code: "ADMIN_CREDENTIAL_POPUP_BLOCKED",
    requestId: null,
    status: 409,
  });
  popup.opener = null;
  if (popup.document.head) {
    const referrer = popup.document.createElement("meta");
    referrer.name = "referrer";
    referrer.content = "no-referrer";
    popup.document.head.append(referrer);
  }
  popup.location.replace(downloadUrl);
}
