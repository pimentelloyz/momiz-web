import { safeRequestId } from "../../../lib/request-correlation.ts";
import { AdminApiError } from "./admin-api-client.ts";

export function safeEphemeralDownloadUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    return url.protocol === "https:" || localHttp ? url.href : null;
  } catch {
    return null;
  }
}

export function readCredentialDownloadUrl(payload: unknown) {
  const envelope = payload !== null && typeof payload === "object" && !Array.isArray(payload)
    ? payload as { downloadUrl?: unknown; requestId?: unknown }
    : null;
  const downloadUrl = safeEphemeralDownloadUrl(envelope?.downloadUrl);
  if (downloadUrl) return downloadUrl;
  throw new AdminApiError({
    message: "A API não retornou uma URL segura para o comprovante.",
    code: "ADMIN_CREDENTIAL_DOWNLOAD_INVALID",
    requestId: safeRequestId(envelope?.requestId),
    status: 502,
  });
}
