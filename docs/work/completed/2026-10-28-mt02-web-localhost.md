# MT-02 web no localhost

- Data: 2026-10-28
- Status: concluído
- Objetivo: implementar convites profissional→paciente, vínculos e scopes read-only no portal contextual, atrás de flag desligada.
- Escopo realizado: DTOs/parsers fail-closed, allowlist e mapping BFF, create/resend/cancel/decline/terminate, lista de vínculos, scopes/consentimento read-only, estados acessíveis, flag/env, documentação e testes.
- Compatibilidade: `NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS=false`; exige MT-01 ativo; nenhuma rota v1 ou admin foi alterada.
- Segurança: headers de contexto são construídos no BFF; mutações same-origin e com `Idempotency-Key`; retries preservam chave; IDs/path são allowlisted; token retornado não é exibido/persistido; contexto troca desmonta e aborta o painel.
- Limite consciente: o contrato central não possui GET de convites; portanto a UI mostra apenas convites criados na sessão atual e não inventa endpoint de listagem.
- Verificações: `npm test` (21 testes), `npm run lint`, `npm run typecheck`, `npm run build`, E2E focado do portal (1 teste) e `git diff --check`, aprovados.
- Dependências abertas: OpenAPI/rotas/flags centrais MT-02, migration/backfill/dual write/shadow read e jornada de consentimento da paciente no app.
- Próximo passo sugerido: validar flag-on com API local e dados sintéticos após o OpenAPI MT-02 ser publicado.
