# Planos e capabilities

**Estado:** `IMPLEMENTED`.

## Catálogo público

- a landing consome `GET /api/billing/plans` e mostra FREE, STANDARD e PRO;
- recursos `care.*` são omitidos dos cards públicos de planos;
- limites de eventos distinguem o plano Standard, que amplia o chá atual, do Pro, que permite mais chás;
- fallback local mantém a página disponível se o catálogo remoto falhar.

## Administração da matriz

- visualização da policy publicada e histórico;
- criação, retomada, salvamento e descarte de rascunho;
- edição de capabilities booleanas e limites numéricos;
- validação, diff e prévia de impacto antes da publicação;
- publicação com controle otimista da versão atual;
- clonagem de versão anterior para rollback seguro;
- consulta de diff histórico.

## Contratos administrativos consumidos

- `GET /api/admin/access/package-policies/current`;
- `GET /api/admin/access/package-policies/history?pageSize=30`;
- `POST /api/admin/access/package-policies/drafts`;
- `PUT|DELETE /api/admin/access/package-policies/drafts/{id}`;
- `POST /api/admin/access/package-policies/drafts/{id}/validate`;
- `POST /api/admin/access/package-policies/drafts/{id}/publish`;
- `GET /api/admin/access/package-policies/{id}/diff`;
- `GET /api/admin/access/package-policies/{id}/impact-preview`;
- `POST /api/admin/access/package-policies/{id}/clone`.

## Estados e limitações

- `IMPLEMENTED`: leitura e operação administrativa no código.
- publicação depende de autorização, consistência e versão da API.
- preços e assinaturas das lojas não são administrados por este painel (`EXTERNAL_VALIDATION_REQUIRED`).
- a matriz na web não é autoridade; a API aplica a decisão final.

## Evidências

- `lib/access-plan-catalog.ts`
- `app/page.tsx`
- `app/admin/ui/access-package-policy-panel.tsx`
- `app/admin/ui/access-policy-metadata.ts`
- `app/admin/ui/access-policy-types.ts`

## Testes e validação

- `test/access-plan-catalog.test.ts`
- criar rascunho, salvar, validar, conferir diff/impacto e publicar em ambiente autorizado;
- `npm test && npm run typecheck`.

