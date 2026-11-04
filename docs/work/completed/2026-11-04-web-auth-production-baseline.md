# Baseline de autenticação de produção — WEB-001

- Status: implementação local concluída em 2026-11-04; WEB-001 permanece parcial por depender de ações remotas e smoke autenticado.
- Objetivo: detectar configuração Firebase ausente ou inválida antes de uma promoção e substituir controles silenciosamente desabilitados por indisponibilidade explícita.
- Escopo entregue: resolvedor tipado e centralizado de configuração; gate em builds Vercel Preview/Production; preflight executável para outros ambientes; UI acessível nos logins administrativo e profissional; testes unitários e smoke E2E; documentação operacional e atualização do roadmap.
- Compatibilidade: desenvolvimento, testes e builds locais sem gate continuam possíveis; nessas condições a UI mostra indisponibilidade. Vercel Preview/Production e builds com `MOMIZ_AUTH_CONFIG_REQUIRED=true` falham quando a configuração obrigatória não é válida.
- Privacidade operacional: preflight e erros de build informam somente os nomes das variáveis problemáticas, nunca seus valores. A UI não revela detalhes de configuração.
- Verificações aprovadas: teste focado de configuração (3/3), `npm run lint`, `npm run typecheck`, `npm test` (58/58), `npm run build`, preflight sintético configurado/não configurado e `git diff --check`.
- E2E local: os dois casos focados foram adicionados, mas não executaram porque o Chromium do Playwright não está instalado. A falha ocorreu antes da navegação; `.github/workflows/ci.yml` instala Chromium antes de `npm run test:e2e`.
- Pendências externas: reconciliar `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID` e `FIREBASE_AUTH_DOMAIN` nos ambientes corretos da Vercel; confirmar domínio autorizado no Firebase; redeploy controlado; testar Google, senha, MFA, contas autorizada/não autorizada, sessão e logout; configurar smoke/alerta pós-deploy.
- Ações não realizadas: nenhuma leitura ou alteração de valores remotos, deploy, commit ou publicação.
- Próximo passo: concluir as pendências externas e registrar evidências antes de alterar o estado do WEB-001 para concluído.
