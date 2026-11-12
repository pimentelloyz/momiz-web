# Review profissional mínimo e concorrente

- Data: 2026-11-12
- Status: concluído
- Escopo: payload/parser, concorrência otimista, painel e testes.

## Resultado

- O payload envia somente `decision`, motivo obrigatório/trimado para decisões
  diferentes de verify e `expectedUpdatedAt` quando o perfil atual possui versão.
  Perfis legados omitem a versão; motivo acima de 1000 caracteres falha localmente.
- A resposta 200 é projetada somente para `profile.id`, `verificationStatus`,
  `updatedAt` e `reviewedRenewal`; user, credentials, reason e extras são
  descartados e não dirigem a UI.
- Sucesso exige resposta mínima válida e recarga autoritativa da primeira página.
  Métricas são recarregadas em fonte própria sem converter falha secundária em
  falso erro da revisão já confirmada.
- Conflito `PROFESSIONAL_REVIEW_VERSION_CONFLICT` executa um único GET de
  reconciliação, não repete o POST, relança o erro/requestId original e não emite
  sucesso. A seleção é preservada se o perfil existir ou movida coerentemente
  pela recarga da fila.
- Estado de mutação é isolado por profile ID; respostas antigas da fila continuam
  invalidadas pelo versionamento já existente. 401 preserva o fluxo de sessão.

## Verificações

- `node --test test/admin-professional-review.test.ts test/admin-profile-pagination.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Dívida

`expectedUpdatedAt` permanece opcional apenas para perfis legados. Após a
migração completa, o campo pode se tornar obrigatório no tipo da listagem e no
builder do POST.
