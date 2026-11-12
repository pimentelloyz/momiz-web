# Download administrativo de credencial efêmero e seguro

- Data: 2026-11-12
- Status: concluído
- Escopo: parser temporal, abertura segura, painel, mock e testes.

## Resultado

- O parser aceita HTTPS e localhost explícito já permitido para dev/test, exige
  `expiresAt` ISO estritamente futuro e rejeita validade restante acima de cinco
  minutos. Não há tolerância de relógio: uma URL já expirada no cliente não abre.
- A resposta é projetada apenas para `downloadUrl/expiresAt`; extras são
  descartados. A URL permanece variável local até a abertura e não entra em
  state, storage, DOM persistente, logs ou telemetria.
- Cada clique executa um GET novo. Não existe cache, reuse ou retry automático;
  erros 404/503 da API continuam como `AdminApiError` correlacionado.
- Depois da validação, um popup transitório recebe `opener=null` e política
  `no-referrer` antes da navegação imediata. Bloqueio gera erro localizado e não
  produz sucesso falso.
- Loading/erro/sucesso e bloqueio do botão continuam independentes por
  credencial; 401 preserva o fluxo de sessão expirada.

## Verificações

- `node --test test/admin-credential-download.test.ts` — 5 testes aprovados
- `npm test` — 134 testes aprovados
- smoke Playwright Chromium do comprovante — 3/3 aprovados
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Dívida

Nenhuma dívida contratual nova. O HTTP loopback permanece restrito ao helper de
dev/test existente; ambientes remotos continuam exigindo HTTPS.
