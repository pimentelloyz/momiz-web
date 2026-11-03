import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildCareInviteDeepLink } from "../../../../lib/deep-links";
import {
  resolveAppStoreUrl,
  resolveGooglePlayUrl,
} from "../../../../lib/store-links";

type CareInviteFallbackPageProps = {
  params: Promise<{ token: string }>;
};

export const dynamic = "force-dynamic";

// Keep professional invite tokens out of titles, canonical URLs and social cards.
export const metadata: Metadata = {
  title: "Abrir convite profissional no app",
  description:
    "Abra seu convite profissional com segurança no app Momiz.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function CareInviteFallbackPage({
  params,
}: CareInviteFallbackPageProps) {
  const deepLink = buildCareInviteDeepLink((await params).token);
  if (!deepLink) notFound();

  const appStoreUrl = resolveAppStoreUrl();
  const playStoreUrl = resolveGooglePlayUrl();

  return (
    <section className="invite-state" aria-labelledby="care-invite-title">
      <span className="invite-state-icon" aria-hidden="true">
        ♡
      </span>
      <p className="eyebrow">Convite profissional Momiz</p>
      <h1 id="care-invite-title">Continue no app</h1>
      <p>
        Para proteger suas informações, aceite e consulte os detalhes deste
        convite somente no Momiz.
      </p>
      <div className="fallback-actions">
        <a className="button primary" href={deepLink}>
          Abrir convite no Momiz
        </a>
        {appStoreUrl ? (
          <a className="button secondary" href={appStoreUrl}>
            Baixar para iPhone
          </a>
        ) : null}
        <a className="button secondary" href={playStoreUrl}>
          Baixar para Android
        </a>
        <Link className="text-link" href="/">
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
