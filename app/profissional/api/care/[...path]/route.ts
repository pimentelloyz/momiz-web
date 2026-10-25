import { NextRequest } from "next/server";
import { isAllowedProfessionalCarePath } from "../../../../../lib/professional/care-proxy-policy";
import {
  clearProfessionalSession,
  professionalApiFetch,
} from "../../../../../lib/professional/professional-session";

function readErrorCode(body: string) {
  try {
    const value = JSON.parse(body) as { code?: string; error?: { code?: string } };
    return value.code || value.error?.code || "";
  } catch {
    return "";
  }
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function forward(
  request: NextRequest,
  context: RouteContext<"/profissional/api/care/[...path]">,
) {
  const { path } = await context.params;
  const relativePath = path.join("/");
  if (!isAllowedProfessionalCarePath(relativePath, request.method)) {
    return Response.json({ message: "Rota profissional inválida." }, { status: 404 });
  }
  if (request.method !== "GET" && !sameOrigin(request)) {
    return Response.json({ message: "Origem inválida." }, { status: 403 });
  }

  const body = request.method === "GET" ? undefined : await request.text();
  const upstream = await professionalApiFetch(
    `/api/care/${relativePath}${request.nextUrl.search}`,
    { method: request.method, body: body || undefined },
  );
  const responseBody = await upstream.text();
  if (upstream.status === 403 && readErrorCode(responseBody) === "MFA_REQUIRED") {
    await clearProfessionalSession();
    return Response.json(
      { code: "MFA_REQUIRED", message: "Entre novamente e confirme o segundo fator." },
      { status: 401 },
    );
  }

  const headers = new Headers();
  headers.set("content-type", upstream.headers.get("content-type") || "application/json");
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("content-disposition", disposition);
  return new Response(responseBody || null, { status: upstream.status, headers });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
