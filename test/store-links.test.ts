import assert from "node:assert/strict";
import test from "node:test";
import {
  MOMIZ_ANDROID_PACKAGE_NAME,
  MOMIZ_IOS_BUNDLE_IDENTIFIER,
  resolveAppStoreUrl,
  resolveGooglePlayUrl,
} from "../lib/store-links.ts";

test("builds the official App Store URL only from a valid numeric ID", () => {
  assert.equal(
    resolveAppStoreUrl({ NEXT_PUBLIC_APP_STORE_APP_ID: "1234567890" }),
    "https://apps.apple.com/br/app/momiz/id1234567890",
  );
  assert.equal(resolveAppStoreUrl({ NEXT_PUBLIC_APP_STORE_APP_ID: "com.lifeados.momiz" }), undefined);
  assert.equal(resolveAppStoreUrl({ NEXT_PUBLIC_APP_STORE_APP_ID: "123" }), undefined);
});

test("accepts only official HTTPS store hosts", () => {
  assert.equal(
    resolveAppStoreUrl({ NEXT_PUBLIC_APP_STORE_URL: "https://apps.apple.com/br/app/momiz/id1234567890" }),
    "https://apps.apple.com/br/app/momiz/id1234567890",
  );
  assert.equal(resolveAppStoreUrl({ NEXT_PUBLIC_APP_STORE_URL: "https://example.com/fake" }), undefined);
  assert.equal(
    resolveGooglePlayUrl({ NEXT_PUBLIC_GOOGLE_PLAY_URL: "https://example.com/fake" }),
    `https://play.google.com/store/apps/details?id=${MOMIZ_ANDROID_PACKAGE_NAME}`,
  );
});

test("uses the production Android package fallback and records iOS bundle", () => {
  assert.equal(MOMIZ_ANDROID_PACKAGE_NAME, "com.lifeados.momiz.app");
  assert.equal(MOMIZ_IOS_BUNDLE_IDENTIFIER, "com.lifeados.momiz");
  assert.equal(
    resolveGooglePlayUrl({}),
    "https://play.google.com/store/apps/details?id=com.lifeados.momiz.app",
  );
});
