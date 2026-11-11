# Feedback localizado da prontidão do piloto

- Data: 2026-11-11
- Status: concluído localmente
- Objetivo: completar a migração do review profissional removendo o erro global
  do carregamento da prontidão.

## Entrega

- O cartão de prontidão possui loading, vazio, erro e sucesso localizados.
- Uma falha não renderiza gates, contagens de aprovação nem aparência de
  prontidão válida; mensagem e `requestId` são anunciados no próprio cartão.
- O retry executa somente `GET care/pilot-readiness`, sem repetir métricas,
  filas ou mutações.
- Após `PATCH` de um gate, a prontidão e o histórico são relidos por GET antes
  do feedback de sucesso; a resposta da mutação não é usada como estado inferido.
- Falha e retry preservam o `AdminApiError` original, incluindo code,
  requestId e status.

## Verificações

- `node --test test/admin-api-client.test.ts test/admin-query-state.test.ts test/admin-primitives.test.ts`
  — 10/10 testes aprovados.
- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm run build` — aprovado com Next.js 16.4.3.
- `git diff --check` — aprovado.

## Dívida residual do painel

- Mensagens de validação e sucesso das mutações continuam na faixa global por
  serem feedback transversal da operação, não falha de consulta.
- Falhas de mutação de revisão, moderação e gates ainda usam a faixa global;
  apenas os carregamentos e retries idempotentes foram localizados.
- Não foi executado smoke autenticado em Preview.
