import type { NextConfig } from "next";
import { assertFirebaseClientConfigForPromotion } from "./lib/firebase-client-config";
import { resolveFirebaseClientConfig } from "./lib/firebase-client-config";
import { globalSecurityHeaders, sensitiveResponseHeaders } from "./lib/security-headers";

assertFirebaseClientConfigForPromotion(process.env);
const firebase = resolveFirebaseClientConfig(process.env);
const securityHeaders = globalSecurityHeaders(firebase.available ? firebase.config.authDomain : undefined);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: sensitiveResponseHeaders,
      },
      {
        source: "/profissional/:path*",
        headers: sensitiveResponseHeaders,
      },
      {
        source: "/api/:path*",
        headers: sensitiveResponseHeaders,
      },
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/termos-e-condicoes",
        destination: "/termos",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
