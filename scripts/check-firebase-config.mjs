import { assertFirebaseClientConfigForPromotion } from "../lib/firebase-client-config.ts";

try {
  assertFirebaseClientConfigForPromotion({
    ...process.env,
    MOMIZ_AUTH_CONFIG_REQUIRED: "true",
  });
  process.stdout.write("Firebase authentication configuration preflight passed.\n");
} catch (error) {
  const message = error instanceof Error ? error.message : "Firebase authentication configuration preflight failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
