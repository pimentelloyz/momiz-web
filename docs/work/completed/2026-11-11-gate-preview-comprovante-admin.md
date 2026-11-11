# Gate de Preview do comprovante administrativo

- Data: 2026-11-11
- Status: concluído sem execução remota
- Escopo: preflight, comando/configuração Playwright, spec autenticada, testes e
  documentação operacional.

## Resultado

- `test:e2e:credential:preview` é distinto do smoke local e executa somente a
  spec de comprovante marcada.
- O browser não inicia sem opt-in literal, ambiente `preview`, origem HTTPS sem
  path/query, conta admin sintética completa e marcador de credencial explícito.
- A configuração Playwright também aplica o preflight, impedindo bypass por
  invocação direta, e desliga screenshot, trace e vídeo.
- O output do preflight contém apenas nomes de variáveis inválidas; não imprime
  credenciais, bypass token ou URL efêmera.
- `test:e2e:credential:preview:check` validou os casos positivo e negativo sem
  browser ou chamada de rede. O smoke remoto não foi executado neste lote.

## Verificações

- `node --test test/preview-credential-preflight.test.ts test/e2e-fixture.test.ts`
- `npm run test:e2e:credential:preview:check` com fixture local de ambiente
- `npm run typecheck`
- `npm run lint`
- `git diff --check`

## Limitação operacional

A execução real ainda depende de autorização, deployment Preview, conta admin
sintética e uma única credencial identificada pelo marcador. Esses recursos não
foram acessados nem alterados durante a preparação do gate.
