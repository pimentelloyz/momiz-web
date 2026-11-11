# Smoke seguro de comprovante administrativo

- Data: 2026-11-11
- Status: concluído
- Escopo: fixture local, smoke Playwright do comprovante efêmero e ajuste mínimo
  no fluxo de abertura do popup.

## Resultado

- O smoke usa sessão e dados integralmente sintéticos em servidores loopback,
  sem Preview, armazenamento ou API externos.
- A URL só é aberta depois de validada; payload inseguro e resposta expirada não
  criam popup e mantêm o `requestId` no feedback localizado.
- Popup bloqueado virou erro administrativo localizado. A nova janela perde a
  referência a `opener`, e a tela administrativa não navega como fallback.
- A fixture falha fechada fora de HTTP loopback; artefatos visuais e traces ficam
  desativados para não persistir URL efêmera.

## Verificações

- `node --test test/admin-api-client.test.ts test/admin-credential-download.test.ts test/e2e-fixture.test.ts`
- `npx playwright test e2e/admin-credential-smoke.spec.ts --project=desktop-chromium --workers=1`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Dependência futura

O smoke em Preview permanece um gate separado e autorizado. Deve usar somente a
conta sintética configurada por secrets existentes, falhar/ignorar com segurança
quando eles estiverem ausentes e nunca registrar a URL retornada.
