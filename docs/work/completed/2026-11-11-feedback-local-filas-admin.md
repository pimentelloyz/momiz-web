# Feedback localizado das filas administrativas

- Data: 2026-11-11
- Status: concluído localmente
- Objetivo: distinguir falha parcial de fila vazia em perfis/credenciais e
  denúncias, com retry isolado e correlação acessível.

## Entrega

- A fila de perfis e credenciais possui loading, vazio confirmado, erro e sucesso
  próprios. Em falha, detalhes não apresentam estado vazio enganoso.
- A fila de denúncias possui os mesmos quatro estados de consulta.
- Cada erro mantém o `AdminApiError` original e anuncia mensagem e `requestId`
  em live region assertiva.
- O retry de perfis chama apenas `GET care/profiles`; o retry de denúncias chama
  apenas `GET care/communication-reports` com o filtro selecionado.
- Revisões de perfil recarregam a fila de perfis; resolução de denúncia recarrega
  denúncias e métricas da API, sem inferir listas ou contadores localmente.
- Uma falha em uma fila não impede o sucesso nem dispara retry da outra.

## Verificações

- `node --test test/admin-api-client.test.ts test/admin-query-state.test.ts test/admin-primitives.test.ts`
  — 9/9 testes aprovados.
- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm run build` — aprovado com Next.js 16.4.3.
- `git diff --check` — aprovado.

## Dívida remanescente

- A consulta inicial de prontidão do piloto ainda encaminha erro para a faixa
  global; sua edição auditável foi mantida fora deste pacote para não misturar
  o retry de leitura com mutações de gates.
- Não foi executado smoke autenticado em Preview.
