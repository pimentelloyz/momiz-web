import { NextRequest } from "next/server";
import { adminApiFetch, clearAdminSession } from "../../../../../lib/admin/admin-session";

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const allowed = [
  new RegExp("^users$", "i"),
  new RegExp(`^users/${uuid}/access$`, "i"),
  new RegExp(`^users/${uuid}/demos$`, "i"),
  new RegExp(`^users/${uuid}/demos/${uuid}$`, "i"),
  new RegExp(`^users/${uuid}/demos/${uuid}/revoke$`, "i"),
  new RegExp("^access/package-policies/current$", "i"),
  new RegExp("^access/package-policies/history$", "i"),
  new RegExp("^access/package-policies/drafts$", "i"),
  new RegExp(`^access/package-policies/drafts/${uuid}$`, "i"),
  new RegExp(`^access/package-policies/drafts/${uuid}/validate$`, "i"),
  new RegExp(`^access/package-policies/drafts/${uuid}/publish$`, "i"),
  new RegExp(`^access/package-policies/${uuid}$`, "i"),
  new RegExp(`^access/package-policies/${uuid}/diff$`, "i"),
  new RegExp(`^access/package-policies/${uuid}/impact-preview$`, "i"),
  new RegExp(`^access/package-policies/${uuid}/clone$`, "i"),
  new RegExp("^care/profiles$", "i"),
  new RegExp(`^care/profiles/${uuid}/review$`, "i"),
  new RegExp(`^care/profiles/${uuid}/credentials/${uuid}/download-url$`, "i"),
  new RegExp("^care/relationships$", "i"),
  new RegExp("^care/audit-logs$", "i"),
];

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function forward(request: NextRequest, context: RouteContext<"/admin/api/access/[...path]">) {
  const { path } = await context.params;
  const relativePath = path.join("/");
  if (!allowed.some((pattern) => pattern.test(relativePath))) {
    return Response.json({ message: "Rota administrativa inválida." }, { status: 404 });
  }
  if (request.method !== "GET" && !sameOrigin(request)) {
    return Response.json({ message: "Origem inválida." }, { status: 403 });
  }

  const query = request.nextUrl.search;
  const body = request.method === "GET" ? undefined : await request.text();
  const upstream = await adminApiFetch(`/api/admin/${relativePath}${query}`, {
    method: request.method,
    body: body || undefined,
  });
  const responseBody = await upstream.text();
  if (upstream.status === 403) {
    const payload = (() => {
      try {
        return JSON.parse(responseBody) as {
          code?: string;
          error?: { code?: string };
        };
      } catch {
        return null;
      }
    })();
    if (payload?.code === "MFA_REQUIRED" || payload?.error?.code === "MFA_REQUIRED") {
      await clearAdminSession();
      return Response.json(
        {
          code: "MFA_REQUIRED",
          message: "Entre novamente e confirme o segundo fator.",
        },
        { status: 401 },
      );
    }
  }
  return new Response(responseBody || null, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
