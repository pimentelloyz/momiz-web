# Binding técnico web MT-01

- Data: 2026-10-28
- Status: concluído
- Objetivo: fechar o binding normativo do cliente web para contexto explícito e isolamento MT-01.
- Escopo realizado: criado `docs/medical-team-roadmap/MT01_WEB_CONTRACT.md` e referenciado no README local.
- Decisões: `profileId`/`pregnancyId` explícitos no path browser→BFF; headers centrais internos BFF→API; preferência HTTP-only sem autoridade; list/resolve minimizados; cache por sessão/perfil/pregnancy; troca com purge; deep links revalidados; admin sem contexto clínico.
- Cobertura: F01, F04, F05, F11 e F12; DTOs esperados, SSR/proxy, logout, erros/`requestId` — incluindo conflito de chave idempotente com falha fechada —, UX/a11y, compatibilidade `patientUserId`, flags, rollout/rollback e testes A/B/IDOR.
- Verificações: caminhos locais citados, termos obrigatórios, whitespace e `git diff --check`.
- Dependências abertas: OpenAPI MT-01, implementação/backfill da API, revisão de segurança e gates do canário; regras F04/F05/F11/F12 continuam nos pacotes próprios.
- Próximo passo sugerido: conferir o OpenAPI publicado contra este binding antes de abrir pacote de código.
