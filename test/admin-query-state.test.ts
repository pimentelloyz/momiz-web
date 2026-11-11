import assert from "node:assert/strict";
import test from "node:test";
import { AdminApiError } from "../app/admin/ui/admin-api-client.ts";
import { runAdminQuery } from "../app/admin/ui/admin-query-state.ts";

test("localized admin query keeps a partial failure distinct from zero data and retries safely", async () => {
  const failure = new AdminApiError({
    message: "Métricas indisponíveis.",
    code: "CARE_METRICS_UNAVAILABLE",
    requestId: "req-metrics-retry",
    status: 503,
  });
  let attempts = 0;
  const query = async () => {
    attempts += 1;
    if (attempts === 1) throw failure;
    return { active: 4, openReports: 1 };
  };

  const failed = await runAdminQuery(query);
  assert.deepEqual(failed, { phase: "error", error: failure });
  assert.equal("data" in failed, false);
  assert.equal(failed.phase, "error");
  if (failed.phase !== "error") assert.fail("A primeira consulta deveria falhar.");
  assert.ok(failed.error instanceof AdminApiError);
  assert.equal(failed.error.requestId, "req-metrics-retry");

  const retried = await runAdminQuery(query);
  assert.deepEqual(retried, { phase: "ready", data: { active: 4, openReports: 1 } });
  assert.equal(attempts, 2);
});

test("localized admin query distinguishes a successful empty response", async () => {
  const result = await runAdminQuery(
    async () => ({ active: 0, openReports: 0 }),
    (metrics) => Object.values(metrics).every((value) => value === 0),
  );
  assert.deepEqual(result, { phase: "empty", data: { active: 0, openReports: 0 } });
});
