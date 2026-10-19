import type { Metadata } from "next";
import Link from "next/link";
import type { EventDetailsLoadResult } from "../../../lib/event-details-loader";
import { getEventDetails } from "../../../lib/event-details-server";
import { firstValue, formatEventDate, safeColor } from "../../../lib/invite-helpers";

type InvitePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string | string[] }>;
};

function InviteError({ result }: { result: Extract<EventDetailsLoadResult, { ok: false }> }) {
  const transient = result.error.kind !== "not_found";

  return (
    <section className="invite-state" aria-labelledby="invite-error-title">
      <span className="invite-state-icon" aria-hidden="true">♡</span>
      <p className="eyebrow">Convite Momiz</p>
      <h1 id="invite-error-title">
        {transient ? "Não foi possível carregar o convite" : "Não encontramos este convite"}
      </h1>
      <p>
        {transient
          ? "Tivemos uma instabilidade. Tente novamente em alguns instantes."
          : "Confira se o link recebido está completo ou peça um novo convite ao organizador."}
      </p>
      <Link className="button primary" href="/">
        {transient ? "Ir para o início" : "Conhecer o Momiz"}
      </Link>
    </section>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: InvitePageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const result = await getEventDetails(slug, firstValue(query.guest));
  const details = result.ok ? result.data : null;
  const title = details?.theme?.heroTitle || details?.event.title || "Convite especial";
  const description =
    details?.theme?.heroSubtitle ||
    details?.event.subtitle ||
    "Você recebeu um convite especial pelo Momiz.";

  return {
    title,
    description,
    alternates: { canonical: `/convite/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: details?.event.coverImageUrl ? [details.event.coverImageUrl] : undefined,
    },
  };
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const guest = firstValue(query.guest);
  const result = await getEventDetails(slug, guest);
  const deepLink = `momiz://convite/${encodeURIComponent(slug)}${
    guest ? `?guest=${encodeURIComponent(guest)}` : ""
  }`;

  if (!result.ok) return <InviteError result={result} />;

  const details = result.data;
  const { event, address, theme } = details;
  const title = theme?.heroTitle || event.title;
  const subtitle = theme?.heroSubtitle || event.subtitle || "Você está convidado";
  const date = formatEventDate(event.eventDateTime);
  const background = safeColor(theme?.backgroundColor, "#f1edfb");
  const foreground = safeColor(theme?.primaryColor, "#4d6958");
  const place = [address?.venueName, address?.city, address?.state]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="invite-page">
      <section
        className="invite-card"
        style={{ "--invite-background": background, "--invite-foreground": foreground } as React.CSSProperties}
      >
        {event.coverImageUrl ? (
          // O endereço é fornecido pelo próprio organizador e pode apontar para o storage do Momiz.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="invite-cover" src={event.coverImageUrl} alt="" />
        ) : null}
        <div className="invite-card-copy">
          <span className="invite-kicker">Um convite especial para você</span>
          <h1>{title}</h1>
          <p className="invite-subtitle">{subtitle}</p>
          {event.description ? <p className="invite-description">{event.description}</p> : null}
        </div>
      </section>

      <section className="invite-details" aria-label="Detalhes do evento">
        <div className="invite-detail-grid">
          {date ? (
            <div className="invite-detail">
              <span aria-hidden="true">◷</span>
              <div><strong>Quando</strong><p>{date}</p></div>
            </div>
          ) : null}
          {place ? (
            <div className="invite-detail">
              <span aria-hidden="true">⌖</span>
              <div>
                <strong>Onde</strong>
                <p>{place}</p>
                {address?.isRedacted ? <small>Endereço completo após a confirmação.</small> : null}
              </div>
            </div>
          ) : null}
          {event.dressCode ? (
            <div className="invite-detail">
              <span aria-hidden="true">◇</span>
              <div><strong>Dress code</strong><p>{event.dressCode}</p></div>
            </div>
          ) : null}
        </div>

        {event.footerMessage ? <blockquote>{event.footerMessage}</blockquote> : null}

        <div className="invite-actions">
          <p><strong>Como você quer participar?</strong></p>
          <p>Você pode ir ao chá ou participar de longe e escolher um presente pelo Momiz.</p>
          <a className="button primary" href={deepLink}>Abrir no Momiz e escolher</a>
          <Link className="button secondary" href="/#baixar">Ainda não tenho o app</Link>
        </div>
        <p className="invite-action-note">
          No app, sua resposta ajuda a família a planejar o evento com números reais. Quem participa de longe não entra na contagem de alimentação e lembrancinhas.
        </p>
      </section>
    </article>
  );
}
