# Care analytics com DTO fechado e supressão por coorte

- Data: 2026-11-12
- Status: concluído
- Escopo: parser allowlisted, painel, filtros/estados, CSV e testes.

## Resultado

- O parser exige envelope, timestamps/período ISO, política exata de privacidade,
  seis totais fixos e contagens visíveis inteiras seguras `>= 5` ou totais
  explicitamente suprimidos com `value:null`.
- As oito dimensões e seus enums são allowlisted e obrigatórios. Arrays vazios
  comunicam que suas linhas foram suprimidas, nunca que a dimensão vale zero;
  chaves desconhecidas e campos extras não entram no estado ou CSV.
- Períodos inválidos ou acima de 366 dias falham antes da rede. Loading, estado
  inicial vazio, erro com `requestId`/retry e relatório pronto são localizados e
  acessíveis.
- O CSV percorre somente totais/grupos conhecidos e não exporta categorias
  suprimidas. Totais suprimidos continuam marcados sem valor.
- Cada geração recebe versão local; resposta anterior não sobrescreve a mais
  recente nem emite sucesso global stale.

## Verificações

- `node --test test/admin-care-analytics.test.ts` — 6 testes aprovados
- `npm test` — 132 testes aprovados
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Dívida

Nenhuma dívida contratual nova. O aviso Node `MODULE_TYPELESS_PACKAGE_JSON` já
existia na suíte e permanece fora deste escopo.
