# Feedback localizado das métricas administrativas

- Data: 2026-11-11
- Status: concluído localmente
- Objetivo: impedir que uma falha secundária de métricas pareça um conjunto
  válido de zeros no review profissional.

## Entrega

- O bloco de indicadores operacionais possui estados próprios de loading, vazio,
  erro e sucesso, sem bloquear as outras áreas do painel.
- Em erro, nenhum contador é renderizado. O `AdminApiError` permanece intacto e
  a interface anuncia mensagem e `requestId` em live region assertiva.
- O retry chama somente o `GET care/metrics`; nenhuma mutação é repetida.
- Uma resposta bem-sucedida com todos os indicadores zerados recebe estado vazio
  explícito, diferenciando ausência confirmada de dados e falha parcial.
- Após resolver uma denúncia, a métrica é relida da autoridade da API em vez de
  ser inferida localmente.
- O estado genérico de consulta preserva o erro original, incluindo code,
  requestId e status, para consumo localizado.

## Verificações

- `node --test test/admin-api-client.test.ts test/admin-query-state.test.ts test/admin-primitives.test.ts`
  — 8/8 testes aprovados.
- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm run build` — aprovado com Next.js 16.4.3.
- `git diff --check` — aprovado.

## Dívida remanescente

- Filas de perfis, denúncias e prontidão ainda encaminham erros para a faixa
  global e são os próximos candidatos a estado/retry localizado.
- Não foi executado smoke autenticado em Preview nem configurada observabilidade
  externa neste pacote local.
