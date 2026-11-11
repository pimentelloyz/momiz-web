export const professionalFeatureFlagNames = [
  "NEXT_PUBLIC_ENABLE_MT01_CARE_CONTEXTS",
  "NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS",
  "NEXT_PUBLIC_ENABLE_MT03_PROFESSIONAL_PATIENTS",
  "NEXT_PUBLIC_ENABLE_MT04_DOCUMENT_SHARES",
  "NEXT_PUBLIC_ENABLE_MT05_APPOINTMENTS",
  "NEXT_PUBLIC_ENABLE_MT06_CARE_CHAT",
  "NEXT_PUBLIC_ENABLE_MT07_LABOR_EVENTS",
  "NEXT_PUBLIC_ENABLE_MT08_NOTIFICATIONS",
  "NEXT_PUBLIC_ENABLE_MT08_NOTIFICATION_PREFERENCES",
  "NEXT_PUBLIC_ENABLE_MT09_ENTITLEMENTS",
  "NEXT_PUBLIC_ENABLE_MT09_CHAT_SPONSORSHIP",
] as const;

export type ProfessionalFeatureFlagName = typeof professionalFeatureFlagNames[number];

export type ProfessionalFeatureFlags = {
  careContexts: boolean;
  relationships: boolean;
  patientReader: boolean;
  documents: boolean;
  appointments: boolean;
  chat: boolean;
  laborEvents: boolean;
  notifications: boolean;
  notificationPreferences: boolean;
  entitlements: boolean;
  chatSponsorship: boolean;
};

export type ProfessionalFeatureFlagIssue = {
  code: "INVALID_VALUE" | "MISSING_DEPENDENCY";
  flag: ProfessionalFeatureFlagName;
  dependency?: ProfessionalFeatureFlagName;
  message: string;
};

type FlagEnvironment = Partial<Record<ProfessionalFeatureFlagName, string | undefined>>;

const bindings: ReadonlyArray<{
  flag: ProfessionalFeatureFlagName;
  key: keyof ProfessionalFeatureFlags;
}> = [
  { flag: "NEXT_PUBLIC_ENABLE_MT01_CARE_CONTEXTS", key: "careContexts" },
  { flag: "NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS", key: "relationships" },
  { flag: "NEXT_PUBLIC_ENABLE_MT03_PROFESSIONAL_PATIENTS", key: "patientReader" },
  { flag: "NEXT_PUBLIC_ENABLE_MT04_DOCUMENT_SHARES", key: "documents" },
  { flag: "NEXT_PUBLIC_ENABLE_MT05_APPOINTMENTS", key: "appointments" },
  { flag: "NEXT_PUBLIC_ENABLE_MT06_CARE_CHAT", key: "chat" },
  { flag: "NEXT_PUBLIC_ENABLE_MT07_LABOR_EVENTS", key: "laborEvents" },
  { flag: "NEXT_PUBLIC_ENABLE_MT08_NOTIFICATIONS", key: "notifications" },
  { flag: "NEXT_PUBLIC_ENABLE_MT08_NOTIFICATION_PREFERENCES", key: "notificationPreferences" },
  { flag: "NEXT_PUBLIC_ENABLE_MT09_ENTITLEMENTS", key: "entitlements" },
  { flag: "NEXT_PUBLIC_ENABLE_MT09_CHAT_SPONSORSHIP", key: "chatSponsorship" },
];

const dependencies: ReadonlyArray<{
  flag: ProfessionalFeatureFlagName;
  dependency: ProfessionalFeatureFlagName;
}> = [
  ...professionalFeatureFlagNames.slice(1).map((flag) => ({
    flag,
    dependency: "NEXT_PUBLIC_ENABLE_MT01_CARE_CONTEXTS" as const,
  })),
  {
    flag: "NEXT_PUBLIC_ENABLE_MT04_DOCUMENT_SHARES",
    dependency: "NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS",
  },
  {
    flag: "NEXT_PUBLIC_ENABLE_MT06_CARE_CHAT",
    dependency: "NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS",
  },
  {
    flag: "NEXT_PUBLIC_ENABLE_MT08_NOTIFICATION_PREFERENCES",
    dependency: "NEXT_PUBLIC_ENABLE_MT08_NOTIFICATIONS",
  },
  {
    flag: "NEXT_PUBLIC_ENABLE_MT09_CHAT_SPONSORSHIP",
    dependency: "NEXT_PUBLIC_ENABLE_MT09_ENTITLEMENTS",
  },
];

export function resolveProfessionalFeatureFlags(environment?: FlagEnvironment) {
  const issues: ProfessionalFeatureFlagIssue[] = [];
  const enabled = new Map<ProfessionalFeatureFlagName, boolean>();

  for (const flag of professionalFeatureFlagNames) {
    const value = environment ? environment[flag] : process.env[flag];
    if (value !== undefined && value !== "" && value !== "true" && value !== "false") {
      issues.push({
        code: "INVALID_VALUE",
        flag,
        message: `${flag} deve ser true ou false.`,
      });
    }
    enabled.set(flag, value === "true");
  }

  for (const requirement of dependencies) {
    if (enabled.get(requirement.flag) && !enabled.get(requirement.dependency)) {
      issues.push({
        code: "MISSING_DEPENDENCY",
        flag: requirement.flag,
        dependency: requirement.dependency,
        message: `${requirement.flag} exige ${requirement.dependency}.`,
      });
    }
  }

  const flags = Object.fromEntries(
    bindings.map(({ flag, key }) => [key, enabled.get(flag) === true]),
  ) as ProfessionalFeatureFlags;

  return { flags, issues };
}

export function professionalPortalMode(flags: ProfessionalFeatureFlags) {
  return flags.careContexts ? "contextual" as const : "legacy" as const;
}
