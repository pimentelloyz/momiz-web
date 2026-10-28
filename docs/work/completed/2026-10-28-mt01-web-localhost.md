# MT-01 web no localhost

- Data: 2026-10-28
- Status: concluído
- Objetivo: implementar bootstrap, seleção e transporte seguro do contexto MT-01 no portal profissional, atrás de flag desligada.
- Escopo realizado: DTOs/parsers, BFF list/resolve, preferência HTTP-only e epoch, proxy contextual allowlisted, portal acessível com estados, flag/env, documentação e testes.
- Compatibilidade: `NEXT_PUBLIC_ENABLE_MT01_CARE_CONTEXTS=false` preserva o dashboard legado; quando ativa, a UI não mistura rotas `patientUserId` e usa apenas list/resolve/resumo v2.
- Segurança: contexto não entra no JWT; headers são construídos no BFF; preferência não autoriza; cache inclui sessão/perfil/pregnancy; troca/logout abortam requests e purgam estado; admin não foi alterado.
- Verificações: `npm test` (19 testes), `npm run lint`, `npm run typecheck`, `npm run build`, E2E focado do portal (1 teste) e `git diff --check`, todos aprovados.
- Dependências abertas: endpoints/OpenAPI e flags centrais MT-01 na API, backfill/shadow-read sem divergência e ambiente localhost com usuário/contextos válidos.
- Próximo passo sugerido: validar manualmente com API MT-01 local e dados sintéticos antes de habilitar a flag para qualquer coorte.
