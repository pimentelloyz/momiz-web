# Contratos fechados de clínicas e equipes

- Data: 2026-11-13
- Status: concluído
- Escopo: painel profissional, parser compartilhado e testes focados.

## Resultado

- As sete respostas consumidas pelo painel — lista, equipe, criação, aceite,
  convite, cancelamento e atualização de membro — passam por parsers fechados
  antes de alterar estado ou iniciar recargas autoritativas.
- UUIDs, enums, datas ISO, inteiros, email, token e limites de coleções seguem o
  contrato da API. Payload ausente, excedente ou malformado falha fechado.
- Foto, PII adicional, metadata e token fora da criação são rejeitados. Email
  permanece somente no convite administrativo e o token recém-criado fica em
  memória apenas no link efêmero da sessão atual.
- Erros canônicos preservam `code`, `message` e `requestId`; expiração da sessão,
  MFA no proxy, logout, allowlist e UX de gestão foram preservados.

## Verificações

- `node --test test/clinic-team.test.ts test/professional-portal.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Dependências

- Contrato final recebido da API em 2026-11-13. Nenhuma divergência residual.
