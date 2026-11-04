import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const startedAt = new Date();
const outputArg = process.argv.indexOf("--output");
const outputPath = resolve(outputArg >= 0 ? process.argv[outputArg + 1] : "artifacts/runbook-game-day-report.json");
const checks = [];

function run(name, command, args, env = {}) {
  const started = Date.now();
  try {
    execFileSync(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: "pipe",
      encoding: "utf8",
    });
    checks.push({ name, ok: true, durationMs: Date.now() - started });
  } catch {
    checks.push({ name, ok: false, durationMs: Date.now() - started });
  }
}

run("runbook-validator", process.execPath, ["scripts/validate-runbooks.mjs"]);
run("release-preflight-local", process.execPath, ["scripts/release-preflight.mjs"], {
  SMOKE_BASE_URL: "http://127.0.0.1:3021",
  SMOKE_ENVIRONMENT: "preview",
  SMOKE_EXPECTED_SHA: "0000000",
});
run("openapi-stale-gate", "npm", ["run", "openapi:check"]);

const rollbackStarted = Date.now();
const rollbackRunbook = readFileSync(resolve("docs/operations/release-gate.md"), "utf8");
checks.push({
  name: "rollback-tabletop",
  ok: ["Rollback é uma ação remota e exige autorização operacional", "SHA anterior validado", "execute preflight, smoke público e autenticado"]
    .every((marker) => rollbackRunbook.includes(marker)),
  durationMs: Date.now() - rollbackStarted,
});

for (const [name, file] of [
  ["apple-manifest-json", "public/.well-known/apple-app-site-association"],
  ["android-manifest-json", "public/.well-known/assetlinks.json"],
]) {
  const started = Date.now();
  try {
    JSON.parse(readFileSync(resolve(file), "utf8"));
    checks.push({ name, ok: true, durationMs: Date.now() - started });
  } catch {
    checks.push({ name, ok: false, durationMs: Date.now() - started });
  }
}

let sourceSha = "unknown";
try {
  sourceSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {}

const report = {
  schemaVersion: 1,
  mode: "local-dry-run-no-remote-mutation",
  sourceSha,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  ok: checks.every((check) => check.ok),
  checks,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
if (!report.ok) process.exitCode = 1;

