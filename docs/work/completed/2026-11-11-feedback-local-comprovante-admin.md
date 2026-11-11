# Feedback localizado do comprovante profissional

- Data: 2026-11-11
- Status: concluído localmente
- Objetivo: remover o último feedback global do review profissional e tratar a
  URL temporária do comprovante como dado sensível e efêmero.

## Entrega

- Cada credencial possui estado independente de pending, erro e sucesso; somente
  seu botão é bloqueado durante a obtenção.
- O parser aceita apenas HTTPS ou HTTP explicitamente local para desenvolvimento,
  seguindo o padrão já usado nos documentos profissionais.
- Payload ausente, malformado ou com protocolo inseguro produz `AdminApiError`
  com code fixo, status 502 e `requestId` seguro quando fornecido.
- A URL nunca integra erro, feedback, log ou estado React. Ela permanece em
  variável transitória e é usada imediatamente para `location.replace/assign`.
- Popup é fechado em falha; 401 continua encerrando a sessão.
- Uma credencial com falha não bloqueia a abertura de outra nem as demais
  mutações do painel.
- O review profissional deixou de receber `onMessage`; todas as operações dessa
  superfície agora possuem feedback localizado.

## Verificações

- `node --test test/admin-api-client.test.ts test/admin-credential-download.test.ts test/admin-query-state.test.ts test/admin-primitives.test.ts`
  — 15/15 testes aprovados.
- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm run build` — aprovado com Next.js 16.4.3.
- `git diff --check` — aprovado.

## Dívida residual

- Falta smoke autenticado em Preview para bloqueio de popup e expiração real da
  URL assinada.
- Outras superfícies administrativas ainda podem usar a faixa global conforme
  seus próprios fluxos; o review profissional está totalmente localizado.
