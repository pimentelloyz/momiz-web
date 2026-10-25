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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const relativePath = path.join("/");
  if (!isAllowedProfessionalCarePath(relativePath)) {
    return Response.json({ message: "Rota profissional inválida." }, { status: 404 });
  }

  const upstream = await professionalApiFetch(
    `/api/care/${relativePath}${request.nextUrl.search}`,
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
