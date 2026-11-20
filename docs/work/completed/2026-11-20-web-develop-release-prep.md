# Preparação de `develop` para release da Web

- Data: 2026-11-20
- Identificador: `web-develop-release-prep`
- Projeto: painel web

## Resultado

- O trabalho começou com a árvore limpa e já em `develop`; não havia branch de
  feature separada para integrar nem alterações locais preexistentes para
  preservar.
- `git fetch --prune` atualizou as referências. O HEAD inicial
  `4906ef2d856b1eca622aa8cbfa88b5872827e33a` continha integralmente
  `origin/develop` (`49e43c2cf7348d5dd86b28e7514c8c2c7a086d7e`) e estava 23 commits à frente e
  zero atrás. Assim, nenhuma mesclagem, rebase ou reset foi necessária.
- As dependências foram reinstaladas com `npm ci` usando Node 24.11.0 e npm
  11.6.1; a auditoria reportou zero vulnerabilidades conhecidas.
- Nenhum bloqueio local de código, contrato, build ou teste foi encontrado na
  preparação inicial. O follow-up de CI registrado abaixo corrigiu depois o
  lockfile para a versão de npm usada pelo runner.

## Dependência do contrato da API

- O contrato v2 de presentes não possui consumidor executável no painel Web.
  Nenhum endpoint de gifts, reservations, gift-cart, gift-checkouts,
  contributions, progress ou receipts do domínio de presentes é chamado aqui.
- A Web permanece corretamente sem o cabeçalho `X-Momiz-Contract-Version: 2`;
  adicioná-lo a clientes compartilhados afetaria contratos não relacionados. O
  mapeamento completo permanece em
  `docs/work/completed/2026-11-20-gift-contract-v2-audit.md`.

## Verificações aprovadas

- `npm ci`: aprovado; 414 pacotes auditados, zero vulnerabilidades.
- `npm test`: 149/149 testes aprovados; somente avisos conhecidos de
  `MODULE_TYPELESS_PACKAGE_JSON`.
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run openapi:check`: snapshot fixado e contrato gerado conferem.
- `npm run operations:validate`: seis runbooks e links internos válidos.
- `npm run release:preflight` com URL local, ambiente Preview e o SHA do HEAD:
  aprovado.
- `npm run build`: aprovado com Next.js 16.4.5 e 22 páginas estáticas. A mudança
  automática de modo em `next-env.d.ts` foi restaurada ao conteúdo versionado.
- `npm run test:e2e`: 60/60 testes aprovados em Chromium desktop, Chromium
  Android e WebKit/iPad.
- `npm run operations:game-day` em diretório temporário: preflight, OpenAPI,
  runbooks, tabletop de rollback e manifests Apple/Android aprovados.
- Preflight Firebase local carregando `.env.local`: aprovado sem registrar nem
  imprimir valores.
- Os dois manifests de universal links foram parseados como JSON válido.
- `git diff --check`: aprovado antes do commit de encerramento.

## Follow-up do CI `44797975763`

### Causa

- O workflow usa `node-version: 24`, que passou a resolver Node 24.22.3 com npm
  11.19.1. A preparação inicial havia executado Node 24.11.0 com npm 11.6.1.
- O lockfile continha os pacotes opcionais WASM de `sharp` e do resolver, mas não
  materializava `@emnapi/runtime@1.11.3` nem o peer
  `@emnapi/core@1.11.3`. O npm 11.19.1 passou a rejeitar essa árvore incompleta
  antes da instalação.
- A falha remota foi reproduzida localmente com as versões exatas do runner:
  `npm ci` retornou `EUSAGE` e os mesmos dois registros `Missing ... from lock
  file`. Com npm 11.6.1, o mesmo lock antigo era aceito.

### Correção

- `npm install --package-lock-only --ignore-scripts`, executado com Node 24.22.3
  e npm 11.19.1, adicionou os dois nós `@emnapi` e normalizou somente metadados
  `peer` do lockfile. Nenhuma dependência declarada nem versão de pacote mudou.
- Uma segunda geração produziu exatamente o mesmo SHA-256 do lockfile, provando
  que a correção é idempotente nessa toolchain.
- Não foi necessário alterar código, `package.json` ou workflows.

### Verificações do follow-up

- `npm ci` limpo no workspace e outra instalação em diretório isolado: aprovados
  com Node 24.22.3/npm 11.19.1; 356 pacotes auditados, zero vulnerabilidades.
- `npm test`: 149/149 aprovados.
- `npm run lint`, `npm run typecheck`, `npm run openapi:check`, `npm run
  operations:validate` e `npm run release:preflight`: aprovados.
- `npm run build`: aprovado com 22 páginas estáticas.
- `npm run test:e2e`: 60/60 aprovados em Chromium desktop, Chromium Android e
  WebKit/iPad.
- Os avisos de `MODULE_TYPELESS_PACKAGE_JSON`, ESLint fora da janela de suporte e
  scripts de instalação ainda não cobertos por `allowScripts` são não
  bloqueantes; os scripts não foram aprovados implicitamente nem a política de
  confiança foi ampliada neste ajuste de lockfile.

## Condições externas para produção

Os gates do repositório estão verdes, mas uma promoção real continua dependente
de configuração e evidência que não podem ser verificadas localmente:

- o deployment da Vercel deve usar exatamente o SHA revisado e expor a URL HTTPS
  que alimentará o Web Release Gate;
- `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID` e `FIREBASE_AUTH_DOMAIN` devem
  existir e ser válidos no ambiente Vercel de Preview/Production;
- `API_BASE_URL` e `SITE_URL` devem apontar para as origens autorizadas do
  ambiente; os valores remotos não foram acessados;
- os flags `NEXT_PUBLIC_ENABLE_MT01_*` a `NEXT_PUBLIC_ENABLE_MT09_*` devem seguir
  a matriz de dependências documentada em `.env.example`; o default desligado é
  seguro, mas o rollout pretendido exige reconciliação operacional;
- `MOMIZ_SMOKE_AUTH_EMAIL` e `MOMIZ_SMOKE_AUTH_PASSWORD` são obrigatórios para o
  smoke autenticado de Production; `VERCEL_AUTOMATION_BYPASS_SECRET` é opcional
  e só é necessário para Preview protegido;
- o gate remoto público e autenticado, a validação manual de Google/MFA/contas
  negadas/logout e a promoção Preview → Production ainda devem ser executados
  por operador autorizado conforme `docs/operations/release-gate.md`.

Nenhum valor de configuração ou secret foi copiado para documentação, logs ou
artefatos versionados.

## Ações não realizadas

- Nenhuma branch foi criada e nenhuma integração artificial foi feita, pois o
  trabalho válido já estava linearmente consolidado em `develop`.
- Nenhum push, deploy, acesso a ambiente remoto, alteração de DNS/hosting/secret,
  rollback ou migration foi executado.
