# Rastreabilidade web — gestão de equipe médica

## Mapa F01–F13

| Feature | Estado web | Superfície principal | Pacote | Evidência atual |
| --- | --- | --- | --- | --- |
| F01 Contextos, perfis e autorização | parcial | Profissional/admin | MT-01 | `app/profissional/api/session/route.ts`, `app/profissional/ui/professional-dashboard.tsx` |
| F02 Cadastro e verificação | parcial | Admin/profissional | MT-01, MT-10 | `app/admin/ui/professional-care-review-panel.tsx`, `app/profissional/ui/professional-dashboard.tsx` |
| F03 Convites, vínculos e encerramento | parcial | Profissional; gestante no app | MT-02 | `app/profissional/ui/professional-dashboard.tsx`; convites de clínica em `app/profissional/ui/clinic-team-panel.tsx` não são convites de cuidado |
| F04 Consentimentos, scopes e grants | parcial | Profissional read-only; gestante no app | MT-02, MT-04 | tipo `Relationship.scopes` em `app/profissional/ui/professional-dashboard.tsx`, sem UI |
| F05 Painel e pacientes | parcial | Profissional | MT-03 | `app/profissional/ui/professional-dashboard.tsx` |
| F06 Exames compartilhados | não encontrado | Profissional; gestante no app | MT-04 | `EXAM` é apenas tipo de agenda; não há UI documental |
| F07 Consultas e agenda | parcial | Profissional | MT-05 | `app/profissional/ui/professional-dashboard.tsx`, `lib/professional/agenda.ts` |
| F08 Comunicação segura | não encontrado | Profissional | MT-06 | denúncia admin não equivale a chat: `app/admin/ui/professional-care-review-panel.tsx` |
| F09 Contrações e suspeita de bolsa | não encontrado | App; profissional read-only futuro | MT-07 | nenhuma rota/componente web encontrado |
| F10 Notificações e preferências | não encontrado | Profissional/configurações | MT-08 | nenhuma rota/componente web encontrado |
| F11 Planos, entitlements e quotas | parcial | Admin/profissional | MT-09 | `app/admin/ui/access-package-policy-panel.tsx`, `app/admin/ui/admin-dashboard.tsx` |
| F12 Auditoria, privacidade e operação | parcial | Admin/transversal | MT-10 | `app/admin/ui/professional-care-review-panel.tsx`, `app/admin/ui/care-analytics-panel.tsx` |
| F13 Clínicas e expansão | parcial | Profissional | Pós-MT-10 | `app/profissional/ui/clinic-team-panel.tsx` |

## Mapa MT-01–MT-10

| Pacote | Entrega web | Pré-requisitos e gate |
| --- | --- | --- |
| MT-01 | seletor/contexto explícito, sessão contextual, estados sem perfil/negado; evolução da pendência profissional | fonte da gestação, modelo de perfis/acompanhante, OpenAPI e matriz A/B aprovados |
| MT-02 | estados de convite/vínculo, retomada segura e leitura de scopes/grants | MT-01; estados finais, tokens/deep links e idempotência publicados |
| MT-03 | pacientes paginadas, busca/filtros server-side e detalhe autorizado por gestação | MT-01/02; cursor e DTO minimizado publicados |
| MT-04 | documentos compartilhados, detalhe/download curto, notas e revogação visível | MT-01/02; grants, retenção, MIME/tamanho e storage aprovados |
| MT-05 | agenda transacional, respostas, reagendamento, histórico e conflitos | MT-01/02; máquina de estados/timezone aprovada |
| MT-06 | chat por vínculo, não lidas, retry e aviso não emergencial | decisão comercial, retenção/exportação e vínculo estável |
| MT-07 | feed profissional autorizado de eventos; fluxo local-first permanece no app | texto clínico e modelo/sync aprovados; jamais bloquear orientação offline |
| MT-08 | preferências, deep links e estados técnicos de entrega | catálogo, TTL, outbox e eventos de MT-02/04/05/06/07 |
| MT-09 | plano/quota do perfil, paywall contextual e recuperação de origem | MT-01; preços/limites/chat e `getEntitlements` aprovados |
| MT-10 | auditoria consultável, requestId, testes IDOR, observabilidade, flags e piloto | gates clínico, jurídico, segurança, MFA e operação aprovados |

## Critérios transversais web

| Critério | Features | Evidência web exigida |
| --- | --- | --- |
| Contexto errado não revela dados | F01, F05, F11 | testes E2E A/B, troca rápida e deep link em outro contexto |
| Sem consentimento não há lista, cache ou download | F04, F06 | contratos negativos e teste por ID direto |
| Revogação encerra novos acessos | F03, F04, F08, F10 | UI recebe estado canônico e invalida cache; integração API comprovada |
| Paciente A não aparece em B | F05–F08 | paginação/filtros/exportação testados server-side; sem filtro de segurança no cliente |
| Downgrade preserva dados próprios | F06, F11 | owner ainda lista/baixa/exporta; somente criação bloqueada |
| Reagendamento não mantém reminder antigo | F07, F10 | teste de contrato/outbox; web exibe versão vigente |
| Parto não promete diagnóstico/atendimento | F09 | textos aprovados e teste offline do app; web separa enviado/lido/atendido |
| Logs não contêm conteúdo clínico | F12 | teste de schema, `requestId` e inspeção de eventos |

## Decisões bloqueantes

| Decisão | Bloqueia | Donos esperados |
| --- | --- | --- |
| Fonte de verdade da gestação e migração de `patientUserId` | MT-01 em diante | Produto + arquitetura |
| Perfis múltiplos e acompanhante | MT-01/02 | Produto + segurança |
| Estados finais de convite/vínculo | MT-02 | Produto + API/app/web |
| Grants por recurso além de documentos | MT-02/04 | Produto + privacidade |
| Confirmação/transições de consulta | MT-05 | Produto + clínica |
| Chat bilateral ou patrocinado | MT-06/09 | Produto + comercial |
| Retenção/exportação de mensagens e documentos | MT-04/06/10 | Jurídico + produto |
| Texto e modelo de contrações/bolsa | MT-07 | Clínica + jurídico + arquitetura |
| Preços, quotas e tamanho de upload | MT-04/09 | Produto + comercial |
| MFA, RLS e segregação adicional | MT-10 | Segurança + arquitetura |
| Base legal, suboperadores e transferência | Piloto/produção | Jurídico/DPO |

## Testes existentes e lacunas

Existem testes unitários da allowlist profissional e filtros/query da agenda em `test/professional-portal.test.ts`; o E2E apenas valida isolamento visual/noindex do login em `e2e/smoke.spec.ts`. Não há testes admin.

Cada pacote deve acrescentar contrato e E2E proporcionais: autenticação/MFA e sessão; erro canônico; autorização negativa/IDOR; expiração/replay; concorrência/idempotência; timezone; offline/retry; quota/downgrade; acessibilidade/teclado; loading, vazio, erro, denied, plan, pending e terminated. `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` e `npm run test:e2e` são o conjunto web de referência.

## Rollout do programa

Cada MT entra atrás de flag server-authoritative, começa em ambiente não produtivo com contas sintéticas, avança para equipe interna e piloto allowlisted, e só então amplia coorte. O rollback desativa novas ações sem apagar dados, revogar evidência ou quebrar leitura do titular. Métricas devem ser agregadas e sem conteúdo clínico. MT-10 valida rollback, runbook, alertas, auditoria e gates externos.
