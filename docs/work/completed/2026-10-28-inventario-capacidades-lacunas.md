# Inventário de capacidades e lacunas do painel

- Data: 2026-10-28
- Status: concluído
- Objetivo: documentar capacidades existentes e lacunas do painel administrativo com evidências concretas no código.
- Escopo realizado: criado `docs/work/inventory.md`, cobrindo autenticação/sessão, acessos e demos, planos, cuidado profissional, piloto, denúncias, analytics, contratos e dívida transversal.
- Critérios atendidos: visão por domínio/tela/fluxo; evidências por caminho relativo; classificação `confirmado`, `parcial`, `não encontrado` e `incerto`; dependências de API/app; riscos; próximos pacotes sugeridos.
- Verificações: `git diff --check`; existência dos principais caminhos citados; amostragem das regras responsivas e das rotas administrativas.
- Dependências abertas: contratos administrativos continuam definidos localmente; paginação e envelopes de erro precisam de alinhamento com a API; consumo das capabilities deve ser validado no app Flutter.
- Próximo passo sugerido: priorizar cobertura automatizada dos fluxos administrativos sensíveis e preservação de `requestId` nos erros.
