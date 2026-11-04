export type FirebaseClientConfig = {
  apiKey: string;
  projectId: string;
  authDomain: string;
};

export type FirebaseClientConfigResult =
  | { available: true; config: FirebaseClientConfig }
  | { available: false; issue: "missing" | "invalid"; fields: string[] };

type Environment = Record<string, string | undefined>;

const requiredFields = [
  "FIREBASE_WEB_API_KEY",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_AUTH_DOMAIN",
] as const;

function validApiKey(value: string) {
  return value.length >= 20 && /^[A-Za-z0-9_-]+$/.test(value) && !/^(change|replace|example|your)[-_]/i.test(value);
}

function validProjectId(value: string) {
  return /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value);
}

function validAuthDomain(value: string) {
  if (value !== value.toLowerCase() || value.includes("/") || value.includes(":")) return false;
  try {
    const url = new URL(`https://${value}`);
    return url.hostname === value && value.includes(".") && url.pathname === "/";
  } catch {
    return false;
  }
}

export function resolveFirebaseClientConfig(env: Environment): FirebaseClientConfigResult {
  const values = Object.fromEntries(
    requiredFields.map((field) => [field, env[field]?.trim() || ""]),
  ) as Record<(typeof requiredFields)[number], string>;
  const missing = requiredFields.filter((field) => !values[field]);
  if (missing.length) return { available: false, issue: "missing", fields: [...missing] };

  const invalid = [
    !validApiKey(values.FIREBASE_WEB_API_KEY) && "FIREBASE_WEB_API_KEY",
    !validProjectId(values.FIREBASE_PROJECT_ID) && "FIREBASE_PROJECT_ID",
    !validAuthDomain(values.FIREBASE_AUTH_DOMAIN) && "FIREBASE_AUTH_DOMAIN",
  ].filter((field): field is string => Boolean(field));
  if (invalid.length) return { available: false, issue: "invalid", fields: invalid };

  return {
    available: true,
    config: {
      apiKey: values.FIREBASE_WEB_API_KEY,
      projectId: values.FIREBASE_PROJECT_ID,
      authDomain: values.FIREBASE_AUTH_DOMAIN,
    },
  };
}

export function firebaseConfigIsRequired(env: Environment) {
  return env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "production" || env.MOMIZ_AUTH_CONFIG_REQUIRED === "true";
}

export function assertFirebaseClientConfigForPromotion(env: Environment) {
  if (!firebaseConfigIsRequired(env)) return;
  const result = resolveFirebaseClientConfig(env);
  if (!result.available) {
    throw new Error(
      `Firebase client configuration is ${result.issue}: ${result.fields.join(", ")}. Promotion blocked.`,
    );
  }
}
