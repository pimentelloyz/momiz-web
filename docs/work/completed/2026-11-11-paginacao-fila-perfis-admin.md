# Paginação da fila administrativa de perfis

- Data: 2026-11-11
- Status: concluído
- Escopo: fila de perfis/credenciais, parser de página, estados localizados,
  fixture E2E e testes focados.

## Resultado

- A primeira consulta envia `status` e `limit=50`; continuações acrescentam o
  cursor opaco somente à requisição do mesmo filtro.
- O payload prefere `items` e mantém fallback temporário para `profiles`. O mock
  local publica os dois campos durante a transição.
- Páginas seguintes são mescladas por `id`, atualizando repetições sem duplicar
  a fila. O cursor não aparece na UI, mensagens ou logs.
- Loading, erro correlacionado e retry de “carregar mais” são localizados e não
  apagam os perfis já carregados. O botão nativo expõe `disabled` e `aria-busy`.
- Troca de status descarta a lista/cursor anterior. Revisões bem-sucedidas usam
  a mesma recarga autoritativa da primeira página antes de confirmar sucesso.

## Verificações

- `node --test test/admin-profile-pagination.test.ts test/admin-query-state.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Compatibilidade e dívida

O alias `profiles` pode ser removido do parser quando todos os ambientes
publicarem `items`. A fila usa explicitamente 50 itens, igual ao default atual da
API, para manter o comportamento determinístico se o default mudar.
