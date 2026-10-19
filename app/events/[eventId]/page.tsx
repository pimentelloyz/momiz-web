import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildEventDeepLink,
  normalizeEventId,
} from "../../../lib/deep-links";

type EventFallbackPageProps = {
  params: Promise<{ eventId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: EventFallbackPageProps): Promise<Metadata> {
  const eventId = normalizeEventId((await params).eventId);
  if (!eventId) notFound();

  const canonical = `/events/${eventId}`;

  return {
    title: "Abrir evento no app",
    description:
      "Abra este evento com segurança no app Momiz ou baixe o aplicativo.",
    alternates: { canonical },
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
    openGraph: {
      title: "Abrir evento no Momiz",
      description: "Continue para o evento diretamente no app Momiz.",
      type: "website",
      url: canonical,
    },
  };
}

export default async function EventFallbackPage({
  params,
}: EventFallbackPageProps) {
  const eventId = normalizeEventId((await params).eventId);
  if (!eventId) notFound();

  const deepLink = buildEventDeepLink(eventId);
  if (!deepLink) notFound();

  return (
    <section className="invite-state" aria-labelledby="event-fallback-title">
      <span className="invite-state-icon" aria-hidden="true">
        ♡
      </span>
      <p className="eyebrow">Evento Momiz</p>
      <h1 id="event-fallback-title">Continue no app</h1>
      <p>
        Para proteger as informações da família, os detalhes deste evento ficam
        disponíveis somente no Momiz.
      </p>
      <div className="fallback-actions">
        <a className="button primary" href={deepLink}>
          Abrir evento no Momiz
        </a>
        <Link className="button secondary" href="/#baixar">
          Baixar o app
        </Link>
        <Link className="text-link" href="/">
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
