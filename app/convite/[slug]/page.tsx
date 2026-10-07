import type { Metadata } from "next";
import Link from "next/link";

type InvitePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string | string[] }>;
};

type EventDetails = {
  event: {
    title: string;
    subtitle?: string | null;
    description?: string | null;
    eventDateTime: string;
    coverImageUrl?: string | null;
    dressCode?: string | null;
    footerMessage?: string | null;
  };
  address?: {
    venueName?: string | null;
    street?: string | null;
    number?: string | null;
    city?: string | null;
    state?: string | null;
    isRedacted?: boolean;
  } | null;
  theme?: {
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    backgroundColor?: string | null;
    primaryColor?: string | null;
  } | null;
};

const apiBaseUrl =
  process.env.MOMIZ_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.momiz.com.br"
    : "http://localhost:3020");

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function safeColor(value: string | null | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

async function getEventDetails(slug: string, guest?: string) {
  const query = guest ? `?guestId=${encodeURIComponent(guest)}` : "";
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/events/by-slug/${encodeURIComponent(slug)}/details${query}`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) return null;
    return (await response.json()) as EventDetails;
  } catch {
    return null;
  }
}

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const details = await getEventDetails(slug);
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
  const details = await getEventDetails(slug, guest);
  const deepLink = `momiz://convite/${encodeURIComponent(slug)}${
    guest ? `?guest=${encodeURIComponent(guest)}` : ""
  }`;

  if (!details) {
    return (
      <section className="invite-state" aria-labelledby="invite-error-title">
        <span className="invite-state-icon" aria-hidden="true">♡</span>
        <p className="eyebrow">Convite Momiz</p>
        <h1 id="invite-error-title">Não encontramos este convite</h1>
        <p>Confira se o link recebido está completo ou peça um novo convite ao organizador.</p>
        <Link className="button primary" href="/">Conhecer o Momiz</Link>
      </section>
    );
  }

  const { event, address, theme } = details;
  const title = theme?.heroTitle || event.title;
  const subtitle = theme?.heroSubtitle || event.subtitle || "Você está convidado";
  const date = formatEventDate(event.eventDateTime);
  const background = safeColor(theme?.backgroundColor, "#f1edfb");
  const foreground = safeColor(theme?.primaryColor, "#3e356b");
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
          <a className="button primary" href={deepLink}>Abrir no app e confirmar presença</a>
          <Link className="button secondary" href="/#baixar">Ainda não tenho o app</Link>
        </div>
        <p className="invite-action-note">
          No app você também encontra a lista de presentes e todas as informações do evento.
        </p>
      </section>
    </article>
  );
}
