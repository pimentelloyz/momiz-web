# Auditoria administrativa minimizada e paginada

- Data: 2026-11-11
- Status: concluído
- Localização: seção enxuta em `ProfessionalCareReviewPanel`, onde já ficam as
  métricas e operações administrativas de cuidado.

## Resultado

- A Web consulta `care/audit-logs` com `limit=50` e `patientUserId` opcional,
  validado como UUID antes de alterar o filtro.
- O parser prefere `items`, aceita temporariamente `auditLogs` e reconstrói cada
  item somente com os campos minimizados do contrato. Campos extras como nome,
  e-mail ou metadata são descartados mesmo se retornarem por engano.
- A seção exibe identificadores operacionais, recurso, ação, outcome, horário e
  `requestId`, sem tentar inferir PII removida.
- Loading, vazio, erro e sucesso são localizados. Falha de continuação preserva
  itens e correlação; retry repete somente o GET afetado.
- Páginas são mescladas por `id`; filtro/recarga invalidam cursor e respostas em
  voo. O cursor opaco nunca é exibido ou registrado.
- Filtro e botões têm rótulos nativos; validação usa `aria-invalid`/`role=alert`
  e carregamento incremental usa `disabled`/`aria-busy`.

## Verificações

- `node --test test/admin-audit-pagination.test.ts test/admin-query-state.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Compatibilidade e dívida

Remover o fallback `auditLogs` quando todos os ambientes publicarem `items`. A
superfície continua deliberadamente operacional e não oferece busca por conteúdo
ou investigação clínica complexa.
