import Link from "next/link";

export function LegalPage({ title, version, children }: Readonly<{
  title: string;
  version: string;
  children: React.ReactNode;
}>) {
  return (
    <article className="legal-page">
      <Link className="back-link" href="/">← Voltar para o início</Link>
      <span className="eyebrow">Confiança e transparência</span>
      <h1>{title}</h1>
      <p className="legal-version">Última atualização: {version}</p>
      <nav className="legal-nav" aria-label="Informações, ajuda e privacidade">
        <Link href="/suporte">Suporte</Link>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos</Link>
        <Link href="/excluir-conta">Excluir conta</Link>
      </nav>
      <div className="legal-content">{children}</div>
    </article>
  );
}
