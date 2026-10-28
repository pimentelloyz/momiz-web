# Materialização web do roadmap de equipe médica

- Data: 2026-10-28
- Status: concluído
- Objetivo: materializar F01–F13 e MT-01–MT-10 nas superfícies web sem desenvolver funcionalidades.
- Escopo realizado: criados `docs/medical-team-roadmap/README.md`, `WEB_FEATURE_SPECIFICATIONS.md` e `WEB_TRACEABILITY.md`.
- Cobertura: admin, portal profissional, superfície pública potencial e dependências do app; base existente, lacunas, telas/componentes mínimos, estados UX, acessibilidade, contratos, segurança, aceite, testes, rollout e dependências para cada feature.
- Regra registrada: contrato central/OpenAPI, decisões bloqueantes, autorização negativa e checkpoint precedem qualquer implementação; proxy não conta como UI pronta.
- Verificações: `git diff --check`; 13 headings F01–F13; presença MT-01–MT-10; links centrais e caminhos locais citados existentes.
- Dependências abertas: fonte da gestação/perfis, estados de vínculo, grants, consulta, chat, retenção, parto, planos/quotas, MFA/RLS e aprovações clínica/jurídica/segurança.
- Próximo passo sugerido: selecionar MT-01 e resolver seus bloqueios antes de preparar contrato ou código web.
