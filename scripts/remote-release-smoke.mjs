import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const baseUrl = new URL(process.env.SMOKE_BASE_URL);
const reportPath = resolve(process.env.SMOKE_REPORT_PATH || 'artifacts/release-smoke-report.json');
const bypassToken = process.env.SMOKE_BYPASS_TOKEN;
const expectedSha = process.env.SMOKE_EXPECTED_SHA || null;
const environment = process.env.SMOKE_ENVIRONMENT || 'unknown';
const startedAt = new Date().toISOString();
const checks = [];

const headers = { accept: 'text/html,application/json' };
if (bypassToken) headers['x-vercel-protection-bypass'] = bypassToken;

function record(path, response, ok, detail) {
  checks.push({
    path,
    status: response.status,
    ok,
    detail,
    requestId: response.headers.get('x-request-id'),
    platformRequestId: response.headers.get('x-vercel-id'),
  });
}

async function checkText(path, expected, forbidden = []) {
  const response = await fetch(new URL(path, baseUrl), { headers, redirect: 'follow' });
  const body = await response.text();
  const missing = expected.filter((value) => !body.includes(value));
  const present = forbidden.filter((value) => body.includes(value));
  const ok = response.ok && missing.length === 0 && present.length === 0;
  record(path, response, ok, ok ? 'ok' : `missing=${missing.length}; forbidden=${present.length}`);
}

async function checkJson(path, validate) {
  const response = await fetch(new URL(path, baseUrl), { headers, redirect: 'follow' });
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const ok = response.ok && validate(payload);
  record(path, response, ok, ok ? 'ok' : 'invalid response or manifest');
}

try {
  await checkText('/', ['Seu chá perto de quem importa']);
  await checkJson('/.well-known/apple-app-site-association', (payload) =>
    Array.isArray(payload?.applinks?.details) && payload.applinks.details.some((detail) =>
      detail.appIDs?.includes('2B3NAR3YX7.com.lifeados.momiz') &&
      detail.components?.some((component) => component['/'] === '/care/invite/*'),
    ),
  );
  await checkJson('/.well-known/assetlinks.json', (payload) =>
    Array.isArray(payload) && payload.some((entry) =>
      entry?.target?.package_name === 'com.lifeados.momiz.app' &&
      entry.target.sha256_cert_fingerprints?.length > 0,
    ),
  );
  await checkText('/termos', ['Termos de uso']);
  await checkText('/health-professional-terms', ['Termos de uso para profissionais de saúde']);
  await checkText('/admin/login', ['Acesso administrativo', 'Entrar com Google'], ['Login temporariamente indisponível']);
  await checkText('/profissional/login', ['Acesso profissional', 'Entrar com Google'], ['Login temporariamente indisponível']);
} catch (error) {
  checks.push({ path: 'transport', status: 0, ok: false, detail: error instanceof Error ? error.message : 'request failed', requestId: null, platformRequestId: null });
}

const report = {
  environment,
  deploymentUrl: baseUrl.origin,
  expectedSha,
  startedAt,
  finishedAt: new Date().toISOString(),
  ok: checks.length === 7 && checks.every((check) => check.ok),
  checks,
};
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 1;
