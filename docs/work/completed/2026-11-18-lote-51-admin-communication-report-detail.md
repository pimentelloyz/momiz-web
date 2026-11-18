# Detalhe sob demanda de denúncias administrativas

- Data: 2026-11-18
- Status: concluído
- Escopo: fila e detalhe de denúncias no painel administrativo Web.

## Resultado

- A listagem usa um contrato mínimo fechado, renderiza somente categoria,
  status, data e identificador, e preserva paginação, cursor e deduplicação.
- A seleção consulta `GET care/communication-reports/{reportId}` sob demanda,
  com estados explícitos de carregamento, erro e nova tentativa.
- Respostas de detalhe são aceitas somente quando ID e versão ainda coincidem
  com a seleção ativa; respostas obsoletas não alteram a interface.
- Os parsers de lista e detalhe rejeitam chaves excedentes em todos os níveis.
  O contrato de detalhe não contém email.
- A resolução usa o detalhe selecionado, invalida o contexto encerrado e
  reconcilia fila, nova seleção/detalhe e métricas autoritativas.

## Verificações

- `node --test test/admin-report-pagination.test.ts` (6 testes aprovados)
- `npm test` (149 testes aprovados)
- `npm run lint`
- `npm run typecheck`
- `git diff --check`
- `npm run build` compilou, executou TypeScript e gerou 22 páginas, mas terminou
  com exit 1 porque o Next.js 16.4.3 bloqueou o comando com um aviso de
  vulnerabilidade conhecida e recomendação de upgrade.

## Dependências

- Implementado contra o contrato do lote 51 fornecido pela API.
- Nenhuma alteração necessária na API ou no aplicativo Flutter.
- A atualização de segurança do Next.js ficou fora do escopo deste pacote.
