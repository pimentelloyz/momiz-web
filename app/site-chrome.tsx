"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_LINKS } from "../lib/public-site-config";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/profissional")) {
    return <main>{children}</main>;
  }

  return (
    <>
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
          {LEGAL_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </div>
        <small>© {new Date().getFullYear()} Momiz. Todos os direitos reservados.</small>
      </footer>
    </>
  );
}
