import assert from "node:assert/strict";
import test from "node:test";
import { AdminApiError } from "../app/admin/ui/admin-api-client.ts";
import { openEphemeralCredentialUrl, readCredentialDownload, safeEphemeralDownloadUrl } from "../app/admin/ui/admin-credential-download.ts";
import { runAdminMutation } from "../app/admin/ui/admin-query-state.ts";

test("credential download accepts only HTTPS or explicit local development URLs", () => {
  assert.equal(
    safeEphemeralDownloadUrl("https://storage.example.test/private/file?signature=secret"),
    "https://storage.example.test/private/file?signature=secret",
  );
  assert.equal(safeEphemeralDownloadUrl("http://localhost:9000/private/file"), "http://localhost:9000/private/file");
  assert.equal(safeEphemeralDownloadUrl("http://localhost:9000/private/file", false), null);
  assert.equal(safeEphemeralDownloadUrl("http://storage.example.test/private/file"), null);
  assert.equal(safeEphemeralDownloadUrl("javascript:alert('secret')"), null);
  assert.equal(safeEphemeralDownloadUrl({ url: "https://example.test" }), null);
});

test("invalid credential payload preserves correlation without leaking the URL", () => {
  const unsafeUrl = "javascript:alert('signed-secret')";
  assert.throws(
    () => readCredentialDownload({ downloadUrl: unsafeUrl, expiresAt: "2026-11-12T12:04:00.000Z", requestId: "req-credential-url" }, Date.parse("2026-11-12T12:00:00.000Z")),
    (error: unknown) => {
      assert.ok(error instanceof AdminApiError);
      assert.equal(error.code, "ADMIN_CREDENTIAL_DOWNLOAD_INVALID");
      assert.equal(error.requestId, "req-credential-url");
      assert.equal(error.status, 502);
      assert.equal(error.message.includes(unsafeUrl), false);
      assert.equal(JSON.stringify(error).includes("signed-secret"), false);
      return true;
    },
  );
});

test("credential download validates expiry and discards response extras", () => {
  const now = Date.parse("2026-11-12T12:00:00.000Z");
  assert.deepEqual(readCredentialDownload({
    downloadUrl: "https://storage.example.test/private/file?signature=secret",
    expiresAt: "2026-11-12T12:05:00.000Z",
    metadata: "must-not-survive",
  }, now), {
    downloadUrl: "https://storage.example.test/private/file?signature=secret",
    expiresAt: "2026-11-12T12:05:00.000Z",
  });
  assert.throws(() => readCredentialDownload({ downloadUrl: "https://storage.example.test/file", expiresAt: "2026-11-12T12:00:00.000Z" }, now), /temporário válido/);
  assert.throws(() => readCredentialDownload({ downloadUrl: "https://storage.example.test/file", expiresAt: "2026-11-12T12:05:00.001Z" }, now), /temporário válido/);
  assert.throws(() => readCredentialDownload({ downloadUrl: "http://storage.example.test/file", expiresAt: "2026-11-12T12:04:00.000Z" }, now), /temporário válido/);
});

test("credential opens immediately with isolated opener and no referrer", () => {
  let replacedWith: string | null = null;
  let openedWith: string[] = [];
  const appended: Array<{ name: string; content: string }> = [];
  const popup = {
    opener: { unsafe: true },
    location: { replace: (value: string) => { replacedWith = value; } },
    document: {
      head: { append: (element: { name: string; content: string }) => appended.push(element) },
      createElement: () => ({ name: "", content: "" }),
    },
  } as unknown as Window;
  openEphemeralCredentialUrl("https://storage.example.test/private/file", (url, target) => {
    openedWith = [url, target];
    return popup;
  });
  assert.deepEqual(openedWith, ["about:blank", "_blank"]);
  assert.equal(popup.opener, null);
  assert.deepEqual(appended, [{ name: "referrer", content: "no-referrer" }]);
  assert.equal(replacedWith, "https://storage.example.test/private/file");
  assert.throws(() => openEphemeralCredentialUrl("https://storage.example.test/private/file", () => null), /bloqueou/);
});

test("credential URL operations remain independent", async () => {
  const [invalid, valid] = await Promise.all([
    runAdminMutation(async () => {
      readCredentialDownload({ downloadUrl: "data:text/plain,secret", expiresAt: "2026-11-12T12:04:00.000Z", requestId: "req-invalid" }, Date.parse("2026-11-12T12:00:00.000Z"));
    }, "Primeiro comprovante aberto."),
    runAdminMutation(async () => {
      const transient = readCredentialDownload({ downloadUrl: "https://storage.example.test/second", expiresAt: "2026-11-12T12:04:00.000Z" }, Date.parse("2026-11-12T12:00:00.000Z"));
      assert.equal(transient.downloadUrl, "https://storage.example.test/second");
    }, "Segundo comprovante aberto."),
  ]);

  assert.equal(invalid.phase, "error");
  assert.deepEqual(valid, { phase: "success", message: "Segundo comprovante aberto." });
});
