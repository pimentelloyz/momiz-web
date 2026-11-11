# Paginação da fila administrativa de denúncias

- Data: 2026-11-11
- Status: concluído
- Escopo: fila de denúncias, parser de página, estados localizados, mock e testes.

## Resultado

- A primeira página envia `status` e `limit=50`; “carregar mais” acrescenta o
  cursor opaco somente à consulta do mesmo status.
- O payload prefere `items`, aceita temporariamente o alias `reports` e mescla
  páginas por `id`, atualizando repetições sem duplicar a fila.
- Loading, erro correlacionado e retry da continuação ficam junto à lista e não
  removem denúncias já carregadas. O cursor nunca aparece em UI ou mensagens.
- O botão de continuação é nativo e expõe `disabled` e `aria-busy` durante a
  consulta.
- Troca de status e resolução/descarte invalidam respostas antigas. A mutação só
  confirma sucesso depois da primeira página e métricas autoritativas.
- O mock local publica `items`, `reports` e `nextCursor` durante a transição.

## Verificações

- `node --test test/admin-report-pagination.test.ts test/admin-query-state.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Compatibilidade e dívida

O fallback para `reports` deve ser removido quando todos os ambientes publicarem
`items`. A Web não interpreta a ordem ou o conteúdo do cursor HMAC; preserva a
ordem autoritativa retornada pela API.
