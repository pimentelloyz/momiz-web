# Feedback localizado das mutações de cuidado administrativo

- Data: 2026-11-11
- Status: concluído localmente
- Objetivo: localizar pending, erro e sucesso das mutações críticas após a
  localização das consultas do review profissional.

## Entrega

- Revisão, correção, rejeição e suspensão de perfil/credencial compartilham um
  estado de mutação local no detalhe selecionado.
- Resolução e descarte de denúncia possuem estado próprio na seção de moderação.
- Cada gate possui estado independente por chave; registrar um gate bloqueia
  somente seu botão, sem impedir decisões em outros gates.
- Erros preservam `AdminApiError`, incluindo code, requestId e status, e são
  anunciados em live region assertiva no bloco da operação.
- Pending e sucesso usam live regions polidas; validações locais também aparecem
  no bloco correspondente, sem duplicação na faixa global.
- Sucesso é emitido somente após GET autoritativo: perfis e métricas após revisão,
  denúncias e métricas após moderação, prontidão após alteração de gate.
- Falha no refresh autoritativo impede sucesso e permanece como erro local.

## Verificações

- `node --test test/admin-api-client.test.ts test/admin-query-state.test.ts test/admin-primitives.test.ts`
  — 12/12 testes aprovados.
- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm run build` — aprovado com Next.js 16.4.3.
- `git diff --check` — aprovado.

## Dívida residual

- A abertura do comprovante de credencial ainda usa a faixa global em caso de
  falha; ela é uma obtenção efêmera de URL, não uma mutação de revisão.
- Demais superfícies administrativas fora do review profissional continuam com
  seus padrões atuais de feedback.
- Não foi executado smoke autenticado em Preview.
