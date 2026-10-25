import { NextRequest } from "next/server";
import { adminApiFetch, clearAdminSession, saveAdminSession } from "../../../../lib/admin/admin-session";
import { API_BASE_URL } from "../../../../lib/site-config";

type FirebaseSignIn = { idToken?: string; error?: { message?: string } };
type ExchangeResponse = { accessToken?: string; refreshToken?: string };
type SessionRequest = {
  email?: string;
  password?: string;
  idToken?: string;
};

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return Response.json({ message: "Origem inválida." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as SessionRequest | null;
  const email = body?.email?.trim();
  const password = body?.password;
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  let idToken = body?.idToken?.trim();

  if (!idToken) {
    if (!email || !password) return Response.json({ message: "Informe e-mail e senha." }, { status: 400 });
    if (!apiKey) return Response.json({ message: "Autenticação administrativa não configurada." }, { status: 503 });

    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        cache: "no-store",
      },
    );
    const firebase = (await firebaseResponse.json()) as FirebaseSignIn;
    if (!firebaseResponse.ok || !firebase.idToken) {
      return Response.json({ message: "E-mail ou senha inválidos." }, { status: 401 });
    }
    idToken = firebase.idToken;
  }

  const exchangeResponse = await fetch(`${API_BASE_URL}/api/auth/firebase/exchange`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });
  const exchange = (await exchangeResponse.json().catch(() => ({}))) as ExchangeResponse;
  if (!exchangeResponse.ok || !exchange.accessToken || !exchange.refreshToken) {
    return Response.json({ message: "Não foi possível iniciar a sessão administrativa." }, { status: 401 });
  }

  await saveAdminSession({ accessToken: exchange.accessToken, refreshToken: exchange.refreshToken });
  const authorization = await adminApiFetch("/api/admin/users?pageSize=1");
  if (!authorization.ok) {
    await clearAdminSession();
    return Response.json(
      { message: authorization.status === 403 ? "Esta conta não possui acesso administrativo." : "Não foi possível validar o acesso." },
      { status: authorization.status === 403 ? 403 : 401 },
    );
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return Response.json({ message: "Origem inválida." }, { status: 403 });
  await clearAdminSession();
  return Response.json({ ok: true });
}
