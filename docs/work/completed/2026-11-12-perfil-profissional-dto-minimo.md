# DTO mínimo do perfil profissional

- Data: 2026-11-12
- Status: concluído
- Escopo: parser compartilhado, autorização de sessão, proxy GET, dashboard e testes.

## Resultado

- A Web valida e projeta o contrato fechado de perfil, incluindo credenciais,
  antes de responder ao navegador. Extras em qualquer nível, inclusive storage
  keys e metadados de documento, são descartados.
- O mesmo parser protege a autorização após login. `profile: null` continua
  significando cadastro obrigatório; payload inválido encerra a sessão criada e
  produz diagnóstico estável sem ecoar o corpo upstream.
- O proxy permanece GET-only para `professional/profile`, preserva correlação e
  normaliza resposta inválida como `PROFESSIONAL_PROFILE_RESPONSE_INVALID`.
- O dashboard usa o tipo validado, removeu o tipo parcial de credenciais e agora
  apresenta estado localizado para `SUSPENDED`.
- O portal contextual MT-01, autenticação, logout e demais rotas não mudaram.

## Verificações

- `node --test test/professional-profile-response.test.ts test/professional-portal.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Dívida

- PUT e submit continuam deliberadamente fora da superfície Web. Se forem
  habilitados, devem reutilizar o parser com `allowNull: false` e receber uma
  allowlist explícita por método.
