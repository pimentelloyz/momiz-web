import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { LEGAL_LINKS, SITE_URL, siteConfig } from "../lib/site-config";
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
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Momiz — início">
            <Image src="/brand/momiz-logo-horizontal.png" alt="Momiz" width={1600} height={533} priority />
          </Link>
          <nav aria-label="Navegação principal">
            <Link href="/#como-funciona">Como funciona</Link>
            <Link href="/#recursos">Recursos</Link>
            <Link href="/#baixar" className="nav-cta">Baixar o app</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div>
            <Image src="/brand/momiz-logo-horizontal.png" alt="Momiz" width={1600} height={533} />
            <p>Momentos importantes merecem leveza.</p>
          </div>
          <div className="footer-links">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </div>
          <small>© {new Date().getFullYear()} Momiz. Todos os direitos reservados.</small>
        </footer>
      </body>
    </html>
  );
}
