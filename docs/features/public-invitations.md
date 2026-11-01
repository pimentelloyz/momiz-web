# Convites públicos e deep links

**Estado:** `IMPLEMENTED`.

## Escopo entregue

- página pública por slug com capa, tema, título, descrição, data, local, dress code e mensagem final quando retornados pela API;
- suporte ao identificador opcional do convidado sem expô-lo em documentação ou logs;
- diferenciação entre erro transitório e convite inexistente;
- metadados Open Graph derivados do evento;
- CTA para abrir o convite no aplicativo e alternativa para download;
- fallback privado por UUID de evento, sem renderizar detalhes sensíveis no navegador.

## Rotas web

- `GET /convite/[slug]`: convite renderizado no servidor.
- `GET /events/[eventId]`: fallback `noindex` que encaminha ao aplicativo.

## Contratos consumidos

- `GET /api/events/by-slug/{slug}/details` com query opcional de convidado, chamado por `lib/event-details-loader.ts`.
- o contrato é normalizado em `lib/event-details.ts`; endereço redigido é apresentado como parcial.
- deep links são construídos e validados em `lib/deep-links.ts`.

## Perfis e limitações

- público: pode visualizar apenas o payload público autorizado pela API.
- convidado identificado: o parâmetro pode permitir conteúdo contextual definido pela API.
- confirmação de presença, seleção de participação e presentes não são executados na web; o CTA transfere a jornada ao app (`PARTIAL` em relação à jornada completa do convite).

## Evidências

- `app/convite/[slug]/page.tsx`
- `app/events/[eventId]/page.tsx`
- `lib/event-details-loader.ts`
- `lib/event-details-server.ts`
- `lib/event-details.ts`
- `lib/invite-helpers.ts`
- `lib/deep-links.ts`

## Testes e validação

- `test/event-details-loader.test.ts`
- `test/invite-helpers.test.ts`
- `test/deep-links.test.ts`
- `npm test`

