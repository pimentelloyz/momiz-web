# MT-07 e MT-09 web no localhost

- Data: 2026-10-28
- Status: concluído
- Objetivo: implementar visão profissional MT-07 e estado server-driven de plano/quotas MT-09, atrás de flags desligadas.
- MT-07 realizado: binding, DTO minimizado, BFF contextual read-only, cursor, timeline compartilhada, estado técnico de sync, texto `LABOR_SAFETY_PT_BR_V1`, loading/empty/error/denied e isolamento por contexto.
- MT-07 segurança: sem captura, sync mutation, correção, export, contador/frequência, fase, risco, diagnóstico, observação, cor ou odor; notificação enviada/aberta não é atendimento.
- MT-09 realizado: binding, DTO/BFF profile-scoped, tiers/estado/catálogo, uso/limites, grace/downgrade, ofertas de referência e guard OR de chat por vínculo.
- MT-09 segurança: sem checkout/restore/receipt/provider real; UI não ativa plano, não exige ambos sponsors, não revela sponsor ID e preserva leitura/histórico/receipts/segurança quando novas ações são bloqueadas.
- Flags: `NEXT_PUBLIC_ENABLE_MT07_LABOR_EVENTS=false`, `NEXT_PUBLIC_ENABLE_MT09_ENTITLEMENTS=false` e `NEXT_PUBLIC_ENABLE_MT09_CHAT_SPONSORSHIP=false`.
- Verificações: `npm test` (42 testes), `npm run lint`, `npm run typecheck`, `npm run build`, E2E focado do portal (1 teste) e `git diff --check`, aprovados.
- Dependências abertas: OpenAPI/rotas/flags/migrations MT-07/09, revisão obstetra/jurídico, grants, catálogo/provider truth, quota reservation concorrente, sponsorship e matrizes A/B/IDOR antes do canário.
- Próximo passo sugerido: validar flags-on contra API local com pregnancies/perfis A/B, eventos conflitantes, grace/refund/downgrade, quotas concorrentes e sponsorship encerrado.
