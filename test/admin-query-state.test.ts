import assert from "node:assert/strict";
import test from "node:test";
import { AdminApiError } from "../app/admin/ui/admin-api-client.ts";
import { runAdminMutation, runAdminQuery } from "../app/admin/ui/admin-query-state.ts";

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

test("localized queues retry only the failed idempotent source", async () => {
  let profileReads = 0;
  let reportReads = 0;
  const readProfiles = async () => {
    profileReads += 1;
    if (profileReads === 1) throw new AdminApiError({
      message: "Fila indisponível.",
      code: "CARE_PROFILE_QUEUE_UNAVAILABLE",
      requestId: "req-profile-queue",
      status: 503,
    });
    return [{ id: "profile-1" }];
  };
  const readReports = async () => {
    reportReads += 1;
    return [{ id: "report-1" }];
  };

  const [profilesFailed, reportsReady] = await Promise.all([
    runAdminQuery(readProfiles),
    runAdminQuery(readReports),
  ]);
  assert.equal(profilesFailed.phase, "error");
  assert.equal(reportsReady.phase, "ready");

  const profilesRetried = await runAdminQuery(readProfiles);
  assert.equal(profilesRetried.phase, "ready");
  assert.equal(profileReads, 2);
  assert.equal(reportReads, 1);
});

test("pilot readiness retries independently and preserves the canonical error", async () => {
  let readinessReads = 0;
  let metricReads = 0;
  const readReadiness = async () => {
    readinessReads += 1;
    if (readinessReads === 1) throw new AdminApiError({
      message: "Prontidão indisponível.",
      code: "PILOT_READINESS_UNAVAILABLE",
      requestId: "req-readiness-retry",
      status: 503,
    });
    return { ready: false, gates: [{ key: "SECURITY_PENTEST" }] };
  };
  const readMetrics = async () => {
    metricReads += 1;
    return { active: 2 };
  };

  const [readinessFailed, metricsReady] = await Promise.all([
    runAdminQuery(readReadiness),
    runAdminQuery(readMetrics),
  ]);
  assert.equal(readinessFailed.phase, "error");
  if (readinessFailed.phase !== "error") assert.fail("A prontidão deveria falhar isoladamente.");
  assert.ok(readinessFailed.error instanceof AdminApiError);
  assert.equal(readinessFailed.error.requestId, "req-readiness-retry");
  assert.equal(metricsReady.phase, "ready");

  const readinessRetried = await runAdminQuery(readReadiness);
  assert.equal(readinessRetried.phase, "ready");
  assert.equal(readinessReads, 2);
  assert.equal(metricReads, 1);
});

test("independent admin mutations preserve one failure without blocking another success", async () => {
  const failure = new AdminApiError({
    message: "Revisão recusada.",
    code: "PROFESSIONAL_REVIEW_CONFLICT",
    requestId: "req-review-conflict",
    status: 409,
  });
  let reviewCalls = 0;
  let gateCalls = 0;

  const [review, gate] = await Promise.all([
    runAdminMutation(async () => { reviewCalls += 1; throw failure; }, "Perfil revisado."),
    runAdminMutation(async () => { gateCalls += 1; }, "Gate registrado."),
  ]);

  assert.equal(review.phase, "error");
  if (review.phase !== "error") assert.fail("A revisão deveria preservar a falha.");
  assert.equal(review.error, failure);
  assert.deepEqual(gate, { phase: "success", message: "Gate registrado." });
  assert.equal(reviewCalls, 1);
  assert.equal(gateCalls, 1);
});
