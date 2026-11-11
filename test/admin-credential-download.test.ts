import assert from "node:assert/strict";
import test from "node:test";
import { AdminApiError } from "../app/admin/ui/admin-api-client.ts";
import { readCredentialDownloadUrl, safeEphemeralDownloadUrl } from "../app/admin/ui/admin-credential-download.ts";
import { runAdminMutation } from "../app/admin/ui/admin-query-state.ts";

test("credential download accepts only HTTPS or explicit local development URLs", () => {
  assert.equal(
    safeEphemeralDownloadUrl("https://storage.example.test/private/file?signature=secret"),
    "https://storage.example.test/private/file?signature=secret",
  );
  assert.equal(safeEphemeralDownloadUrl("http://localhost:9000/private/file"), "http://localhost:9000/private/file");
  assert.equal(safeEphemeralDownloadUrl("http://storage.example.test/private/file"), null);
  assert.equal(safeEphemeralDownloadUrl("javascript:alert('secret')"), null);
  assert.equal(safeEphemeralDownloadUrl({ url: "https://example.test" }), null);
});

test("invalid credential payload preserves correlation without leaking the URL", () => {
  const unsafeUrl = "javascript:alert('signed-secret')";
  assert.throws(
    () => readCredentialDownloadUrl({ downloadUrl: unsafeUrl, requestId: "req-credential-url" }),
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

test("credential URL operations remain independent", async () => {
  const [invalid, valid] = await Promise.all([
    runAdminMutation(async () => {
      readCredentialDownloadUrl({ downloadUrl: "data:text/plain,secret", requestId: "req-invalid" });
    }, "Primeiro comprovante aberto."),
    runAdminMutation(async () => {
      const transient = readCredentialDownloadUrl({ downloadUrl: "https://storage.example.test/second" });
      assert.equal(transient, "https://storage.example.test/second");
    }, "Segundo comprovante aberto."),
  ]);

  assert.equal(invalid.phase, "error");
  assert.deepEqual(valid, { phase: "success", message: "Segundo comprovante aberto." });
});
