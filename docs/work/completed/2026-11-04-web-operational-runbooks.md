# Runbooks e ownership operacional — WEB-016

- Status: baseline local concluído em 2026-11-04; INT-17/WEB-016 permanece parcial até owners/metas aprovados, alerta com ack observado e game day remoto autorizado.
- Objetivo: permitir que uma pessoa sem contexto diagnostique login, release, termos e deep links, escale com segurança e prepare rollback autorizado.
- Entregas: índice operacional; RACI por papéis; SLO/RPO/RTO marcados como propostas; checklist P1/P2/P3 de ack/escalonamento; runbooks de login, incidentes, termos/deep links, configuração e rollback; validator na CI; game day local com relatório JSON ignorado pelo Git.
- Segurança: requestId aceita apenas a allowlist documentada; evidência exclui payload, cookie, token, sessão, e-mail e secrets; dry-run usa somente `127.0.0.1` e processos locais.
- Evidência do dry-run: `artifacts/runbook-game-day-report.json`, modo `local-dry-run-no-remote-mutation`, seis checks aprovados — validator, preflight, stale gate OpenAPI, tabletop de rollback e manifests Apple/Android.
- Ownership: nenhum nome foi inventado. Papéis, escala, substitutos, canais e autoridade de rollback exigem confirmação organizacional.
- Metas: disponibilidade, ack, RTO e RPO são propostas operacionais, não SLA aprovado nem medição ativa.
- Verificações: `npm run operations:validate`, `npm run operations:game-day`, lint, typecheck, testes, build e `git diff --check`.
- Ações não realizadas: deploy/rollback, acesso a Vercel/Firebase, login real, secret, alteração em API/App, commit ou push.
- Próximo passo: aprovar papéis/metas e agendar game day de Preview com rollback controlado e registro dos tempos reais.
