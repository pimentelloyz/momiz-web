# Auditoria e roadmap de melhorias da Web

- **Status:** concluído em 2026-11-04.
- **Objetivo:** auditar arquitetura, UX, segurança, contratos, qualidade, dependências e operação da Web sem alterar código de produto.
- **Entrega:** `docs/roadmaps/web-improvements-roadmap.md`.
- **Achado crítico:** logins admin e profissional renderizados desabilitados em produção por configuração Firebase ausente no runtime publicado, apesar de as chaves estarem presentes no snapshot local de produção (valores preservados em segredo).
- **Outros achados prioritários:** ausência de CSP/headers, smoke pós-deploy, observabilidade/error boundaries, E2E autenticado/mobile e contratos gerados.
- **Verificações:** lint, typecheck, 55 testes unitários e build passaram; audit de dependências de produção sem vulnerabilidades. E2E local não iniciou por ausência do binário Chromium; CI contém a etapa de instalação.
- **Ações externas:** nenhuma. Não houve commit, push, deploy ou alteração em API/App.
- **Próximo passo:** coordenador consolidar este roadmap com os roadmaps da API e do App e abrir WEB-001 como incidente P0.

