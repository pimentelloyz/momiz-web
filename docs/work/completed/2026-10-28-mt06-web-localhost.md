# MT-06 web no localhost

- Data: 2026-10-28
- Status: concluído
- Objetivo: implementar chat profissional v2 por vínculo, atrás de flag desligada.
- Escopo realizado: DTO/policy minimizados, allowlist contextual/BFF, paginação por cursor, deduplicação, envio com retry idempotente, receipt verificável, policy operacional e estados acessíveis.
- Compatibilidade: `NEXT_PUBLIC_ENABLE_MT06_CARE_CHAT=false`; exige MT-01/MT-02; chat/portal legado permanece intacto com a flag desligada.
- Segurança: contexto inclui perfil/gestação/vínculo; browser não fornece `patientUserId`; conteúdo é texto React sem HTML/preview; cache é `no-store`; troca de contexto aborta requests; denied/revoked purga dados e blocked desabilita envio.
- Aviso: composer só habilita após renderizar e reconhecer `NON_EMERGENCY_V1` na versão atual da policy; mudança de versão exige novo reconhecimento. Horário e expectativa são informativos e não bloqueiam envio nem prometem prazo.
- Idempotência: retry preserva `clientMessageId`, conteúdo e `Idempotency-Key`; estado “enviada” é separado de `readByCounterpartyAt`; receipt usa alvo verificável da contraparte.
- Fora do pacote: entitlement, anexos, SLA, diagnóstico, retenção/exportação nova e deploy.
- Verificações: `npm test` (34 testes), `npm run lint`, `npm run typecheck`, `npm run build`, E2E focado do portal (1 teste) e `git diff --check`, aprovados.
- Dependências abertas: OpenAPI/rotas/flags MT-06, cursor/ledger/client ID, policy versionada, receipt monotônico, outbox sem conteúdo e matriz A/B/IDOR antes do canário.
- Próximo passo sugerido: validar flag-on com API local cobrindo retry concorrente, cursor expirado, receipt parcial, mudança de policy, bloqueio e revogação durante envio.
