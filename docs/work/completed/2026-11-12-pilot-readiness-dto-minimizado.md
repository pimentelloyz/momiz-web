# Prontidão do piloto com DTO minimizado

- Data: 2026-11-12
- Status: concluído
- Escopo: parser/projeção, UI de gates, concorrência otimista, testes e docs.

## Resultado

- O GET passa por parser allowlisted e mantém apenas resumo e gates com
  `id/key/label/description/status/decidedAt/updatedAt`. Decisor, atores, motivo,
  evidência e histórico retornados por ambientes antigos são descartados.
- A UI removeu decisor, histórico e exportação CSV. Motivo e referência seguem
  apenas como inputs locais necessários ao PATCH; não são preenchidos pelo GET.
- PATCH inclui `expectedUpdatedAt` quando o gate possui versão e omite o campo
  para gates legados sem `updatedAt`.
- O conflito `PROFESSIONAL_PILOT_GATE_VERSION_CONFLICT` força recarga GET e
  relança o `AdminApiError` original. O gate mostra erro/requestId localizado,
  sem emitir sucesso e sem repetir/sobrescrever a mutação stale.
- Consultas GET usam versão local para ignorar respostas antigas. Estados de
  loading, vazio, erro, sucesso e validações acessíveis foram preservados.

## Verificações

- `node --test test/admin-pilot-readiness.test.ts test/admin-query-state.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Dívida

Gates legados sem versão continuam aceitos temporariamente. Quando todos os
ambientes garantirem `updatedAt`, o campo poderá tornar-se obrigatório no parser
e no PATCH.
