# MT-04 web no localhost

- Data: 2026-10-28
- Status: concluído
- Objetivo: implementar o reader profissional de documentos compartilhados, download efêmero e colaboração, atrás de flag desligada.
- Escopo realizado: DTO/parser minimizado, allowlist contextual no BFF, filtros e cursor, paginação/dedupe, busca com debounce, download curto, revisão e comentários idempotentes, estados acessíveis e documentação localhost.
- Compatibilidade: `NEXT_PUBLIC_ENABLE_MT04_DOCUMENT_SHARES=false`; exige MT-01; dashboard legado e admin permanecem sem contexto clínico novo.
- Segurança: browser não controla headers de contexto; upload owner, grants, revoke e versões não são expostos; URL assinada não é persistida; metadata desconhecida é descartada; scan/share desconhecido falha fechado; cache/chaves e abort são segregados por sessão, perfil e gestação.
- UX: loading, vazio geral, vazio por filtro, offline/erro com `requestId`, denied/share revogado, scan pendente, quarentena, rejeitado e legado não verificado; teclado e layout responsivo preservados.
- Verificações: `npm test` (27 testes), `npm run lint`, `npm run typecheck`, `npm run build`, E2E focado do portal (1 teste) e `git diff --check`, aprovados.
- Dependências abertas: OpenAPI/rotas/flags centrais MT-04, storage com URL de até cinco minutos, scan fail-closed, shares ativos e matriz A/B/IDOR antes do canário.
- Próximo passo sugerido: validar flag-on com API local e dados sintéticos cobrindo revogação concorrente, cursor expirado, READ_ONLY e isolamento entre pregnancies.
