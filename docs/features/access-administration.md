# Administração de usuários e acessos

**Estado:** `IMPLEMENTED`.

## Perfil

- administrador autenticado e autorizado pela API.

## Escopo entregue

- busca paginada de usuários por termo;
- inspeção do pacote efetivo, origem de acesso, capabilities, limites e demos;
- criação e edição de acesso temporário com período, motivo, notas e overrides;
- revogação auditável de demo;
- presets de demonstração e validações cruzadas do piloto profissional;
- estados de carregamento, sessão expirada, erro e confirmação de operação.

## Contratos realmente consumidos

- `GET /api/admin/users?pageSize=30[&q=...]`;
- `GET /api/admin/users/{userId}/access`;
- `POST /api/admin/users/{userId}/demos`;
- `PATCH /api/admin/users/{userId}/demos/{demoId}`;
- `POST /api/admin/users/{userId}/demos/{demoId}/revoke`.

O navegador chama os equivalentes sob `/admin/api/access/...`; o BFF adiciona a sessão administrativa.

## Evidências

- `app/admin/page.tsx`
- `app/admin/ui/admin-dashboard.tsx`
- `app/admin/ui/access-policy-types.ts`
- `app/admin/api/access/[...path]/route.ts`

## Limitações

- o painel não é um editor genérico de usuários ou autenticação;
- concessões não substituem policies da API e podem expirar ou ser recusadas pelo backend;
- não há teste automatizado dedicado ao dashboard; validar contra API integrada.

## Validação

- buscar usuário, abrir detalhes, criar/editar/revogar demo e confirmar atualização do acesso;
- `npm run lint && npm run typecheck`.

