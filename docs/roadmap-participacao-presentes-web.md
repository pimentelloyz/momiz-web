# Roadmap web — participacao de longe e presentes no Momiz

> **Status:** planejado, desenvolvimento ainda nao iniciado
>
> **Data da decisao:** 11 de outubro de 2026
>
> **Escopo:** landing institucional, fallback publico de convite, SEO e paginas
> legais relacionadas a participacao e presentes.

## Objetivo

Alinhar a comunicacao publica do Momiz com a nova experiencia do app:

- convidados podem confirmar presenca ou participar de longe;
- participantes virtuais nao aumentam a estimativa de alimentacao e
  lembrancinhas;
- cada pessoa pode montar um carrinho com varios presentes;
- o anfitriao decide se prefere Pix, itens fisicos ou uma experiencia equilibrada;
- Pix e uma forma pratica de presentear diretamente a familia, nao um servico
  financeiro ou de entrega prestado pelo Momiz.

## Linguagem compartilhada

Usar as mesmas expressoes do app:

- **Como voce quer participar?**
- **Vou ao cha**
- **Vou participar de longe**
- **Carrinho de presentes**
- **Enviar o valor por Pix**
- **Vou levar os presentes**

Evitar:

- usar `check-in virtual` como rotulo principal, pois check-in costuma significar
  chegada ao evento;
- dizer que uma pessoa virtual `nao vai ao cha` em tom negativo;
- prometer que o Momiz compra, recebe, transfere ou entrega presentes;
- afirmar que `nos cuidamos do resto` antes de existir suporte juridico e
  operacional para essa promessa.

## Landing principal

Arquivo que recebera a alteracao: `app/page.tsx`.

### Hero proposto

**Seu cha perto de quem importa — ate de longe.**

Organize convites, confirme quem estara presente e permita que amigos e
familiares participem com carinho de onde estiverem.

CTA principal: **Comecar meu cha**

CTA secundario: **Conhecer o Momiz**

### Bloco de beneficios

1. **Planeje com numeros reais**

   Saiba quantos adultos e criancas estarao no evento sem misturar quem vai
   participar apenas de longe.
2. **Aproxime quem mora longe**

   O convidado pode acompanhar o cha e escolher presentes mesmo sem comparecer.
3. **Presentes do jeito da familia**

   Monte uma lista, aceite itens fisicos ou compartilhe a chave Pix conforme sua
   preferencia.
4. **Tudo acompanhado no Momiz**

   Convites, respostas, carrinho e andamento dos presentes no mesmo lugar.

### Bloco do carrinho

Titulo: **Um carrinho de bebe para encher de carinho**

Texto: Escolha fraldas, lencos e outros itens da lista no mesmo carrinho. Na hora
de concluir, veja as formas de presentear aceitas pela familia.

O visual pode usar o carrinho de bebe como metafora, mas deve manter o padrao de
icones da marca e uma descricao acessivel que nao dependa do trocadilho.

### Bloco Pix

Titulo: **Presenteie sem perder tempo no caminho**

Texto: Quando a familia habilitar essa opcao, voce pode enviar por Pix o valor dos
itens escolhidos. A transferencia e feita diretamente para a chave informada pela
familia, e o Momiz ajuda a organizar o acompanhamento.

## Pagina publica do convite

Arquivo que recebera a alteracao: `app/convite/[slug]/page.tsx`.

Essa pagina continua sendo fallback para quem abre o link sem o app ou quando o
Universal Link/App Link nao e associado pelo sistema.

### Conteudo proposto

- identificacao do cha;
- data e cidade somente quando a regra de privacidade permitir;
- texto **Voce pode participar presencialmente ou de longe**;
- explicacao curta de que a escolha e concluida com seguranca no app;
- CTA **Abrir no Momiz** quando o app puder ser acionado;
- CTA **Baixar o app** quando nao estiver instalado;
- codigo do convite com acao **Copiar codigo** como alternativa;
- instrucoes curtas para colar o codigo no app.

O site nao deve registrar RSVP ou presente apenas no navegador no primeiro
release. Essa ampliacao exige autenticacao, contrato publico especifico e uma
analise de privacidade propria.

## Metadados e SEO

Arquivos que receberao alteracoes: `app/layout.tsx`, `app/sitemap.ts` e, quando
necessario, metadados especificos das paginas.

- Titulo sugerido: **Momiz | Seu cha perto de quem importa**
- Descricao sugerida: **Organize seu cha, acompanhe confirmacoes presenciais e
  virtuais e compartilhe uma lista de presentes com Pix ou entrega fisica.**
- Open Graph deve representar acolhimento, organizacao e participacao a distancia.
- Nao indexar codigos privados, nomes de convidados ou detalhes restritos do
  evento.
- A pagina de convite deve usar titulo generico quando o evento nao puder ser
  exposto publicamente.

## Termos e Privacidade

Arquivos a revisar antes da liberacao: `app/termos/page.tsx` e
`app/privacidade/page.tsx`.

### Termos

Preservar e tornar explicito que:

- o Momiz nao e instituicao financeira nem intermediador da transferencia Pix;
- a chave e fornecida pelo anfitriao e o pagamento e realizado fora da custodia
  do Momiz;
- disponibilidade, reserva, compra e entrega de itens sao responsabilidade das
  partes indicadas no fluxo;
- o carrinho organiza a intencao de presentear e so gera compromissos conforme a
  confirmacao exibida no checkout;
- cancelamentos e conflitos seguem as regras registradas no momento da operacao.

### Privacidade

Documentar, conforme a implementacao final:

- modo de participacao presencial ou virtual;
- composicao do carrinho e historico de checkout;
- registro de exibicao e escolha no incentivo;
- estado de reserva ou contribuicao;
- retencao e exclusao desses dados;
- ausencia de chave Pix, comprovante ou dados pessoais em analytics.

Qualquer texto legal novo deve passar por revisao juridica antes do deploy em
producao.

## Analytics web

Eventos permitidos na landing, sem dados pessoais:

- `landing_primary_cta_clicked`
- `landing_remote_participation_viewed`
- `invite_fallback_viewed`
- `invite_open_app_clicked`
- `invite_store_clicked`
- `invite_code_copied`

Nao enviar slug completo, codigo do convite, nome do evento, chave Pix ou dados
do convidado.

## Responsividade e acessibilidade

- Validar 320 px ate desktop largo, sem altura fixa em blocos de texto.
- CTA do convite deve continuar visivel sem sobrepor o conteudo.
- Respeitar `prefers-reduced-motion` em animacoes.
- Contraste AA, foco visivel e navegacao completa por teclado.
- Icones precisam de rotulo textual ou `aria-label` coerente.
- Evitar texto embutido em imagens.
- Testar aumento de zoom para 200% sem perda de acao ou informacao.

## Testes e validacao

- renderizacao responsiva da landing e do convite;
- CTA correto com e sem URL configurada para cada loja;
- fallback do deeplink no iOS e Android;
- codigo copiavel e mensagem de sucesso acessivel;
- metadados, `robots.txt`, sitemap e canonical;
- nenhuma informacao privada no HTML, metadados ou eventos de analytics;
- Termos e Privacidade coerentes com o comportamento liberado;
- smoke test apos o deploy na Vercel.

## Lotes de implementacao

1. **Linguagem institucional:** hero, beneficios, carrinho e Pix.
2. **Fallback do convite:** participacao de longe, abrir app, lojas e codigo.
3. **SEO e compartilhamento:** metadados, Open Graph e indexacao segura.
4. **Legal e privacidade:** textos revistos contra os contratos implementados.
5. **Qualidade e deploy:** testes, acessibilidade, preview e publicacao gradual.

As mudancas de marketing podem entrar antes do checkout apenas se marcadas como
**Em breve**. A landing nunca deve anunciar como disponivel uma funcao ainda
protegida por feature flag ou ausente nos builds das lojas.

## Definicao de pronto da web

- Landing, convite e app usam os mesmos nomes para participacao e presentes.
- O site explica corretamente quem conta como presenca fisica.
- A mensagem de Pix descreve o servico real sem promessas financeiras ou
  logisticas indevidas.
- Universal Links/App Links continuam validos e possuem fallback util.
- SEO, analytics, acessibilidade e paginas legais estao validados.
- Conteudo publicado corresponde ao estagio real do rollout no app e na API.

## Documentos relacionados

- Back-end: `omah-api/docs/roadmap-participacao-presentes/README.md`
- App: `omah_app/lib/docs/development/roadmap-participacao-presentes.md`
