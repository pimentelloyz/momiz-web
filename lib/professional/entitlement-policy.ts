import { isValidOpaqueUuid } from "./care-context-policy.ts";
export function isMt09EntitlementsEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT09_ENTITLEMENTS) { return value === "true"; }
export function isMt09ChatSponsorshipEnabled(value = process.env.NEXT_PUBLIC_ENABLE_MT09_CHAT_SPONSORSHIP) { return value === "true"; }
export function isAllowedEntitlementPath(path: string, method: string, entitlementEnabled = isMt09EntitlementsEnabled(), chatEnabled = isMt09ChatSponsorshipEnabled()) { if (method !== "GET") return false; if (path === "summary") return entitlementEnabled; const match = /^message\/([^/]+)$/.exec(path); return chatEnabled && Boolean(match && isValidOpaqueUuid(match[1])); }
export function entitlementUpstreamPath(path: string) { if (path === "summary") return "/api/account/care-entitlements"; const match = /^message\/([^/]+)$/.exec(path); return match && isValidOpaqueUuid(match[1]) ? `/api/care/v2/relationships/${match[1]}/message-entitlement` : null; }
