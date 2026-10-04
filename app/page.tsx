const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL;
const playStoreUrl = process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL;

const features = [
  {
    number: "01",
    title: "Eventos sem planilhas",
    text: "Convites, confirmações e lista de convidados organizados no mesmo lugar.",
  },
  {
    number: "02",
    title: "Presentes com liberdade",
    text: "Monte sua lista, acompanhe reservas e organize contribuições do seu jeito.",
  },
  {
    number: "03",
    title: "Tudo perto de você",
    text: "Informações importantes e lembranças disponíveis quando você precisar.",
  },
];

function StoreButton({ store, url }: { store: "Apple" | "Google"; url?: string }) {
  const label = store === "Apple" ? "App Store" : "Google Play";
  const icon = store === "Apple" ? "●" : "▶";

  if (!url) {
    return (
      <span className="store-button disabled" aria-label={`${label}, em breve`}>
        <span className="store-icon">{icon}</span>
        <span><small>Em breve na</small>{label}</span>
      </span>
    );
  }

  return (
    <a className="store-button" href={url} target="_blank" rel="noreferrer">
      <span className="store-icon">{icon}</span>
      <span><small>Baixe na</small>{label}</span>
    </a>
  );
}

function HeartMark() {
  return (
    <div className="heart-mark" aria-hidden="true">
      <span className="arm arm-left" />
      <span className="arm arm-right" />
      <span className="person person-big" />
      <span className="person person-small" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Feito para momentos que ficam</span>
          <h1>Organizar o que importa pode ser <em>mais leve.</em></h1>
          <p>
            Do convite ao presente, o Momiz reúne tudo para você viver cada etapa
            com mais presença e menos preocupação.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#baixar">Quero conhecer</a>
            <a className="text-link" href="#como-funciona">Veja como funciona <span>↓</span></a>
          </div>
        </div>
        <div className="hero-art" aria-label="Uma família acolhida pelo símbolo Momiz">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <HeartMark />
          <div className="floating-card card-guests">
            <span className="card-icon">✓</span>
            <span><strong>Convidados</strong><small>Confirmações em dia</small></span>
          </div>
          <div className="floating-card card-gifts">
            <span className="card-icon coral">♡</span>
            <span><strong>Presentes</strong><small>Escolhidos com carinho</small></span>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Benefícios">
        <span>Um só lugar</span><i />
        <span>Mais tempo presente</span><i />
        <span>Feito com cuidado</span>
      </section>

      <section className="section how" id="como-funciona">
        <div className="section-heading">
          <span className="eyebrow">Simples desde o começo</span>
          <h2>Você cuida do momento.<br />O Momiz cuida dos detalhes.</h2>
        </div>
        <div className="steps">
          <article><span>1</span><h3>Crie seu evento</h3><p>Personalize as informações e deixe tudo com a sua cara.</p></article>
          <article><span>2</span><h3>Convide quem importa</h3><p>Compartilhe o convite e acompanhe cada confirmação.</p></article>
          <article><span>3</span><h3>Aproveite de verdade</h3><p>Centralize presentes e detalhes para curtir sem correria.</p></article>
        </div>
      </section>

      <section className="section features" id="recursos">
        <div className="feature-intro">
          <span className="eyebrow">Tudo conectado</span>
          <h2>Menos coisas para lembrar.<br /><em>Mais histórias para viver.</em></h2>
          <p>Uma experiência pensada para acolher cada fase e facilitar cada escolha.</p>
        </div>
        <div className="feature-list">
          {features.map((feature) => (
            <article key={feature.number}>
              <span>{feature.number}</span>
              <div><h3>{feature.title}</h3><p>{feature.text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="download" id="baixar">
        <div className="download-glow" />
        <HeartMark />
        <span className="eyebrow light">Seu próximo momento começa aqui</span>
        <h2>Leve o Momiz<br />com você.</h2>
        <p>Baixe o app e transforme organização em tranquilidade.</p>
        <div className="store-buttons">
          <StoreButton store="Apple" url={appStoreUrl} />
          <StoreButton store="Google" url={playStoreUrl} />
        </div>
      </section>
    </>
  );
}
