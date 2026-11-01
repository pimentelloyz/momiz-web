# Capability de entrega ao anfitrião na web

- Data: 2026-11-01.
- Objetivo: tornar `gift.host_delivery` legível no painel administrativo sem duplicar a regra comercial da API.
- Implementação: label, descrição e grupo adicionados à metadata administrativa; documentação do domínio atualizada.
- Decisão: nenhum fluxo de checkout foi criado na web. A landing já consome os recursos e labels publicados por `GET /api/billing/plans`.
- Validação: 50 testes aprovados, lint, typecheck e `git diff --check`.
- Ações não realizadas: commit, push, deploy ou migration.
