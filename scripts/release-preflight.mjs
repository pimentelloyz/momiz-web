const environment = process.env.SMOKE_ENVIRONMENT;
const rawBaseUrl = process.env.SMOKE_BASE_URL;
const expectedSha = process.env.SMOKE_EXPECTED_SHA;

const failures = [];
if (!['preview', 'production'].includes(environment || '')) failures.push('SMOKE_ENVIRONMENT');
if (!rawBaseUrl) failures.push('SMOKE_BASE_URL');
if (!expectedSha || !/^[a-f0-9]{7,40}$/i.test(expectedSha)) failures.push('SMOKE_EXPECTED_SHA');

if (rawBaseUrl) {
  try {
    const baseUrl = new URL(rawBaseUrl);
    const localHttp = baseUrl.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(baseUrl.hostname);
    if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash || baseUrl.pathname !== '/' || (baseUrl.protocol !== 'https:' && !localHttp)) {
      failures.push('SMOKE_BASE_URL');
    }
  } catch {
    failures.push('SMOKE_BASE_URL');
  }
}

if (failures.length) {
  process.stderr.write(`Release preflight failed: ${[...new Set(failures)].join(', ')}.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Release preflight passed for ${environment} at ${new URL(rawBaseUrl).origin} (${expectedSha.slice(0, 12)}).\n`);
}
