import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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
  metadataBase: new URL("https://momiz.com.br"),
  title: {
    default: "Momiz — cada detalhe, mais perto de quem importa",
    template: "%s | Momiz",
  },
  description:
    "Organize momentos especiais, convites, convidados e presentes em um só lugar.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://momiz.com.br",
    siteName: "Momiz",
    title: "Momiz — cada detalhe, mais perto de quem importa",
    description:
      "Organize momentos especiais, convites, convidados e presentes em um só lugar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Momiz — cada detalhe, mais perto de quem importa",
    description:
      "Organize momentos especiais, convites, convidados e presentes em um só lugar.",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#faf9fc",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${playfair.variable}`}>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Momiz — início">
            {/* O wordmark oficial é vetorial e permanece legível em qualquer tela. */}
            <Image src="/brand/momiz-wordmark.svg" alt="Momiz" width={560} height={160} priority />
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
            <Image src="/brand/momiz-wordmark.svg" alt="Momiz" width={560} height={160} />
            <p>Momentos importantes merecem leveza.</p>
          </div>
          <div className="footer-links">
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Privacidade</Link>
            <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@momiz.com.br"}`}>Contato</a>
          </div>
          <small>© {new Date().getFullYear()} Momiz. Todos os direitos reservados.</small>
        </footer>
      </body>
    </html>
  );
}
