const OPAQUE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,512}$/;

export type DeferredPlatform = "ANDROID" | "IOS";

export function isOpaqueHandoffToken(value: unknown): value is string {
  return typeof value === "string" && OPAQUE_TOKEN_PATTERN.test(value);
}

export function buildPlayInstallUrl(storeUrl: string, token: string) {
  if (!isOpaqueHandoffToken(token)) return null;
  try {
    const url = new URL(storeUrl);
    if (url.protocol !== "https:" || url.hostname !== "play.google.com") return null;
    url.searchParams.set("referrer", `momiz_ddl_v1=${token}`);
    return url.toString();
  } catch {
    return null;
  }
}

export function buildIosResumeLink(token: string) {
  return isOpaqueHandoffToken(token)
    ? `momiz://handoff?token=${encodeURIComponent(token)}`
    : null;
}

export function handoffCode(token: string) {
  return isOpaqueHandoffToken(token) ? token : null;
}
