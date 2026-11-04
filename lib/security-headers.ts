type Header = { key: string; value: string };

function firebaseOrigin(authDomain?: string) {
  if (!authDomain) return null;
  try {
    const url = new URL(`https://${authDomain}`);
    return url.hostname === authDomain && url.pathname === "/" ? url.origin : null;
  } catch {
    return null;
  }
}

export function contentSecurityPolicyReportOnly(authDomain?: string) {
  const authOrigin = firebaseOrigin(authDomain);
  const frameSources = ["'self'", "https://accounts.google.com", authOrigin].filter(Boolean);
  const connectSources = [
    "'self'",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firebaseinstallations.googleapis.com",
    "https://www.googleapis.com",
    authOrigin,
  ].filter(Boolean);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    `frame-src ${frameSources.join(" ")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob:",
  ].join("; ");
}

export function globalSecurityHeaders(authDomain?: string): Header[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    {
      key: "Content-Security-Policy-Report-Only",
      value: contentSecurityPolicyReportOnly(authDomain),
    },
  ];
}

export const sensitiveResponseHeaders: Header[] = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];
