import Link from "next/link";

export function LegalPage({ title, version, children }: Readonly<{
  title: string;
  version: string;
  children: React.ReactNode;
}>) {
  return (
    <article className="legal-page">
      <Link className="back-link" href="/">← Voltar para o início</Link>
      <span className="eyebrow">Informações legais</span>
      <h1>{title}</h1>
      <p className="legal-version">Última atualização: {version}</p>
      <div className="legal-content">{children}</div>
    </article>
  );
}
