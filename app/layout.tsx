import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import { SITE_URL, siteConfig } from "../lib/site-config";
import { SiteChrome } from "./site-chrome";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Momiz — cada detalhe, mais perto de quem importa",
    template: "%s | Momiz",
  },
  description: siteConfig.description,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Momiz",
    title: "Momiz — cada detalhe, mais perto de quem importa",
    description: siteConfig.description,
    images: [{ url: "/brand/momiz-og.png", width: 1024, height: 500, alt: "Momiz" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Momiz — cada detalhe, mais perto de quem importa",
    description: siteConfig.description,
    images: ["/brand/momiz-og.png"],
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${playfair.variable}`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
