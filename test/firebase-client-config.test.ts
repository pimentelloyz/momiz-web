import assert from "node:assert/strict";
import test from "node:test";
import {
  assertFirebaseClientConfigForPromotion,
  firebaseConfigIsRequired,
  resolveFirebaseClientConfig,
} from "../lib/firebase-client-config.ts";

const configured = {
  FIREBASE_WEB_API_KEY: `AIza${"A".repeat(35)}`,
  FIREBASE_PROJECT_ID: "momiz-production",
  FIREBASE_AUTH_DOMAIN: "momiz-production.firebaseapp.com",
};

test("resolves a complete Firebase client configuration without changing its values", () => {
  assert.deepEqual(resolveFirebaseClientConfig(configured), {
    available: true,
    config: {
      apiKey: configured.FIREBASE_WEB_API_KEY,
      projectId: configured.FIREBASE_PROJECT_ID,
      authDomain: configured.FIREBASE_AUTH_DOMAIN,
    },
  });
});

test("reports missing and malformed configuration without returning partial values", () => {
  assert.deepEqual(resolveFirebaseClientConfig({}), {
    available: false,
    issue: "missing",
    fields: ["FIREBASE_WEB_API_KEY", "FIREBASE_PROJECT_ID", "FIREBASE_AUTH_DOMAIN"],
  });
  assert.deepEqual(
    resolveFirebaseClientConfig({
      FIREBASE_WEB_API_KEY: "example-key",
      FIREBASE_PROJECT_ID: "INVALID_PROJECT",
      FIREBASE_AUTH_DOMAIN: "https://example.com/path",
    }),
    {
      available: false,
      issue: "invalid",
      fields: ["FIREBASE_WEB_API_KEY", "FIREBASE_PROJECT_ID", "FIREBASE_AUTH_DOMAIN"],
    },
  );
});

test("requires configuration for Vercel promotions or an explicit preflight", () => {
  assert.equal(firebaseConfigIsRequired({}), false);
  assert.equal(firebaseConfigIsRequired({ VERCEL_ENV: "development" }), false);
  assert.equal(firebaseConfigIsRequired({ VERCEL_ENV: "preview" }), true);
  assert.equal(firebaseConfigIsRequired({ VERCEL_ENV: "production" }), true);
  assert.equal(firebaseConfigIsRequired({ MOMIZ_AUTH_CONFIG_REQUIRED: "true" }), true);
  assert.doesNotThrow(() => assertFirebaseClientConfigForPromotion({ VERCEL_ENV: "production", ...configured }));
  assert.throws(
    () => assertFirebaseClientConfigForPromotion({ VERCEL_ENV: "production" }),
    /Promotion blocked/,
  );
});
