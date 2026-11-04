import type { NextConfig } from "next";
import { assertFirebaseClientConfigForPromotion } from "./lib/firebase-client-config";

assertFirebaseClientConfigForPromotion(process.env);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
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
