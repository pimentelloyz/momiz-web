# Gate de release, smoke e rollback

## Objetivo

O workflow **Web Release Gate** valida um deployment já criado antes de sua
promoção. Ele não cria deployments nem altera Vercel, Firebase ou GitHub
Secrets. Preview e Production devem usar o SHA exato associado ao deployment.

## Entradas e proteção

- `deployment_url`: origem HTTPS exata, sem caminho, query ou credenciais;
- `deployment_environment`: `preview` ou `production`;
- `expected_sha`: SHA Git associado ao deployment;
- `require_authenticated_smoke`: torna a conta sintética obrigatória em
  Preview; em Production ela é sempre obrigatória;
- `VERCEL_AUTOMATION_BYPASS_SECRET`: secret opcional para Preview protegido;
- `MOMIZ_SMOKE_AUTH_EMAIL` e `MOMIZ_SMOKE_AUTH_PASSWORD`: secrets da conta
  sintética profissional, sem dados reais e sem privilégios administrativos.

O workflow nunca imprime os valores dos secrets. A conta deve ter somente os
acessos mínimos para confirmar criação de sessão e deve ser rotacionada conforme
a política operacional. Nenhuma credencial deve ser adicionada a arquivos,
fixtures, artifacts ou logs.

## Gates executados

1. O preflight rejeita ambiente, URL ou SHA inválidos.
2. O smoke HTTP exige respostas válidas para homepage, Apple association,
   Android asset links, termos gerais, termos profissionais e os dois logins.
3. Todas as superfícies devem apresentar o baseline de headers; logins também
   devem responder com `no-store` e `noindex` defensivos.
4. Os logins devem renderizar controles de autenticação e não podem exibir o
   estado de configuração indisponível.
5. O Chromium é instalado antes do Playwright.
6. O smoke autenticado cria sessão profissional com a conta sintética. Secrets
   ausentes produzem falha explícita quando o teste é obrigatório; em Preview
   opcional, o caso é marcado como ignorado.
7. O artifact `release-smoke-report.json` registra URL, SHA esperado, horários,
   status e `x-request-id`/`x-vercel-id` quando retornados.

O gate não substitui testes manuais de Google, MFA, contas negadas, logout nem
validação dos links no dispositivo. Esses itens permanecem checklist de
promoção enquanto não houver contas e automação específicas aprovadas.

## Promoção Preview → Production

1. Confirme que o workflow CI do mesmo SHA passou.
2. Execute **Web Release Gate** contra a URL de Preview, exigindo smoke
   autenticado quando a conta sintética estiver disponível.
3. Revise o artifact e preserve URL, SHA e identificadores de correlação.
4. Promova somente o deployment exato validado, pelo processo autorizado da
   Vercel.
5. Execute novamente **Web Release Gate** na URL de Production. Em Production,
   a conta sintética é obrigatória.
6. Registre resultado, responsável e horário no controle operacional da release.

## Rollback

Rollback é uma ação remota e exige autorização operacional. Se qualquer gate
pós-deploy falhar:

1. interrompa a promoção e preserve relatório, URL, SHA e request IDs;
2. selecione na Vercel a versão anterior conhecida e previamente validada;
3. confirme que a versão corresponde ao SHA registrado, sem reconstruir fonte
   diferente ou alterar variáveis durante o rollback;
4. restaure essa versão pelo mecanismo autorizado da plataforma;
5. execute o gate completo contra Production;
6. se o login continuar indisponível, trate configuração Vercel/Firebase como
   incidente e não faça novas promoções até reconciliar os ambientes;
7. documente causa, duração, versão restaurada e ações posteriores.

O rollback da Web não deve apagar dados, alterar contratos da API ou reverter
configuração do App. Um ensaio real de Preview e um rollback controlado ainda
são necessários antes de considerar WEB-002 concluído.
