import "server-only";

import { cookies } from "next/headers";
import { API_BASE_URL } from "../site-config";

const accessCookie = "momiz_professional_access";
const refreshCookie = "momiz_professional_refresh";
const cookiePath = "/profissional";

type TokenPair = { accessToken: string; refreshToken: string };

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: cookiePath,
    maxAge,
  };
}

export async function saveProfessionalSession(tokens: TokenPair) {
  const store = await cookies();
  store.set(accessCookie, tokens.accessToken, cookieOptions(15 * 60));
  store.set(refreshCookie, tokens.refreshToken, cookieOptions(30 * 24 * 60 * 60));
}

export async function clearProfessionalSession() {
  const store = await cookies();
  store.set(accessCookie, "", cookieOptions(0));
  store.set(refreshCookie, "", cookieOptions(0));
}

export async function hasProfessionalSession() {
  return Boolean((await cookies()).get(refreshCookie)?.value);
}

async function refreshProfessionalSession(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get(refreshCookie)?.value;
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) {
    await clearProfessionalSession();
    return null;
  }

  const tokens = (await response.json()) as TokenPair;
  await saveProfessionalSession(tokens);
  return tokens.accessToken;
}

async function requestWithToken(path: string, init: RequestInit, token: string) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export async function professionalApiFetch(path: string, init: RequestInit = {}) {
  const store = await cookies();
  let token = store.get(accessCookie)?.value;
  if (!token) token = await refreshProfessionalSession() ?? undefined;
  if (!token) return new Response(null, { status: 401 });

  let response = await requestWithToken(path, init, token);
  if (response.status !== 401) return response;

  token = await refreshProfessionalSession() ?? undefined;
  if (!token) return new Response(null, { status: 401 });
  response = await requestWithToken(path, init, token);
  if (response.status === 401) await clearProfessionalSession();
  return response;
}
