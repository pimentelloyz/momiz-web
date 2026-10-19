import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEventDeepLink,
  buildInviteDeepLink,
  normalizeEventId,
} from "../lib/deep-links.ts";

const eventId = "550e8400-e29b-41d4-a716-446655440000";

test("normalizeEventId accepts and normalizes a UUID", () => {
  assert.equal(
    normalizeEventId(`  ${eventId.toUpperCase()}  `),
    eventId,
  );
});

test("normalizeEventId rejects malformed or unsafe values", () => {
  assert.equal(normalizeEventId("event-123"), null);
  assert.equal(normalizeEventId(`${eventId}/gifts`), null);
  assert.equal(normalizeEventId(`${eventId}?guest=private`), null);
  assert.equal(normalizeEventId("00000000-0000-0000-0000-000000000000"), null);
});

test("buildEventDeepLink only creates URLs for valid event IDs", () => {
  assert.equal(buildEventDeepLink(eventId), `momiz://events/${eventId}`);
  assert.equal(buildEventDeepLink("not-an-event-id"), null);
});

test("buildInviteDeepLink encodes path and query values", () => {
  assert.equal(
    buildInviteDeepLink("chá/2026", "guest + 1"),
    "momiz://convite/ch%C3%A1%2F2026?guest=guest%20%2B%201",
  );
});
