import { NextRequest } from "next/server";
import {
  clearProfessionalSession,
  professionalApiFetch,
  saveProfessionalSession,
} from "../../../../lib/professional/professional-session";
import { API_BASE_URL } from "../../../../lib/site-config";

type ExchangeResponse = { accessToken?: string; refreshToken?: string };
type SessionRequest = { idToken?: string };

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function errorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const value = payload as { code?: string; error?: { code?: string } };
  return value.code || value.error?.code || "";
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return Response.json({ message: "Origem inválida." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as SessionRequest | null;
  const idToken = body?.idToken?.trim();
  if (!idToken) return Response.json({ message: "Autenticação Firebase obrigatória." }, { status: 400 });

  const exchangeResponse = await fetch(`${API_BASE_URL}/api/auth/firebase/exchange`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });
  const exchange = (await exchangeResponse.json().catch(() => ({}))) as ExchangeResponse;
  if (!exchangeResponse.ok || !exchange.accessToken || !exchange.refreshToken) {
    return Response.json({ message: "Não foi possível iniciar a sessão profissional." }, { status: 401 });
  }

  await saveProfessionalSession({ accessToken: exchange.accessToken, refreshToken: exchange.refreshToken });
  const authorization = await professionalApiFetch("/api/care/professional/profile");
  const payload = await authorization.clone().json().catch(() => null) as { profile?: unknown } | null;
  const missingProfile = authorization.ok && payload?.profile === null;
  if (!authorization.ok || !payload?.profile) {
    await clearProfessionalSession();
    if (errorCode(payload) === "MFA_REQUIRED") {
      return Response.json(
        { code: "MFA_REQUIRED", message: "Confirme o segundo fator para acessar o portal profissional." },
        { status: 403 },
      );
    }
    return Response.json(
      {
        code: missingProfile ? "PROFESSIONAL_PROFILE_REQUIRED" : errorCode(payload),
        message: missingProfile
          ? "Conclua seu cadastro profissional no aplicativo Momiz antes de acessar o portal."
          : "Não foi possível validar o acesso profissional.",
      },
      { status: authorization.status === 403 || missingProfile ? 403 : 401 },
    );
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return Response.json({ message: "Origem inválida." }, { status: 403 });
  await clearProfessionalSession();
  return Response.json({ ok: true });
}
