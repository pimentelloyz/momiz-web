# Gate de release e smoke pós-deploy — WEB-002

- Status: implementação local concluída em 2026-11-04; WEB-002 permanece parcial até execução real em Preview/Production e ensaio de rollback.
- Objetivo: preparar promoção verificável com falha fechada para configuração, superfícies públicas críticas e autenticação.
- Entregas: workflow manual de release; preflight de URL/ambiente/SHA; smoke HTTP remoto com relatório; cobertura de homepage, Apple association, Android asset links, termos gerais/profissionais e logins admin/profissional; Playwright remoto para conta sintética; runbook de promoção e rollback.
- Segurança: credenciais não existem no repositório, entram somente por secrets e não são incluídas em relatório, screenshot ou trace. Production exige conta sintética; ausência dos secrets falha explicitamente. Preview pode executar apenas o smoke público quando autorizado.
- Relatório: artifact JSON contém deployment URL, SHA esperado, timestamps, status e `x-request-id`/`x-vercel-id` quando retornados.
- Verificações aprovadas: `npm run lint`, `npm run typecheck`, `npm test` (60/60), `npm run build`, preflight unitário válido/inválido, preflight dry-run, smoke remoto contra servidor local configurado com valores sintéticos e `git diff --check`.
- E2E local: Chromium não está instalado nesta máquina, portanto a execução visual não foi repetida. A CI existente e o novo release gate instalam Chromium antes do Playwright; a configuração/test discovery permanece coberta por lint e typecheck.
- Pendências externas: cadastrar conta sintética profissional mínima; configurar secrets aprovados; executar o gate em Preview/Production; validar integração real com API; ensaiar rollback autorizado; registrar ownership e monitoramento.
- Ações não realizadas: deploy, rollback, commit, push, alteração de Vercel/Firebase/GitHub Secrets ou edição em API/App.
- Próximo passo: executar `docs/operations/release-gate.md` e anexar evidências reais antes de concluir WEB-002.
