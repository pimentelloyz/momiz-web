# Fila de perfis com item aninhado mínimo

- Data: 2026-11-12
- Status: concluído
- Escopo: parser profundo, tipos do painel, paginação, mock e testes.

## Resultado

- `admin-profile-pagination` agora projeta profundamente perfil, user,
  credenciais e review logs, validando UUIDs, enums, datas ISO, nullability,
  cursor e limite máximo de 50 itens em cada coleção aninhada.
- `items` permanece preferido e `profiles` segue como alias temporário. Merge por
  ID, paginação, invalidação stale e estados localizados não mudaram.
- Campos removidos são descartados em todos os níveis: dados ampliados do perfil,
  user id/foto, storage/review da credencial e actor/metadata/credentialIds dos
  logs nunca entram no estado React.
- A UI deixou de ler `credential.specialty` e `reviewLog.actor`. Credenciais usam
  emissor e o histórico exibe apenas os campos mínimos retornados.
- `updatedAt` passou a ser obrigatório no item atual e alimenta sempre o CAS do
  review. O botão de comprovante continua condicionado a `documentFileName`.

## Nullability

O uso existente confirmou `submittedAt`, `verifiedAt`, cidade, estado, bio,
issuer, registro, jurisdição, expiração, nome do documento, renovação e
`reviewedAt` como nullable. `createdAt/updatedAt`, IDs, enums, user name/email e
campos estruturais são obrigatórios.

## Verificações

- `node --test test/admin-profile-pagination.test.ts test/admin-professional-review.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- smoke Chromium de download de credencial — 3/3
- `git diff --check`

## Dívida

Remover o alias `profiles` quando todos os ambientes publicarem `items`. Nenhuma
outra incompatibilidade de nullability foi encontrada.
