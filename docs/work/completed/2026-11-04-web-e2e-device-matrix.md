# Matriz E2E de dispositivos — WEB-005

- Status: fatia local concluída em 2026-11-04; WEB-005 permanece parcial até smoke autenticado real, validação em dispositivos/tecnologias assistivas e cobertura automatizada mais ampla de acessibilidade.
- Objetivo: tornar as jornadas públicas isoladas autocontidas e ampliar a matriz Playwright para desktop, iPad e Android mobile sem credenciais reais.
- Entregas: projetos `desktop-chromium`, `ipad-webkit` e `android-chromium`; preflight local de Chromium/WebKit com instrução acionável; instalação explícita dos browsers na CI; cenários de teclado, foco, semântica e reflow com zoom; fixture autenticada que lê somente variáveis allowlisted; documentação operacional da matriz.
- Segurança: screenshot, vídeo e trace permanecem desativados; os testes públicos usam mocks locais e não dependem de rede externa nem PII; nenhuma credencial ou sessão foi adicionada ao repositório.
- Evidência Playwright: discovery encontrou 51 casos, 17 por projeto. Os browsers não estão instalados nesta máquina, então o preflight falhou de forma esperada e indicou `npm run test:e2e:install`; a execução visual local não foi forçada.
- Verificações aprovadas: `npm run lint`, `npm run typecheck`, `npm test` (71/71), `npm run build`, teste focado da fixture (2/2), `npx playwright test --list` (51 casos) e `git diff --check`.
- Pendências externas: executar a matriz em CI/ambiente com browsers; provisionar conta sintética e secrets aprovados antes do smoke autenticado; validar leitores de tela/dispositivos reais; avaliar axe somente com aprovação de nova dependência.
- Ações não realizadas: login remoto, instalação de dependência, deploy, commit, push, alteração de secrets ou edição em API/App.
- Próximo passo: acompanhar a primeira execução dos três projetos na CI e anexar a evidência ao WEB-005 antes de ampliar o gate autenticado.
