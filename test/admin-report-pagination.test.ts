import assert from "node:assert/strict";
import test from "node:test";
import { mergeAdminReportPages, readAdminReportPage } from "../app/admin/ui/admin-report-pagination.ts";

test("report pagination prefers items and preserves the opaque continuation", () => {
  const page = readAdminReportPage<{ id: string }>({
    items: [{ id: "current" }],
    reports: [{ id: "legacy" }],
    nextCursor: "opaque-report-cursor",
  });
  assert.deepEqual(page.items, [{ id: "current" }]);
  assert.equal(page.nextCursor, "opaque-report-cursor");
});

test("report pagination temporarily accepts the legacy reports alias", () => {
  assert.deepEqual(readAdminReportPage<{ id: string }>({ reports: [{ id: "legacy" }] }), {
    items: [{ id: "legacy" }],
    nextCursor: null,
  });
});

test("report pages append without duplicate ids and refresh repeated entries", () => {
  assert.deepEqual(mergeAdminReportPages(
    [{ id: "one", status: "OPEN" }, { id: "two", status: "OPEN" }],
    [{ id: "two", status: "RESOLVED" }, { id: "three", status: "OPEN" }],
  ), [
    { id: "one", status: "OPEN" },
    { id: "two", status: "RESOLVED" },
    { id: "three", status: "OPEN" },
  ]);
});

test("report pagination rejects malformed payloads and cursors", () => {
  assert.throws(() => readAdminReportPage(null), /Resposta inválida/);
  assert.throws(() => readAdminReportPage({ items: [], nextCursor: 42 }), /Resposta inválida/);
});
