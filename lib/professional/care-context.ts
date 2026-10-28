export const careProfileTypes = ["PATIENT", "PROFESSIONAL", "COMPANION"] as const;
export type CareProfileType = (typeof careProfileTypes)[number] | "UNKNOWN";

export const careProfileStatuses = ["ACTIVE", "DISABLED"] as const;
export type CareProfileStatus = (typeof careProfileStatuses)[number] | "UNKNOWN";

export const careAccessKinds = [
  "OWNER",
  "COMPANION_MEMBERSHIP",
  "PROFESSIONAL_RELATIONSHIP",
] as const;
export type CareAccessKind = (typeof careAccessKinds)[number] | "UNKNOWN";

export type CareContextOption = {
  pregnancyId: string;
  accessKind: CareAccessKind;
  status: string;
};

export type CareProfile = {
  id: string;
  type: CareProfileType;
  status: CareProfileStatus;
  version: number;
  professional: {
    professionalProfileId: string;
    verificationStatus: string;
  } | null;
  contexts: CareContextOption[];
};

export type CareProfilesBootstrap = {
  profiles: CareProfile[];
  requestId: string;
  preference: CareContextSelection | null;
  sessionEpoch: string;
};

export type CareContextSelection = {
  profileId: string;
  pregnancyId: string;
};

export type ResolvedCareContext = CareContextSelection & {
  profileType: CareProfileType;
  profileVersion: number;
  pregnancyVersion: number;
  accessKind: CareAccessKind;
  membershipId: string | null;
  relationshipId: string | null;
};

export type ResolveCareContextResponse = {
  context: ResolvedCareContext;
  requestId: string;
  sessionEpoch: string;
};

export type CanonicalCareError = {
  code: string;
  message: string;
  requestId: string;
};

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | "UNKNOWN" {
  return typeof value === "string" && values.includes(value) ? value as T[number] : "UNKNOWN";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

export function parseCareProfilesResponse(value: unknown): Omit<CareProfilesBootstrap, "preference" | "sessionEpoch"> {
  const root = object(value);
  if (!root || !Array.isArray(root.profiles)) throw new Error("CARE_PROFILES_INVALID");
  const profiles = root.profiles.map((raw): CareProfile => {
    const item = object(raw);
    if (!item || !uuidPattern.test(stringValue(item.id))) throw new Error("CARE_PROFILE_INVALID");
    const professional = object(item.professional);
    return {
      id: stringValue(item.id),
      type: enumValue(item.type, careProfileTypes),
      status: enumValue(item.status, careProfileStatuses),
      version: Number.isInteger(item.version) ? Number(item.version) : 0,
      professional: professional ? {
        professionalProfileId: stringValue(professional.professionalProfileId),
        verificationStatus: stringValue(professional.verificationStatus),
      } : null,
      contexts: Array.isArray(item.contexts) ? item.contexts.flatMap((rawContext) => {
        const context = object(rawContext);
        const pregnancyId = stringValue(context?.pregnancyId);
        if (!context || !uuidPattern.test(pregnancyId)) return [];
        return [{
          pregnancyId,
          accessKind: enumValue(context.accessKind, careAccessKinds),
          status: stringValue(context.status) || "UNKNOWN",
        }];
      }) : [],
    };
  });
  return { profiles, requestId: stringValue(root.requestId) };
}

export function parseResolvedCareContext(value: unknown): Omit<ResolveCareContextResponse, "sessionEpoch"> {
  const root = object(value);
  const context = object(root?.context);
  const profileId = stringValue(context?.profileId);
  const pregnancyId = stringValue(context?.pregnancyId);
  if (!root || !context || !uuidPattern.test(profileId) || !uuidPattern.test(pregnancyId)) {
    throw new Error("CARE_CONTEXT_INVALID");
  }
  return {
    context: {
      profileId,
      pregnancyId,
      profileType: enumValue(context.profileType, careProfileTypes),
      profileVersion: Number.isInteger(context.profileVersion) ? Number(context.profileVersion) : 0,
      pregnancyVersion: Number.isInteger(context.pregnancyVersion) ? Number(context.pregnancyVersion) : 0,
      accessKind: enumValue(context.accessKind, careAccessKinds),
      membershipId: nullableString(context.membershipId),
      relationshipId: nullableString(context.relationshipId),
    },
    requestId: stringValue(root.requestId),
  };
}

export function readCanonicalCareError(value: unknown, fallback: string): CanonicalCareError {
  const root = object(value);
  const nested = object(root?.error);
  return {
    code: stringValue(nested?.code) || stringValue(root?.code) || "UNKNOWN_ERROR",
    message: stringValue(nested?.message) || stringValue(root?.message) || fallback,
    requestId: stringValue(nested?.requestId) || stringValue(root?.requestId),
  };
}

export function isSelectableContext(profile: CareProfile, pregnancyId: string) {
  return profile.status === "ACTIVE" && profile.contexts.some(
    (context) => context.pregnancyId === pregnancyId && context.status === "ACTIVE",
  );
}

export function careContextCacheKey(epoch: string, selection: CareContextSelection, resource: string) {
  return ["professional", epoch, selection.profileId, selection.pregnancyId, resource] as const;
}
