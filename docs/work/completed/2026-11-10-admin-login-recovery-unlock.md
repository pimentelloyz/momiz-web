# Destravamento da recuperação do login administrativo

- Data: 2026-11-10
- Responsável: `/root`

## Entrega

- O estado “Saindo…” agora é encerrado no bloco `finally`.
- A remoção da sessão possui timeout de cinco segundos.
- A mesma rota é atualizada pelo router do Next sem depender de remontagem para
  restaurar o botão.
- O smoke passou a verificar que a ação volta ao estado habilitado.

## Verificações

- `npm run lint` — aprovado;
- `npm run typecheck` — aprovado;
- `git diff --check` — aprovado;
- smoke Playwright solicitado, mas não executado porque Chromium e WebKit não
  estão instalados no ambiente local.
