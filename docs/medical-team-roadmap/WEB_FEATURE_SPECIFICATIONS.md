# Especificações web F01–F13 — gestão de equipe médica

Este catálogo materializa as features centrais nas superfícies web. Os contratos lógicos e o OpenAPI da API precedem qualquer implementação. Nomes de rotas abaixo são responsabilidades lógicas; uma rota Next/proxy só pode ser criada depois do contrato upstream publicado.

## Regras comuns de experiência e segurança

Toda tela nova deve tratar, quando aplicável, `loading`, vazio inicial, vazio por filtro, erro com retry e `requestId`, offline, acesso negado, plano insuficiente, verificação pendente e vínculo encerrado. Estado desconhecido usa fallback seguro, nunca concede ação. Acessibilidade exige HTML semântico, label/nome acessível, foco visível e restaurado, teclado, anúncios `status`/`alert`, contraste, redução de movimento e teste em viewport móvel. Nenhum filtro cliente substitui autorização server-side.

Dados clínicos não vão para URL, analytics, logs, cache compartilhado ou preview público. Sessão, perfil, contexto de gestação/clínica, vínculo, scope, grant e entitlement são resolvidos no servidor. Erros seguem `{ code, message, requestId }`; mutações repetíveis usam `idempotencyKey` e versão quando definida no contrato central.

## F01 — Contextos, perfis e autorização

- **Superfícies:** portal profissional; admin apenas identifica papel administrativo; pública somente retorno seguro de autenticação. A gestante/acompanhante permanece no app.
- **Existente — parcial:** sessão profissional isolada, perfil obrigatório e bloqueio de não verificados em `app/profissional/api/session/route.ts`, `lib/professional/professional-session.ts` e `app/profissional/ui/professional-dashboard.tsx`. Não há seletor de perfil/gestação.
- **Lacuna e mínimo web:** incluir contexto ativo visível e seletor quando a conta possuir mais de um perfil; invalidar queries/estado ao trocar; parametrizar detalhe por contexto opaco; não inferir gestação por `patientUserId`.
- **Telas/componentes/rotas:** shell contextual do portal, seletor acessível, estado “sem perfil”, retorno validado; BFF somente para `listProfiles` e `switchProfileContext` publicados.
- **Estados:** loading do contexto; vazio sem perfis; erro/retry; offline sem troca; denied no contexto errado; plan somente informativo; pending para perfil incompleto/verificação; terminated remove dados e oferece volta segura.
- **Acessibilidade:** contexto atual deve ser texto persistente, não apenas cor; troca anuncia resultado e move foco ao título.
- **Contrato/API:** `profileId`, `profileType`, `pregnancyId|clinicId`, versão de sessão e erros `PROFILE_NOT_FOUND`, `CONTEXT_DENIED`; API deny-by-default.
- **Segurança:** limpar memória/cache na troca; bloquear deep link, exportação e aba antiga de outro contexto; admin não herda acesso clínico.
- **Aceite/testes:** dois perfis e duas gestações não se misturam em rota, cache, exportação ou back/forward; testes negativos por papel/contexto.
- **Rollout/dependências:** MT-01 por flag e contas sintéticas; depende da fonte da gestação, modelo aditivo de perfis, API/OpenAPI e app.

## F02 — Cadastro e verificação profissional

- **Superfícies:** admin decide; portal profissional mostra status e encaminha correção; app mantém cadastro/submissão enquanto não houver decisão de duplicá-los.
- **Existente — parcial:** fila, credenciais, URL temporária, revisão, renovação e suspensão em `app/admin/ui/professional-care-review-panel.tsx`; página pendente em `app/profissional/ui/professional-dashboard.tsx`; login/MFA em `app/admin/ui/admin-login-form.tsx` e `app/profissional/ui/professional-login-form.tsx`.
- **Lacuna e mínimo web:** status detalhado e deep link seguro para correção; endurecer fila paginada e erros. Não criar formulário web paralelo sem contrato.
- **Telas/componentes/rotas:** fila admin, detalhe minimizado, modal de decisão justificada, histórico; card profissional de pendências. Reutilizar endpoints atuais somente após conferir OpenAPI.
- **Estados:** loading/vazio por fila; erro/retry/requestId; offline bloqueia decisão; denied para não admin; plan não aplicável; pending/correction/rejected/suspended/expired explícitos; terminated não concede pacientes.
- **Acessibilidade:** documentos abrem com aviso e nome acessível; decisão destrutiva confirma, prende/restaura foco e não depende de popup.
- **Contrato/API:** estados canônicos, versão, `reviewProfessionalProfile`, URL curta, erros `INVALID_CREDENTIAL`, `VERSION_CONFLICT`, `SIGNED_URL_EXPIRED`.
- **Segurança:** MFA, MIME/malware no servidor, minimização, URL assinada e auditoria sem dados clínicos.
- **Aceite/testes:** não verificado não acessa pacientes; URL expira; revisão concorrente conflita; MIME forjado falha; testes admin/portal/MFA.
- **Rollout/dependências:** MT-01/MT-10, allowlist de revisores e shadow metrics; depende de catálogo de profissões/documentos, API, app e segurança.

## F03 — Convites, vínculos e encerramento

- **Superfícies:** portal mostra/encerra vínculo profissional; resolução pública minimizada pode existir; criação/consentimento da gestante fica no app. Convites de clínica são F13, não esta feature.
- **Existente — parcial:** portal lista relationships em `app/profissional/ui/professional-dashboard.tsx`; admin agrega vínculos em `app/admin/ui/professional-care-review-panel.tsx`. Não há jornada web de convite de cuidado.
- **Lacuna e mínimo web:** estados canônicos, detalhe de finalidade antes do aceite, retomada segura pós-login e encerramento pelo profissional.
- **Telas/componentes/rotas:** página pública de resolução sem dados sensíveis, tela autenticada de aceite/declínio e ação de encerrar no detalhe do vínculo; BFF após `resolveInvitation`, `acceptInvitation`, `declineInvitation`, `terminateRelationship`.
- **Estados:** loading; convite indisponível sem enumerar; erro/rate limit; offline preserva intenção sem token em storage inseguro; denied/identity mismatch; plan/limit; pending/expired/revoked/used; terminated com leitura permitida somente por política.
- **Acessibilidade:** finalidade, emissor e ação terminal em linguagem clara; erros associados; confirmação de encerramento acessível.
- **Contrato/API:** token opaco/hash, sete dias configuráveis, versão, idempotência e erros `INVITATION_EXPIRED`, `ALREADY_USED`, `IDENTITY_MISMATCH`, `VERSION_CONFLICT`.
- **Segurança:** token fora de logs/analytics/referrer; rate limit, replay/enumeração, same-origin nas mutações, revogação imediata de novos acessos.
- **Aceite/testes:** aceite concorrente cria um vínculo; token reenviado invalida anterior; cold/background/login retomam; encerramento invalida cache.
- **Rollout/dependências:** MT-02 após MT-01, primeiro interno; depende de estados aprovados, API, universal links/app e notificações.

## F04 — Consentimentos, scopes e grants por recurso

- **Superfícies:** portal profissional somente leitura dos acessos recebidos; admin audita sem editar acesso clínico; gestante concede/revoga no app.
- **Existente — parcial:** `Relationship.scopes` está tipado mas não renderizado em `app/profissional/ui/professional-dashboard.tsx`; não há grants por documento.
- **Lacuna e mínimo web:** resumo compreensível de scopes/grants e efeito da revogação; invalidar detalhe/download ao mudar versão.
- **Telas/componentes/rotas:** painel “Acessos concedidos” no vínculo; histórico minimizado; componentes de capability com fallback. BFF read-only após contratos `grantAccess/revokeAccess/listGrants`.
- **Estados:** loading; vazio sem grants; erro/requestId; offline mostra snapshot marcado e bloqueia ação; denied; plan sem confundir com consentimento; pending change; terminated/revoked bloqueia novas leituras.
- **Acessibilidade:** permissões em lista textual, não matriz só por cor; mudanças anunciadas e impacto explicado.
- **Contrato/API:** consentimento/versionamento, recurso/destinatário, autor/tempo, optimistic concurrency, `GRANT_NOT_ALLOWED`, `GRANT_NOT_FOUND`, `VERSION_CONFLICT`.
- **Segurança:** revalidar cada lista/download no servidor; ID opaco; audit metadata allowlisted; especialidade nunca concede scope.
- **Aceite/testes:** remover scope/grant bloqueia listagem e URL direta; conflito não sobrescreve; teste IDOR A/B e cache revogado.
- **Rollout/dependências:** MT-02/04; depende do modelo de consentimento, API e UI da gestante no app.

## F05 — Painel profissional e lista de pacientes

- **Superfícies:** portal profissional; admin apenas métricas/auditoria, nunca a lista clínica operacional.
- **Existente — parcial:** lista simples, métricas e agenda em `app/profissional/ui/professional-dashboard.tsx`; proxy read-only em `lib/professional/care-proxy-policy.ts`.
- **Lacuna e mínimo web:** paginação cursor, busca/filtros server-side, gestação explícita, DPP/trimestre/pós-parto e resumo autorizado; detalhe por vínculo/gestação.
- **Telas/componentes/rotas:** `/profissional` paginado e rota de detalhe opaca; search/filter toolbar, cards minimizados, summary autorizado; proxy apenas após OpenAPI.
- **Estados:** loading/skeleton; vazio sem vínculos versus sem resultado; erro/retry/requestId; offline sem dados sensíveis persistentes; denied/revoked; plan insufficient; pending verification; paused/read-only/terminated distintos.
- **Acessibilidade:** busca com label, paginação/filtros por teclado, contagem anunciada, cards como links semânticos, título identifica contexto.
- **Contrato/API:** `listPatients` cursor estável e filtros server-side; DTO minimizado inclui `relationshipId`, `pregnancyId`, estado e resumos autorizados.
- **Segurança:** nunca carregar todas as pacientes para filtrar no cliente; cache por perfil/contexto; sem e-mail se desnecessário; exportação reautoriza.
- **Aceite/testes:** paciente não vinculada não aparece por pesquisa/cursor/URL; duas gestações são distintas; paginação estável; E2E A/B.
- **Rollout/dependências:** MT-03, reader primeiro; depende de MT-01/02 e API paginada.

## F06 — Exames e documentos compartilhados

- **Superfícies:** portal lista/visualiza documentos compartilhados; gestante gerencia upload/share no app; admin só audita metadados.
- **Existente — não encontrado:** `EXAM` é tipo de agenda em `app/profissional/ui/professional-dashboard.tsx`; não existe UI de documento clínico. Download admin em `professional-care-review-panel.tsx` é credencial, não exame.
- **Lacuna e mínimo web:** lista paginada, detalhe, download curto, notas/review e estado de grant; upload web só se produto aprovar.
- **Telas/componentes/rotas:** seção de documentos no detalhe da paciente, viewer seguro fora de URL pública, histórico de versões e notas; BFF após `list/share/downloadExam`.
- **Estados:** loading; vazio sem compartilhados; erro/retry; offline sem download/cache persistente por padrão; denied/grant revoked; quota/plan para criação; pending scan/upload; terminated bloqueia URL nova.
- **Acessibilidade:** viewer com alternativa de download, metadados legíveis, progresso anunciado, foco e zoom; nunca exigir percepção visual do documento.
- **Contrato/API:** PDF/JPEG/PNG, MIME/tamanho/malware, categoria/data/tags, versão, grant individual, URL curta, `FILE_TYPE_INVALID`, `QUOTA_EXCEEDED`, `SIGNED_URL_EXPIRED`.
- **Segurança:** storage privado, CSP, noindex, reautorização e logs; não incluir título clínico em analytics; owner mantém acesso acima da quota.
- **Aceite/testes:** IDOR A/B, revogação invalida URL nova, MIME falso falha, versão anterior auditável, downgrade preserva leitura.
- **Rollout/dependências:** MT-04 por flag e arquivos sintéticos; depende de MT-01/02, retenção, limites, API/storage e app.

## F07 — Consultas, agenda e lembretes

- **Superfícies:** portal profissional e app compartilham máquina; admin somente analytics/auditoria.
- **Existente — parcial:** leitura, filtros e ICS em `app/profissional/ui/professional-dashboard.tsx` e `lib/professional/agenda.ts`; sem mutações/histórico.
- **Lacuna e mínimo web:** detalhe, proposta/resposta, reagendamento/cancelamento, conflito, versão e histórico; disponibilidade depois.
- **Telas/componentes/rotas:** agenda paginada, detalhe/modal por estado, formulário com timezone/local/link e timeline; BFF após operações transacionais publicadas.
- **Estados:** loading/vazio/filtro vazio; erro/retry/requestId; offline read-only; denied; plan para recursos avançados; proposed/pending; cancelled/completed/no_show/terminated.
- **Acessibilidade:** datas com timezone textual, erros por campo, dialog acessível e ações não dependem de drag-and-drop/cor.
- **Contrato/API:** estados/transições por papel, versionamento, idempotência, `SCHEDULE_CONFLICT`, `TIMEZONE_INVALID`, `INVALID_TRANSITION`; reminders versionados.
- **Segurança:** vínculo/scope em cada ação; notas logísticas minimizadas; ICS reautoriza e evita detalhes além do necessário.
- **Aceite/testes:** criação unilateral não confirma; DST preserva instante; concorrência conflita; reminder antigo cancela; autoria no histórico.
- **Rollout/dependências:** MT-05 começando read-only/detail; depende de MT-01/02, matriz clínica e MT-08 para reminders.

## F08 — Comunicação segura

- **Superfícies:** portal profissional; gestante no app; admin somente fila de denúncias.
- **Existente — não encontrado no portal:** denúncia/moderação existe em `app/admin/ui/professional-care-review-panel.tsx`, mas não é chat.
- **Lacuna e mínimo web:** conversas por vínculo, texto MVP, cursor, unread, retry/idempotência, denúncia e aviso persistente não emergencial.
- **Telas/componentes/rotas:** inbox, conversa e composer; configurações de horário; proxy após contratos de conversa/mensagem. Anexos ficam bloqueados até storage/scan.
- **Estados:** loading; vazio; erro/retry sem duplicar; offline fila somente se contrato seguro; denied/blocked; plan insufficient; pending send; terminated/revoked desabilita composer mantendo política de leitura.
- **Acessibilidade:** ordem de leitura estável, live region sem anunciar conteúdo sensível integral, composer rotulado e atalhos não exclusivos.
- **Contrato/API:** cursor, `idempotencyKey`, estados verificáveis, `COMMUNICATION_BLOCKED`, `RELATIONSHIP_INACTIVE`, retenção/exportação e entitlement decidido.
- **Segurança:** push genérico, CSP/storage privado, rate limit, conteúdo fora de logs, reautorização entre carregar e enviar.
- **Aceite/testes:** retry não duplica; revogação concorrente bloqueia; cursor não perde mensagem; push não contém texto/paciente.
- **Rollout/dependências:** MT-06 piloto allowlisted; bloqueado por decisão comercial, retenção, MT-02 e API/app.

## F09 — Contrações e suspeita de bolsa

- **Superfícies:** captura local-first no app; portal profissional pode receber feed autorizado read-only. Admin somente métricas/auditoria minimizadas.
- **Existente — não encontrado:** nenhuma rota, tela ou componente web específico.
- **Lacuna e mínimo web:** após contrato, feed de eventos autorizados separando criado/enviado/entregue/lido/atendido; jamais cronômetro web como substituto do app offline.
- **Telas/componentes/rotas:** card/event timeline no detalhe da paciente e aviso não emergencial; nenhuma página pública.
- **Estados:** loading/vazio; erro/retry; offline informa snapshot; denied/sem grant; plan não bloqueia segurança; pending delivery; terminated não recebe novos eventos.
- **Acessibilidade:** linguagem aprovada, tempos textuais e não só gráficos, alerta de avaliação perceptível sem depender de cor/som.
- **Contrato/API:** client event ID, sync idempotente, correção auditada, grants e estados de entrega separados.
- **Segurança:** sem diagnóstico; observação livre fora de push/log; profissional sem grant não lista nem recebe.
- **Aceite/testes:** replay não duplica; ordem determinística; push falho não parece atendimento; teste web de estados e teste offline no app.
- **Rollout/dependências:** MT-07; bloqueado por texto clínico/jurídico, modelo de dados, sync API e app.

## F10 — Notificações e preferências

- **Superfícies:** preferências no portal; deep links autenticados; app mantém push nativo. Admin observa métricas agregadas.
- **Existente — não encontrado no web:** nenhuma UI/rota de preferências ou entrega.
- **Lacuna e mínimo web:** preferências por categoria/canal, status técnico minimizado e deep link contextual seguro.
- **Telas/componentes/rotas:** configurações de notificações, toggles versionados e fallback de deep link; BFF após `updateNotificationPreferences/getPreferences`.
- **Estados:** loading; vazio usa defaults explicados; erro/retry; offline bloqueia salvar; denied; plan não bloqueia avisos essenciais aprovados; pending save; terminated desativa categorias do vínculo.
- **Acessibilidade:** toggles com nome/descrição/estado, confirmação anunciada e agrupamento por categoria.
- **Contrato/API:** categorias, versão, TTL, dedupe, outbox e `CATEGORY_INVALID`; `opened/read/attended` separados.
- **Segurança:** payload mínimo, sem clínico na lock screen, contexto validado no deep link e token inválido desativado.
- **Aceite/testes:** opt-out respeitado; expirado não envia; retry não duplica; deep link não cruza perfil; métricas não afirmam atendimento.
- **Rollout/dependências:** MT-08 após eventos produtores; depende da infraestrutura API/app e decisões de categorias.

## F11 — Planos, entitlements e quotas

- **Superfícies:** admin governa catálogo/política; portal mostra entitlement do perfil e paywall contextual; checkout depende de decisão comercial/lojas.
- **Existente — parcial:** matriz versionada e demos em `app/admin/ui/access-package-policy-panel.tsx` e `app/admin/ui/admin-dashboard.tsx`; portal não consulta plano. `seatLimit` em `clinic-team-panel.tsx` não prova entitlement profissional.
- **Lacuna e mínimo web:** `getEntitlements` por perfil/contexto, usage/quota, origem preservada no paywall e estados grace/downgrade.
- **Telas/componentes/rotas:** badge/resumo de plano, quota junto à ação, paywall acessível e administração existente; não duplicar regras no cliente.
- **Estados:** loading; vazio/unknown bloqueia somente criação sensível; erro/retry; offline sem upgrade; denied; plan insufficient; pending purchase/grace; terminated subscription preserva leitura própria.
- **Acessibilidade:** preço/limite em texto, comparação tabular sem cor e foco restaurado ao voltar do checkout.
- **Contrato/API:** perfil/contexto, versão da política, uso, capabilities e erros `PROFILE_CONTEXT_REQUIRED`, `QUOTA_EXCEEDED`; web não calcula entitlement.
- **Segurança:** webhook/atomicidade server-side; paywall não revela dados; downgrade não apaga nem bloqueia direitos do titular.
- **Aceite/testes:** perfis isolam quota; criação concorrente respeita limite; downgrade mantém leitura/exportação; política é auditável/reversível.
- **Rollout/dependências:** MT-09 por shadow evaluation antes de enforcement; depende de MT-01, preços/limites/chat e API/billing/app.

## F12 — Auditoria, privacidade e operação

- **Superfícies:** admin e controles transversais; portal exibe apenas eventos pertinentes e minimizados.
- **Existente — parcial:** revisão/gates/denúncias/analytics em `app/admin/ui/professional-care-review-panel.tsx` e `app/admin/ui/care-analytics-panel.tsx`; proxy permite relationships/audit logs sem UI em `app/admin/api/access/[...path]/route.ts`.
- **Lacuna e mínimo web:** preservar `code/requestId`, consulta paginada de auditoria allowlisted, estados de saúde/incident e testes IDOR. Proxy não conta como tela.
- **Telas/componentes/rotas:** audit explorer read-only com filtros seguros, detalhe sem payload clínico, exportação protegida e runbook linkado; BFF após contrato.
- **Estados:** loading/vazio; erro/requestId/retry; offline indisponível; denied; plan não aplicável; pending gate; terminated mantém retenção conforme política.
- **Acessibilidade:** tabelas com headers/caption, filtros rotulados, exportação anunciada e status não apenas por cor.
- **Contrato/API:** ator/contexto/recurso/ação/decisão/motivo categórico/requestId/tempo; metadata allowlisted; paginação e retenção.
- **Segurança:** MFA, no content, segregação, URLs curtas, backup/restore, observabilidade não sensível e acesso auditado ao próprio audit log.
- **Aceite/testes:** grant/download/denied consultáveis; nenhum log contém mensagem/exame; restore/rollback exercitados; gates impedem piloto.
- **Rollout/dependências:** MT-10 transversal, interno primeiro; depende de segurança, jurídico/DPO, clínica, operação e API.

## F13 — Clínicas, secretárias, pós-parto e bebê

- **Superfícies:** portal profissional para clínicas; secretária e novas jornadas somente após aprovação; admin governa limites/auditoria.
- **Existente — parcial:** criar clínica, aceitar/criar/cancelar convite, papéis OWNER/ADMIN/MEMBER, assentos, suspensão, transferência e auditoria em `app/profissional/ui/clinic-team-panel.tsx`; allowlist em `lib/professional/care-proxy-policy.ts`.
- **Lacuna e mínimo web:** reconhecer formalmente clínica existente; separar administração organizacional de acesso clínico; paginação e estados de token. Não implementar secretária/pós-parto/bebê antecipadamente.
- **Telas/componentes/rotas:** manter workspace de clínica, melhorar lista/papéis/auditoria; futuras superfícies exigem especificação própria e contexto aprovado.
- **Estados:** loading/vazio/erro; offline bloqueia mutação; denied por papel; plan/seat limit; convite pending/expired/revoked; membership suspended/terminated.
- **Acessibilidade:** tabs com `tablist/tab/tabpanel` ou navegação semântica equivalente, `aria-selected`, teclado e confirmações acessíveis.
- **Contrato/API:** clínica/membership/invitation versionados, papel e seat limit; nenhum papel organizacional implica grant clínico.
- **Segurança:** token fora de logs, same-origin, RBAC server-side, transferência confirmada e auditoria; evitar acesso cruzado entre clínicas/pacientes.
- **Aceite/testes:** MEMBER não administra; convite expirado/replay falha; assento concorrente é atômico; transferência/suspensão preserva auditoria; zero acesso clínico implícito.
- **Rollout/dependências:** somente após métricas e MT-10; depende de MT-01, matriz de delegação, API e decisão de escopo para secretária/pós-parto/bebê.

## Gate de conclusão por feature

Uma feature web só muda de documentada para implementável quando decisão bloqueante, OpenAPI, DTOs, autorização negativa, UX/estados, acessibilidade, testes, flag, observabilidade, rollout e rollback estiverem registrados no checkpoint ativo. Implementação concluída exige evidências nos três projetos quando houver dependência; documentação isolada ou proxy ampliado não satisfaz aceite funcional.
