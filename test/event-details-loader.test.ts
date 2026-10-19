import assert from "node:assert/strict";
import test from "node:test";
import {
  loadEventDetails,
  type EventDetailsLoadFailure,
} from "../lib/event-details-loader.ts";

const details = {
  event: {
    title: "Chá da família",
    eventDateTime: "2026-10-20T18:00:00.000Z",
  },
};

function response(body: unknown, status = 200) {
  return new Response(body === undefined ? undefined : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("loads details and safely encodes route parameters", async () => {
  let requestedUrl = "";
  const fetchImpl = (async (url: string | URL | Request) => {
    requestedUrl = String(url);
    return response(details);
  }) as typeof fetch;

  const result = await loadEventDetails("festa/2026", "guest + 1", {
    apiBaseUrl: "https://api.example.test",
    fetchImpl,
  });

  assert.deepEqual(result, { ok: true, data: details });
  assert.equal(
    requestedUrl,
    "https://api.example.test/api/events/by-slug/festa%2F2026/details?guestId=guest%20%2B%201",
  );
});

for (const [status, kind] of [
  [404, "not_found"],
  [429, "rate_limited"],
  [503, "upstream"],
] as const) {
  test(`maps HTTP ${status} to ${kind}`, async () => {
    const observed: EventDetailsLoadFailure[] = [];
    const result = await loadEventDetails("private-slug", "private-guest", {
      apiBaseUrl: "https://api.example.test",
      fetchImpl: (async () => response(undefined, status)) as typeof fetch,
      onFailure: (failure) => observed.push(failure),
    });

    assert.deepEqual(result, { ok: false, error: { kind, status } });
    assert.deepEqual(observed, [{ kind, status }]);
    assert.doesNotMatch(JSON.stringify(observed), /private/);
  });
}

test("distinguishes network and invalid response failures", async () => {
  const network = await loadEventDetails("slug", undefined, {
    apiBaseUrl: "https://api.example.test",
    fetchImpl: (async () => {
      throw new Error("connection failed");
    }) as typeof fetch,
  });
  const invalid = await loadEventDetails("slug", undefined, {
    apiBaseUrl: "https://api.example.test",
    fetchImpl: (async () => response({ unexpected: true })) as typeof fetch,
  });

  assert.deepEqual(network, { ok: false, error: { kind: "network" } });
  assert.deepEqual(invalid, {
    ok: false,
    error: { kind: "invalid_response", status: 200 },
  });
});
