export type SyntheticAccount = {
  email: string;
  password: string;
  surface: "admin" | "profissional";
};

export function readSyntheticAccount(env: Record<string, string | undefined>): SyntheticAccount | null {
  const email = env.SMOKE_AUTH_EMAIL?.trim();
  const password = env.SMOKE_AUTH_PASSWORD;
  if (!email || !password) return null;
  return {
    email,
    password,
    surface: env.SMOKE_AUTH_SURFACE === "admin" ? "admin" : "profissional",
  };
}
