# Identidade, sessão e proxies BFF

**Estado:** `IMPLEMENTED`.

## Perfis atendidos

- administrador em `/admin/login` e `/admin`;
- profissional em `/profissional/login` e `/profissional`.

## Autenticação e sessão

- login por e-mail/senha ou Firebase no painel administrativo;
- login Firebase no portal profissional;
- troca do ID token em `POST /api/auth/firebase/exchange`;
- sessão server-side em cookies HTTP-only separados para administrador e profissional;
- renovação via `POST /api/auth/refresh` quando necessário;
- logout apaga a sessão local;
- administrador é validado por `GET /api/admin/users?pageSize=1`;
- profissional é validado por `GET /api/care/professional/profile`;
- MFA obrigatório e perfil profissional ausente têm estados explícitos.

## BFF e segurança

- mutações exigem mesma origem;
- proxies aceitam somente caminhos e métodos previstos por policies locais;
- tokens da API não são entregues ao JavaScript do navegador;
- respostas `MFA_REQUIRED` limpam a sessão e exigem nova autenticação;
- respostas canônicas da API preservam `requestId` nos fluxos profissionais.

## Rotas web consumidas

- `/admin/api/session` e `/admin/api/access/[...path]`;
- `/profissional/api/session`, `/profissional/api/care/[...path]`;
- `/profissional/api/context/bootstrap`, `/profissional/api/context/resolve`;
- `/profissional/api/contextual/[profileId]/[pregnancyId]/[...path]`;
- `/profissional/api/patients/[profileId]`;
- `/profissional/api/notifications/[profileId]/[...path]`;
- `/profissional/api/entitlements/[profileId]/[...path]`.

As allowlists contêm rotas defensivas adicionais. A documentação funcional dos outros arquivos registra apenas os caminhos chamados pela UI.

## Configuração

- `API_BASE_URL`: origem da API no servidor.
- `FIREBASE_WEB_API_KEY`: login por senha no BFF administrativo.
- configuração pública Firebase usada pelos formulários de login para provedores/MFA.

## Evidências

- `lib/admin/admin-session.ts`
- `lib/professional/professional-session.ts`
- `app/admin/api/session/route.ts`
- `app/admin/api/access/[...path]/route.ts`
- `app/profissional/api/session/route.ts`
- `app/profissional/api/care/[...path]/route.ts`
- `lib/professional/care-proxy-policy.ts`
- `app/admin/ui/admin-login-form.tsx`
- `app/profissional/ui/professional-login-form.tsx`

## Limitações

- autorização real permanece na API; a allowlist do BFF não concede acesso.
- disponibilidade dos provedores Firebase, MFA e credenciais exige configuração externa (`EXTERNAL_VALIDATION_REQUIRED`).

## Validação

- `npm run lint`
- `npm run typecheck`
- testar login, expiração, refresh, logout, origem inválida, perfil sem permissão e MFA em ambiente integrado.

