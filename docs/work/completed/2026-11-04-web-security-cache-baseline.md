# Baseline de headers, CSP e cache clínico — INT-09

- Status: implementação local concluída em 2026-11-04; WEB-003 parcial por depender de smoke/enforcement remoto; WEB-012 resolvido localmente com validação operacional pendente.
- Objetivo: reduzir exposição do site e portais por headers defensivos e impedir reaparecimento de dados clínicos revogados por cache serverless local.
- Headers entregues: `nosniff`, deny framing, referrer estrito, capabilities bloqueadas e CSP Report-Only global. Admin, profissional e APIs também usam `private, no-store, max-age=0`, compatibilidade HTTP legada de no-cache e `X-Robots-Tag` defensivo.
- CSP: origens Firebase/Google explícitas, domínio Firebase derivado somente de configuração válida, sem `unsafe-eval`, wildcards ou nonce improvisado. `unsafe-inline` permanece apenas em Report-Only até migração suportada e smoke real.
- Cache clínico: removido o `Map` de pacientes, ETag local e invalidação por instância. Cada leitura usa `cache: no-store` e consulta novamente a API; mutações e logout não mantêm cópias clínicas no processo.
- Teste de revogação: duas leituras sucessivas simulam 200 e depois 403, confirmando duas chamadas ao upstream e ausência de reaproveitamento.
- Verificações aprovadas: `npm run lint`, `npm run typecheck`, `npm test` (64/64), `npm run build`, testes focados de headers/revogação, smoke remoto contra servidor local configurado, inspeção HTTP dos headers e `git diff --check`.
- E2E: cobertura de headers foi adicionada à suíte; Chromium continua ausente localmente, mas os workflows instalam o browser antes da execução.
- Documentação: `docs/security/headers-and-csp.md` inventaria origens, limitações e caminho para enforcement; release gate passa a verificar o baseline.
- Pendências externas: smoke Google/senha/TOTP em Preview/Production; coletor CSP aprovado; janela de observação; remoção suportada de `unsafe-inline`; ensaio de enforcement e rollback; confirmação operacional da revogação com API real.
- Ações não realizadas: deploy, alteração remota, segredo, commit, push ou edição em API/App.
