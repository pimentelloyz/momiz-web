const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;

export function safeRequestId(value: unknown) {
  return typeof value === "string" && requestIdPattern.test(value) ? value : null;
}

export function requestCorrelationHeaders(requestId: unknown) {
  const headers = new Headers();
  const safe = safeRequestId(requestId);
  if (safe) headers.set("x-request-id", safe);
  return headers;
}

export function correlatedResponseHeaders(
  upstream: Response,
  incomingRequestId?: unknown,
  initial?: HeadersInit,
) {
  const headers = new Headers(initial);
  const requestId = safeRequestId(upstream.headers.get("x-request-id")) ?? safeRequestId(incomingRequestId);
  if (requestId) headers.set("x-request-id", requestId);
  return headers;
}
