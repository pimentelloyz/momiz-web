# Firebase Web Dev no localhost

- Data: 2026-11-10
- Responsável: `/root`

## Entrega

- Criado o Web App `Momiz Web Dev` no projeto Firebase `momiz---dev`.
- Criado `.env.local` ignorado pelo Git, apontando o site para a porta `3021`,
  a API Dev para `3020` e o Firebase para o projeto Dev.
- Confirmados `localhost` como domínio autorizado e os provedores Google e
  e-mail/senha como ativos.
- Incluída a conta operacional na allowlist administrativa local da API Dev.
- API e Web locais reiniciadas com as novas configurações.
- Browsers Chromium e WebKit do Playwright instalados localmente.

## Preservação de produção

- Firebase `momiz---prod` não foi alterado.
- `.env.prod.local` não foi modificado e sua configuração continua válida.
- O runtime local da API em modo Prod foi validado na porta `3022`.

## Verificações

- formulário administrativo Firebase visível em `localhost:3021`;
- estado “Login temporariamente indisponível” ausente;
- `/health` da API Dev respondeu `200`/`ok`;
- `npm run lint` e `npm run typecheck` aprovados;
- smoke headless do formulário aprovado;
- `git diff --check` aprovado.
