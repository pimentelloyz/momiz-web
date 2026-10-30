import Image from "next/image";
import { loadPublicAccessPlanCatalog } from "../lib/access-plan-catalog";
import { API_BASE_URL } from "../lib/site-config";
import { resolveAppStoreUrl, resolveGooglePlayUrl } from "../lib/store-links";

const planLabels = {
  FREE: "Comece com o essencial",
  STANDARD: "Mais liberdade no seu chá",
  PRO: "Para viver muitos momentos",
} as const;

const features = [
  {
    number: "01",
    title: "Planeje com números reais",
    text: "Separe quem estará no evento de quem vai participar de longe, sem errar no lanche ou nas lembrancinhas.",
  },
  {
    number: "02",
    title: "Aproxime quem mora longe",
    text: "Amigos e familiares podem acompanhar o chá e presentear mesmo sem comparecer.",
  },
  {
    number: "03",
    title: "Presentes do jeito da família",
    text: "Monte uma lista e aceite itens físicos ou Pix conforme a preferência do seu chá.",
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

export default async function Home() {
  const catalog = await loadPublicAccessPlanCatalog({ apiBaseUrl: API_BASE_URL });
  const appStoreUrl = resolveAppStoreUrl();
  const playStoreUrl = resolveGooglePlayUrl();

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Feito para momentos que ficam</span>
          <h1>Seu chá perto de quem importa — <em>até de longe.</em></h1>
          <p>
            Organize convites, confirme quem estará presente e permita que amigos
            e familiares participem com carinho de onde estiverem.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#baixar">Começar meu chá</a>
            <a className="text-link" href="#como-funciona">Veja como funciona <span>↓</span></a>
          </div>
        </div>
        <div className="hero-art" aria-label="Uma família acolhida pelo símbolo Momiz">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <Image
            className="hero-symbol"
            src="/brand/momiz-symbol.png"
            alt="Símbolo Momiz: uma vida em formação acolhida"
            width={1024}
            height={1024}
            priority
          />
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
          <article><span>2</span><h3>Convide perto e longe</h3><p>Cada pessoa escolhe se vai ao chá ou se participa de onde estiver.</p></article>
          <article><span>3</span><h3>Encha o carrinho de carinho</h3><p>Reúna vários presentes e escolha entre entrega física ou Pix.</p></article>
        </div>
      </section>

      <section className="section how" aria-labelledby="gift-cart-title">
        <div className="section-heading">
          <span className="eyebrow">Presentes com liberdade</span>
          <h2 id="gift-cart-title">Um carrinho de bebê<br />para encher de carinho.</h2>
        </div>
        <div className="steps">
          <article><span aria-hidden="true">♡</span><h3>Escolha mais de um item</h3><p>Fraldas, lenços e outros presentes ficam juntos até você concluir.</p></article>
          <article><span aria-hidden="true">⌁</span><h3>Economize tempo</h3><p>Quando a família habilitar, envie por Pix o valor dos itens diretamente para ela.</p></article>
          <article><span aria-hidden="true">✓</span><h3>Acompanhe no Momiz</h3><p>O app organiza a lista, as reservas e o andamento de cada presente.</p></article>
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

      <section className="section plans" id="planos" aria-labelledby="plans-title">
        <div className="section-heading plans-heading">
          <span className="eyebrow">Um plano para cada momento</span>
          <h2 id="plans-title">Comece do seu jeito.<br />Cresça quando precisar.</h2>
          <p>Os recursos e limites abaixo vêm do catálogo oficial do Momiz.</p>
        </div>
        <div className="plan-grid">
          {catalog.plans.map((plan) => {
            const featured = plan.packageCode === "STANDARD";
            return (
              <article className={`plan-card${featured ? " featured" : ""}`} key={plan.packageCode}>
                {featured && <span className="plan-ribbon">Escolha equilibrada</span>}
                <span className="plan-kicker">{planLabels[plan.packageCode]}</span>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className="plan-limit">
                  <strong>{plan.limits["event.active_limit"] === 1 ? "1 chá ativo" : `Até ${plan.limits["event.active_limit"]} chás ativos`}</strong>
                  <span>{plan.packageCode === "STANDARD" ? "Libera mais recursos dentro do chá atual" : plan.packageCode === "PRO" ? "Crie e organize novos chás" : "Organize seu primeiro chá"}</span>
                </div>
                <ul aria-label={`Recursos do plano ${plan.name}`}>
                  {[...plan.highlights, ...plan.features
                    .filter((feature) => !feature.capability.startsWith("care."))
                    .map((feature) => feature.label)]
                    .filter((item, index, items) => items.indexOf(item) === index)
                    .slice(0, 7)
                    .map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
                </ul>
                <a href="#baixar" className={featured ? "button primary plan-action" : "button secondary plan-action"}>
                  Começar com {plan.name}
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section coming-soon" id="em-breve" aria-labelledby="coming-soon-title">
        <div className="coming-soon-intro">
          <span className="eyebrow">O Momiz continua crescendo</span>
          <h2 id="coming-soon-title">Novos capítulos<br />estão a caminho.</h2>
          <p>Estamos preparando experiências para acompanhar a família além do chá, com privacidade e cuidado desde o começo.</p>
        </div>
        <div className="coming-soon-grid">
          <article>
            <span className="soon-label">Em breve</span>
            <div className="soon-icon" aria-hidden="true">✦</div>
            <h3>Equipe de cuidado por perto</h3>
            <p>Convide profissionais autorizados, organize agenda e acompanhe documentos importantes em um espaço conectado à família.</p>
            <small>Gestão de profissionais · autorizações · agenda e documentos</small>
          </article>
          <article>
            <span className="soon-label">Em breve</span>
            <div className="soon-icon coral" aria-hidden="true">♡</div>
            <h3>Cada aniversário vira memória</h3>
            <p>Planeje as festinhas, reúna fotos em álbuns e compartilhe momentos em uma comunidade privada de mães e famílias.</p>
            <small>Festas de aniversário · álbuns · registros em família</small>
          </article>
        </div>
      </section>

      <section className="download" id="baixar">
        <div className="download-glow" />
        <Image
          className="download-symbol"
          src="/brand/momiz-symbol.png"
          alt=""
          width={1024}
          height={1024}
          aria-hidden="true"
        />
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

