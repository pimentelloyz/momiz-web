# MT-05 web no localhost

- Data: 2026-10-28
- Status: concluído
- Objetivo: implementar agenda profissional v2, propostas e transições MT-05, atrás de flag desligada.
- Escopo realizado: DTOs minimizados, allowlist contextual/BFF, paginação e filtros, proposta, respostas, reagendamento, cancelamento, conclusão/no-show, histórico, ICS autenticado e estados acessíveis.
- Compatibilidade: `NEXT_PUBLIC_ENABLE_MT05_APPOINTMENTS=false`; exige MT-01; dashboard e agenda v1 permanecem inalterados com a flag desligada.
- Segurança: ações derivam de `allowedActions`; criação envia apenas o `relationshipId` autorizado e a API deriva paciente/gestação, sem input de UUID clínico; mutações enviam versão e chave idempotente reutilizável; respostas usam `no-store`; contexto aborta requests; admin não recebe acesso clínico.
- Tempo e concorrência: UI envia RFC 3339 com offset e zona IANA, rejeita gap/ambiguidade DST detectável, mostra slot vigente e proposto simultaneamente e recarrega em conflitos 409 sem sobrescrever estado.
- UX: loading, vazio geral/filtro, offline/erro/denied com `requestId`, paginação, ações por papel retornadas pela API, histórico e exportação ICS limitada ao intervalo escolhido.
- Correção de segurança/UX: removida a entrada manual de `patientProfileId`; contract test garante que proposta profissional não envia `patientProfileId`, `patientUserId` nem `pregnancyId`.
- Verificações: `npm test` (31 testes), `npm run lint`, `npm run typecheck`, `npm run build`, E2E focado do portal (1 teste) e `git diff --check`, aprovados.
- Dependências abertas: OpenAPI/rotas/flags MT-05 devem aceitar `relationshipId` contextual e derivar paciente/gestação; constraint PostgreSQL de conflito, eventos/outbox e matriz negativa/concorrente continuam obrigatórios antes do canário.
- Próximo passo sugerido: validar flag-on contra API local com propostas nos dois sentidos, DST, revogação, conflito concorrente, cursor expirado e ICS minimizado.
