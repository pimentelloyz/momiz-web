# Relationships administrativas minimizadas e paginadas

- Data: 2026-11-12
- Status: concluído
- Localização: seção enxuta em `ProfessionalCareReviewPanel`, junto às demais
  operações administrativas de cuidado.

## Resultado

- A Web consulta `care/relationships` com `limit=50` e status opcional. “Todas”
  omite o parâmetro; os seis estados contratuais são enviados literalmente.
- O parser prefere `items`, aceita temporariamente `relationships` e reconstrói
  cada vínculo somente com a allowlist contratual. Campos extras de identidade,
  credenciais, consentimento ou razões são descartados; scopes preservam apenas
  `capability`.
- A UI mostra IDs, profissão, status, datas e capabilities ativas, sem inferir
  nomes, e-mails, fotos ou qualquer identidade ausente.
- Loading, vazio, erro e sucesso são localizados. Falha de continuação mantém os
  vínculos e o `requestId`; retry repete somente o GET afetado.
- Páginas são mescladas por `id`; a troca de status invalida cursor e respostas
  em voo. O cursor opaco não entra na UI ou em mensagens.
- Select e botões têm semântica nativa; carregamento incremental usa `disabled`
  e `aria-busy`.

## Verificações

- `node --test test/admin-relationship-pagination.test.ts test/admin-query-state.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Compatibilidade e dívida

Remover o fallback `relationships` quando todos os ambientes publicarem `items`.
A seção permanece somente leitura e operacional, sem expansão para investigação
de identidade ou conteúdo clínico.
