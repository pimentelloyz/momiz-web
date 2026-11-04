import Link from "next/link";
import { LEGAL_LINKS, LEGAL_VERSION } from "../lib/site-config";

export function LegalPage({ title, lastUpdated = LEGAL_VERSION, documentVersion, permanentHref, children }: Readonly<{
  title: string;
  lastUpdated?: string;
  documentVersion?: string;
  permanentHref?: string;
  children: React.ReactNode;
}>) {
  return (
    <article className="legal-page">
      <Link className="back-link" href="/">← Voltar para o início</Link>
      <span className="eyebrow">Confiança e transparência</span>
      <h1>{title}</h1>
      <p className="legal-version">
        {documentVersion && <>Versão {documentVersion} · </>}Última atualização: {lastUpdated}
        {permanentHref && <> · <Link href={permanentHref}>Link permanente desta versão</Link></>}
      </p>
      <nav className="legal-nav" aria-label="Informações, ajuda e privacidade">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>{link.shortLabel}</Link>
        ))}
      </nav>
      <div className="legal-content">{children}</div>
    </article>
  );
}
