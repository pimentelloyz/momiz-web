import assert from "node:assert/strict";
import test from "node:test";
import {
  AdminApiError,
  adminErrorMessage,
  isAdminSessionExpired,
  readAdminApiError,
} from "../app/admin/ui/admin-api-client.ts";

function errorResponse(status: number, payload: unknown, requestId?: string) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: requestId ? { "content-type": "application/json", "x-request-id": requestId } : { "content-type": "application/json" },
  });
}

test("admin error preserves the canonical envelope and formats an actionable request id", async () => {
  const error = await readAdminApiError(errorResponse(403, {
    message: "Ação não autorizada.",
    code: "ADMIN_ACTION_DENIED",
    requestId: "req-admin-403",
    detail: { email: "must-not-leak@example.com", token: "must-not-leak" },
  }));

  assert.ok(error instanceof AdminApiError);
  assert.equal(error.message, "Ação não autorizada.");
  assert.equal(error.code, "ADMIN_ACTION_DENIED");
  assert.equal(error.requestId, "req-admin-403");
  assert.equal(error.status, 403);
  assert.equal(adminErrorMessage(error), "Ação não autorizada. Identificador: req-admin-403.");
  assert.equal(JSON.stringify(error).includes("must-not-leak"), false);
});

test("admin error accepts a nested canonical envelope and correlation header", async () => {
  const error = await readAdminApiError(errorResponse(429, {
    error: { message: "Muitas tentativas.", code: "RATE_LIMITED" },
  }, "req-rate-limit"));

  assert.equal(error.message, "Muitas tentativas.");
  assert.equal(error.code, "RATE_LIMITED");
  assert.equal(error.requestId, "req-rate-limit");
  assert.equal(error.status, 429);
});

test("admin error falls back safely for invalid payloads without echoing the body", async () => {
  const secretBody = "Bearer secret-token-value user@example.com";
  const response = new Response(secretBody, { status: 503, headers: { "content-type": "text/plain" } });
  const error = await readAdminApiError(response, "Serviço temporariamente indisponível.");

  assert.equal(error.message, "Serviço temporariamente indisponível.");
  assert.equal(error.code, null);
  assert.equal(error.requestId, null);
  assert.equal(error.status, 503);
  assert.equal(adminErrorMessage(error).includes(secretBody), false);
});

test("admin error treats only HTTP 401 as an expired session", async () => {
  for (const status of [401, 403, 429, 500]) {
    const error = await readAdminApiError(errorResponse(status, { message: "Falha controlada." }));
    assert.equal(isAdminSessionExpired(error), status === 401);
  }
  assert.equal(isAdminSessionExpired(new Error("SESSION_EXPIRED")), false);
});
