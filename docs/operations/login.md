# Login admin e profissional

## Sinais seguros

- `/admin/login` e `/profissional/login` devem exibir o controle de entrada;
- “Login temporariamente indisponível” indica configuração pública Firebase
  ausente/inválida, não falha da conta da pessoa;
- respostas de login devem manter `cache-control: no-store` e
  `x-robots-tag: noindex, nofollow`;
- um `requestId` seguro pode correlacionar o BFF com a API sem copiar payload.

## Diagnóstico

1. Registre ambiente, URL, SHA, horário UTC e mensagem visível sem capturar
   e-mail, cookie ou tela autenticada.
2. Consulte o artifact do **Web Release Gate** do mesmo SHA. Se o preflight ou
   smoke de configuração falhou, interrompa promoção.
3. Diferencie: UI indisponível (config Firebase), falha ao criar sessão (BFF/API)
   ou acesso negado (autorização esperada). Não transforme 403 em falha geral.
4. Para BFF/API, preserve apenas `requestId` allowlisted e escale ao plantão API.
5. Configuração remota só pode ser reconciliada por responsável autorizado; não
   imprima nem compare secrets em chat/log.

## Recuperação e validação

Após ajuste autorizado ou rollback, execute o gate completo no deployment exato
e confirme ambos os logins, headers e smoke sintético. Conta real não é teste de
produção. Registre tempos conforme [resposta a incidentes](incident-response.md)
e siga [rollback](release-gate.md#rollback) se a regressão vier do release.

