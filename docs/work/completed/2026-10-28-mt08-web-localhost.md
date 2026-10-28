# MT-08 web no localhost

- Data: 2026-10-28
- Status: concluído
- Objetivo: implementar feed/status e preferências profissionais de notificações MT-08, atrás de flags desligadas.
- Escopo realizado: binding local, DTOs minimizados, BFF profile-scoped, feed keyset, filtros, open explícito, deep links allowlisted, matriz versionada e opt-out com rollback.
- Compatibilidade: `NEXT_PUBLIC_ENABLE_MT08_NOTIFICATIONS=false` e `NEXT_PUBLIC_ENABLE_MT08_NOTIFICATION_PREFERENCES=false`; dashboard legado e admin permanecem inalterados.
- Categorias/canais: `INVITATION`, `RELATIONSHIP`, `APPOINTMENT`, `REMINDER`, `DOCUMENT`, `MESSAGE` por `IN_APP` e `PUSH`; a UI exige a matriz materializada da API e não cria defaults próprios.
- Segurança: BFF constrói perfil a partir da rota/sessão, mutações exigem same-origin/idempotência, feed não mantém source resource ID, deep links não aceitam URL arbitrária e cache é segregado por epoch/perfil com `no-store`.
- Semântica: `SENT` não significa entregue/lido; `OPENED` só ocorre após clique autenticado e não significa leitura de mensagem, confirmação de consulta ou atendimento.
- Opt-out: toggle otimista envia `expectedVersion`, reverte em erro e recarrega em conflito; histórico in-app não é apagado.
- Fora do pacote: MT-07, conteúdo clínico, entitlement, provider real/device token, API/app/migration/deploy.
- Verificações: `npm test` (37 testes), `npm run lint`, `npm run typecheck`, `npm run build`, E2E focado do portal (1 teste) e `git diff --check`, aprovados.
- Dependências abertas: OpenAPI/rotas/flags/migration MT-08, producers MT-02/04/05/06, cursor/eventos, IDOR A/B, stale/TTL, opt-out concorrente, payload push inspecionado e rollout/rollback central.
- Próximo passo sugerido: validar flags-on com API local e dados sintéticos cobrindo conflito de versão, cursor expirado, deep link de outro contexto, revogação/stale e opt-out antes/depois da fila.
