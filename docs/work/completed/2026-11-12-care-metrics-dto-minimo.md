# Care metrics com DTO mínimo explícito

- Data: 2026-11-12
- Status: concluído
- Escopo: parser allowlisted, integração do painel, concorrência e testes.

## Resultado

- O cast direto foi substituído por parser dedicado que exige envelope `metrics`
  e os dez contadores contratuais como inteiros seguros não negativos.
- O parser projeta diretamente os nomes já usados pela UI. Campos extras de
  ambientes antigos, inclusive `generatedAt`, não entram no estado React.
- Loading, vazio quando todos os contadores são zero, erro correlacionado com
  retry e estado ready mantêm o comportamento e a acessibilidade existentes.
- Cada leitura recebe uma versão local; uma resposta antiga não sobrescreve a
  consulta mais recente iniciada por retry ou recarga após mutação.

## Verificações

- `node --test test/admin-care-metrics.test.ts test/admin-query-state.test.ts`
- `npm test` — 126 testes aprovados
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Dívida

Nenhuma dívida contratual nova. O aviso Node sobre package sem `type: module` já
existia na suíte e não afeta o resultado dos testes.
