import assert from "node:assert/strict";
import test from "node:test";
import { validatePreviewCredentialEnvironment } from "../scripts/preview-credential-smoke.mjs";

const valid = {
  SMOKE_PREVIEW_OPT_IN: "RUN_SYNTHETIC_CREDENTIAL_PREVIEW_SMOKE",
  SMOKE_ENVIRONMENT: "preview",
  SMOKE_BASE_URL: "https://preview.example.test/",
  SMOKE_AUTH_SURFACE: "admin",
  SMOKE_AUTH_EMAIL: "synthetic@example.test",
  SMOKE_AUTH_PASSWORD: "synthetic-secret",
  SMOKE_CREDENTIAL_TEST_MARKER: "SYNTHETIC-CREDENTIAL",
};

test("credential Preview preflight accepts only the explicit synthetic gate", () => {
  assert.deepEqual(validatePreviewCredentialEnvironment(valid), []);
});

test("credential Preview preflight fails closed before browser configuration", () => {
  const failures = validatePreviewCredentialEnvironment({
    ...valid,
    SMOKE_PREVIEW_OPT_IN: "yes",
    SMOKE_BASE_URL: "http://preview.example.test/path?token=secret",
    SMOKE_AUTH_PASSWORD: "",
  });
  assert.deepEqual(failures, ["SMOKE_PREVIEW_OPT_IN", "SMOKE_AUTH_PASSWORD", "SMOKE_BASE_URL"]);
  assert.doesNotMatch(failures.join(" "), /synthetic-secret|token=secret/);
});

test("credential Preview preflight rejects local, production and non-admin targets", () => {
  assert.deepEqual(validatePreviewCredentialEnvironment({
    ...valid,
    SMOKE_ENVIRONMENT: "production",
    SMOKE_BASE_URL: "http://127.0.0.1:3121/",
    SMOKE_AUTH_SURFACE: "profissional",
  }), ["SMOKE_ENVIRONMENT", "SMOKE_AUTH_SURFACE", "SMOKE_BASE_URL"]);
});
