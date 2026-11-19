# Segurança do Next.js

- Data: 2026-11-19
- Identificador: `web-next-security`
- Projeto: Web administrativa

## Resultado

- O Next.js foi atualizado de `16.4.3` para `16.4.5`, a primeira versão fora
  dos intervalos afetados por `GHSA-mfr8-8qww-v76h` (`>=16.3.0 <=16.4.4`) e
  `GHSA-vc7v-qv4w-wrv8` (`>=16.2.0 <=16.4.4`).
- `eslint-config-next` acompanhou o framework em `16.4.5`; React e React DOM
  permaneceram em `19.3.0`, compatíveis com o peer declarado e sem necessidade
  de upgrade especulativo.
- O lockfile resolveu `typescript-eslint@8.73.0` e `minimatch@11.0.9` dentro do
  range transitivo já aceito por `eslint-config-next`, removendo também os
  advisories de desenvolvimento observados durante a instalação.
- `npm audit` e `npm audit --omit=dev` terminaram sem vulnerabilidades. A árvore
  efetiva contém `next@16.4.5`, `eslint-config-next@16.4.5`,
  `react@19.3.0` e `react-dom@19.3.0`.
- Nenhum código de autenticação, BFF, relatório administrativo ou contrato foi
  alterado; nenhum `any` foi introduzido.

## Verificações aprovadas

- `npm audit --omit=dev --json`: 0 vulnerabilidades de produção.
- `npm audit --json`: 0 vulnerabilidades na árvore completa.
- `npm test`: 149 testes aprovados.
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado com Next.js 16.4.5; 22 páginas estáticas geradas e
  todas as rotas dinâmicas compiladas.
- `node --test test/firebase-client-config.test.ts
  test/admin-report-pagination.test.ts test/professional-portal.test.ts`: 42
  testes focados aprovados, cobrindo autenticação, relatório e BFFs.
- `npx playwright test e2e/admin-credential-smoke.spec.ts`: 9 cenários aprovados
  em desktop Chromium, iPad WebKit e Android Chromium.
- `git diff --check`: aprovado ao final.

## Limitações E2E existentes

- `npm run test:e2e` não é autocontido: a coleta inclui
  `e2e/preview-credential.spec.ts`, que encerra sem a conta sintética e o marker
  secreto de Preview. Nenhuma credencial foi criada ou inspecionada neste lote.
- A execução explícita dos três specs locais terminou com 46 aprovações e 14
  falhas fora dos arquivos alterados: o `.env.local` torna a autenticação
  disponível enquanto o smoke espera o estado indisponível; o smoke de convite
  espera o esquema `momiz://`, mas a implementação atual entrega o universal
  link HTTPS; e o teste de zoom encontrou overflow em iPad/Android. O smoke
  isolado de credencial administrativa foi aprovado integralmente.
- A suíte unitária ainda emite o aviso conhecido `MODULE_TYPELESS_PACKAGE_JSON`,
  já registrado em WEB-015; decidir `type: module` continua fora deste lote de
  segurança mínimo.

## Pendências externas de WEB-001/WEB-002

- WEB-001 permanece bloqueado por ações remotas: reconciliar
  `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID` e `FIREBASE_AUTH_DOMAIN` nos
  ambientes Vercel corretos; confirmar domínio autorizado no Firebase; fazer
  redeploy controlado; validar Google, senha, MFA, contas autorizada e não
  autorizada, sessão e logout; e configurar monitoramento pós-deploy.
- WEB-002 permanece bloqueado por conta sintética e secrets aprovados, execução
  do gate contra Preview e Production reais, validação do contrato/API,
  ensaio de rollback na Vercel e confirmação de monitoramento e ownership.
- Não houve commit, push, deploy, alteração Vercel/Firebase/OAuth, leitura de
  secrets ou mudança fora do repositório Web.
