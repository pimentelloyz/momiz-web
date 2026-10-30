const googlePackageName = "com.lifeados.momiz.app";
const googleFallback = `https://play.google.com/store/apps/details?id=${googlePackageName}`;
const appStoreIdPattern = /^\d{9,12}$/;

type StoreEnvironment = {
  NEXT_PUBLIC_APP_STORE_URL?: string;
  NEXT_PUBLIC_APP_STORE_APP_ID?: string;
  NEXT_PUBLIC_GOOGLE_PLAY_URL?: string;
};

function safeStoreUrl(value: string | undefined, host: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === host || url.hostname.endsWith(`.${host}`))
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function resolveAppStoreUrl(
  env: StoreEnvironment = process.env as StoreEnvironment,
): string | undefined {
  const configuredUrl = safeStoreUrl(env.NEXT_PUBLIC_APP_STORE_URL, "apps.apple.com");
  if (configuredUrl) return configuredUrl;
  const appId = env.NEXT_PUBLIC_APP_STORE_APP_ID?.trim();
  return appId && appStoreIdPattern.test(appId)
    ? `https://apps.apple.com/br/app/momiz/id${appId}`
    : undefined;
}

export function resolveGooglePlayUrl(
  env: StoreEnvironment = process.env as StoreEnvironment,
): string {
  return safeStoreUrl(env.NEXT_PUBLIC_GOOGLE_PLAY_URL, "play.google.com") ?? googleFallback;
}

export const MOMIZ_ANDROID_PACKAGE_NAME = googlePackageName;
export const MOMIZ_IOS_BUNDLE_IDENTIFIER = "com.lifeados.momiz";
