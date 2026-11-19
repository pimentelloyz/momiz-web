# Regressões dos smokes locais da Web

- Data: 2026-11-19
- Identificador: `web-local-smoke-regressions`
- Projeto: Web administrativa

## Resultado

- A suíte local pública voltou a ser autocontida: `npm run test:e2e` executa 60
  casos em desktop Chromium, iPad WebKit e Android Chromium sem depender de
  `.env.local` ou da fixture secreta de Preview.
- O smoke secreto continua separado em
  `playwright.credential-preview.config.ts` e protegido pelo preflight explícito;
  ele não foi ignorado dentro de seu próprio gate nem recebeu valores falsos.
- O upgrade para Next.js 16.4.5 e a árvore sem vulnerabilidades foram preservados.

## Causas raiz e correções

### Configuração de autenticação

- Causa: `next start` usa `NODE_ENV=production`; como o `webServer.env` local não
  definia as variáveis Firebase, o Next seguia sua ordem documentada e carregava
  valores de `.env.local`. O smoke que deveria comprovar o estado sem
  configuração variava conforme a máquina.
- Correção: o processo iniciado pelo Playwright recebe valores vazios explícitos
  para as três variáveis Firebase, `MOMIZ_AUTH_CONFIG_REQUIRED=false` e
  `VERCEL_ENV` vazio. A precedência de `process.env` impede a leitura de
  `.env.local` sem revelar ou registrar nenhum valor. O harness também não
  reutiliza servidores existentes, que poderiam ter sido iniciados com outro
  ambiente.
- O alerta da aplicação agora é localizado pelo conteúdo esperado, sem colisão
  com o `role=alert` vazio do anunciador de rotas interno do Next.js.

### Universal link do convite

- Causa: a expectativa ainda exigia `momiz://convite/...`, mas a implementação
  autoritativa entrega `SITE_URL + /convite/...` para ativar App/Universal Links.
  O AASA já associa `/convite/*` aos app IDs
  `2B3NAR3YX7.com.lifeados.momiz` e `.dev`; o Asset Links mantém os packages
  `com.lifeados.momiz.app` e `.dev`.
- Correção: o smoke valida o link HTTPS da origem local e exige também a rota
  `/convite/*` no manifesto Apple. Custom schemes continuam cobertos nos fluxos
  que realmente os usam, como o fallback de eventos.

### Reflow e overflow mobile

- Causa: `document.documentElement.style.zoom = "2"` ampliava pixels sem reduzir
  o viewport CSS e, portanto, sem ativar os breakpoints que um zoom real de 200%
  ativa. Ao testar o viewport efetivo correto, palavras longas do conteúdo
  jurídico ainda excediam a coluna mais estreita em até 10 px no Pixel 7.
- Correção: o smoke reduz largura e altura do viewport à metade antes da
  navegação, reproduzindo o reflow de 200%, e o conteúdo jurídico usa
  `overflow-wrap: anywhere`. Desktop, iPad e Android terminam sem overflow
  horizontal.

## Verificações

- `npx playwright test e2e/smoke.spec.ts
  e2e/accessibility-smoke.spec.ts`: 51/51 aprovados.
- `npm run test:e2e`: 60/60 aprovados nos três projetos locais.
- `npm test`: 149/149 aprovados.
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado com Next.js 16.4.5 e 22 páginas estáticas.
- `npm run test:e2e:credential:preview:check`: falhou fechado como esperado sem
  opt-in, ambiente Preview, conta sintética, marker e URL HTTPS; apenas os nomes
  das variáveis ausentes foram reportados.
- `git diff --check`: aprovado ao final.

## Pendências externas

- O smoke autenticado de Preview ainda depende de conta sintética, secrets
  aprovados e deployment HTTPS real. WEB-001/002 continuam dependendo das ações
  Vercel/Firebase, validação remota e ensaio de rollback já documentados.
- Não houve commit, push, deploy, alteração remota, leitura de secrets ou edição
  da API e do aplicativo Flutter.
