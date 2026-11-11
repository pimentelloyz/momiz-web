import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const OPT_IN = "RUN_SYNTHETIC_CREDENTIAL_PREVIEW_SMOKE";

export function validatePreviewCredentialEnvironment(env) {
  const failures = [];
  if (env.SMOKE_PREVIEW_OPT_IN !== OPT_IN) failures.push("SMOKE_PREVIEW_OPT_IN");
  if (env.SMOKE_ENVIRONMENT !== "preview") failures.push("SMOKE_ENVIRONMENT");
  if (env.SMOKE_AUTH_SURFACE !== "admin") failures.push("SMOKE_AUTH_SURFACE");
  if (!env.SMOKE_AUTH_EMAIL?.trim()) failures.push("SMOKE_AUTH_EMAIL");
  if (!env.SMOKE_AUTH_PASSWORD) failures.push("SMOKE_AUTH_PASSWORD");
  if (!env.SMOKE_CREDENTIAL_TEST_MARKER?.trim()) failures.push("SMOKE_CREDENTIAL_TEST_MARKER");

  try {
    const url = new URL(env.SMOKE_BASE_URL || "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) failures.push("SMOKE_BASE_URL");
  } catch {
    failures.push("SMOKE_BASE_URL");
  }

  return [...new Set(failures)];
}

export function runPreviewCredentialSmoke(env, args = process.argv.slice(2)) {
  const failures = validatePreviewCredentialEnvironment(env);
  if (failures.length) {
    process.stderr.write(`Preview credential preflight failed: ${failures.join(", ")}.\n`);
    return 1;
  }
  process.stdout.write("Preview credential preflight passed for the explicit synthetic scenario.\n");
  if (args.includes("--check")) return 0;

  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(executable, ["playwright", "test", "--config=playwright.credential-preview.config.ts"], {
    env,
    stdio: "inherit",
  });
  return result.status ?? 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  process.exitCode = runPreviewCredentialSmoke(process.env);
}
