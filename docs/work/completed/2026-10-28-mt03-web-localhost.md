# MT-03 web no localhost

- Data: 2026-10-28
- Status: concluído
- Objetivo: implementar reader profissional paginado com busca, filtros e cache ETag privado, atrás de flag desligada.
- Escopo realizado: DTO/parser minimizado, BFF profile-scoped, ETag/body server-only, cursor opaco, paginação/dedupe, busca com debounce, filtros normativos, cards e estados acessíveis.
- Compatibilidade: `NEXT_PUBLIC_ENABLE_MT03_PROFESSIONAL_PATIENTS=false`; exige MT-01; endpoint v1/dashboard legado e admin permanecem intactos.
- Segurança: somente header de perfil é construído no BFF; cache segregado por epoch/profile/fingerprint SHA-256 da query; API reautoriza antes de `304`; browser recebe `no-store`; cache é purgado em troca/logout/mutação/enum desconhecido.
- UX: loading, vazio geral, vazio por filtro, offline/erro com `requestId`, denied/revoked, pending/paused/read-only; unread só aparece quando presente; nenhum detalhe é inventado sem rota v2 autorizada.
- Verificações: `npm test` (24 testes), `npm run lint`, `npm run typecheck`, `npm run build`, E2E focado do portal (1 teste) e `git diff --check`, aprovados.
- Dependências abertas: OpenAPI/endpoint/flags centrais MT-03, shadow sem divergência e matriz A/B/IDOR antes do canário.
- Próximo passo sugerido: validar flag-on com API local, ETag/304 e dados sintéticos de múltiplas pregnancies.
