import assert from "node:assert/strict";
import test from "node:test";
import { mergeAdminProfilePages, readAdminProfilePage } from "../app/admin/ui/admin-profile-pagination.ts";

test("profile pagination prefers items and preserves the opaque continuation", () => {
  const page = readAdminProfilePage<{ id: string }>({
    items: [{ id: "current" }],
    profiles: [{ id: "legacy" }],
    nextCursor: "opaque-value-not-for-ui",
  });
  assert.deepEqual(page.items, [{ id: "current" }]);
  assert.equal(page.nextCursor, "opaque-value-not-for-ui");
});

test("profile pagination temporarily accepts the legacy profiles alias", () => {
  assert.deepEqual(readAdminProfilePage<{ id: string }>({ profiles: [{ id: "legacy" }] }), {
    items: [{ id: "legacy" }],
    nextCursor: null,
  });
});

test("profile pages append without duplicate ids and refresh repeated entries", () => {
  const merged = mergeAdminProfilePages(
    [{ id: "one", value: 1 }, { id: "two", value: 1 }],
    [{ id: "two", value: 2 }, { id: "three", value: 1 }],
  );
  assert.deepEqual(merged, [
    { id: "one", value: 1 },
    { id: "two", value: 2 },
    { id: "three", value: 1 },
  ]);
});

test("profile pagination rejects malformed payloads and cursors", () => {
  assert.throws(() => readAdminProfilePage(null), /Resposta inválida/);
  assert.throws(() => readAdminProfilePage({ items: [], nextCursor: 42 }), /Resposta inválida/);
});
