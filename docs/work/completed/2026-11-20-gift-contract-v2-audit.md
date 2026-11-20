# Auditoria do contrato v2 de presentes na Web

- Data: 2026-11-20
- Identificador: `gift-contract-v2-audit`
- Projeto: painel web

## Resultado

- O painel web não consome endpoints de gifts, reservations, gift-cart,
  gift-checkouts, contributions, progress ou receipts do domínio de presentes.
- Nenhum código recebeu `X-Momiz-Contract-Version: 2`: adicionar o cabeçalho em um
  cliente compartilhado afetaria contratos sem relação com presentes e criar um
  cliente novo não teria consumidor.
- Não foi necessário criar teste de header ou parsing, porque não existe chamada nem
  expectativa de envelope v2 na Web.

## Mapeamento

- Buscas direcionadas em `app/`, `lib/`, `test/`, `e2e/` e `scripts/` cobriram os
  nomes de domínio, fragmentos de URL, todos os usos de `fetch` e os clientes/proxies
  administrativos e profissionais.
- `lib/access-plan-catalog.ts` chama somente `GET /api/billing/plans`; “gift” aparece
  em labels de capabilities dentro de `PublicAccessPlanCatalog`, não em um contrato de
  presentes.
- `lib/event-details-loader.ts` chama somente
  `GET /api/events/by-slug/{slug}/details` e espera `EventDetails` com `event`,
  `address` e `theme`; não lê presentes nem envelopes afetados.
- O único `/read-receipts` executável pertence ao chat clínico em
  `/api/care/v2/.../relationships/{id}/messages/read-receipts` e é um contrato distinto.
- O proxy administrativo tem consumidores apenas para access policies e care; não há
  chamada de UI que construa uma rota de presentes.
- As rotas de presentes encontradas em `contracts/openapi/` são snapshots de contrato,
  não código cliente executado pelo painel.

## Decisões e risco

- A Web permanece sem opt-in v2 até ganhar um consumidor real desse domínio; nesse
  momento o header deverá ser aplicado no cliente específico e coberto por teste.
- Risco residual: uma futura chamada dinâmica poderia escapar de uma busca textual;
  atualmente todos os construtores dinâmicos foram inspecionados e suas allowlists não
  incluem presentes.
- Nenhum guia de `node_modules/next/dist/docs/` foi necessário: não houve mudança em
  API, convenção ou código Next.js, apenas checkpoint documental.

## Verificações

- Auditoria com `rg` dos endpoints, termos de domínio, `fetch`, `API_BASE_URL`,
  `adminApi` e `professionalApiFetch`: nenhum consumidor afetado.
- `npm test`: 149/149 aprovados; permaneceram apenas os avisos existentes de
  `MODULE_TYPELESS_PACKAGE_JSON`.
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado com Next.js 16.4.5 e 22 páginas estáticas; a alteração
  gerada pelo build em `next-env.d.ts` foi restaurada ao conteúdo anterior.
- `git diff --check`: aprovado ao final.

## Ações não realizadas

- Nenhuma mudança de código, teste, contrato ou infraestrutura.
- Nenhum commit, push, deploy, publicação, migration ou alteração na API/Flutter.
