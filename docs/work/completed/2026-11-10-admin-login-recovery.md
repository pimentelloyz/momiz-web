# Recuperação do login administrativo

- Data: 2026-11-10
- Responsável: `/root`

## Entrega

- O estado de autenticação indisponível agora oferece “Sair e tentar novamente”.
- A ação encerra uma autenticação Firebase local existente, remove a sessão do
  BFF e retorna à rota de login.
- O controle é um botão acessível, com estado de carregamento e cobertura nos
  smokes do painel.

## Diagnóstico local

- As variáveis Firebase estão configuradas apenas em `.env.prod.local`.
- `next dev` não carrega esse arquivo; desenvolvimento requer `.env.local` ou
  `.env.development.local` com as mesmas chaves válidas.

## Verificações

- `npm test` — 78 testes aprovados;
- `npm run lint`;
- `npm run typecheck`;
- `git diff --check`.
