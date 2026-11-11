# Matriz E2E Web

## Projetos

| Projeto | Engine/device | Objetivo |
| --- | --- | --- |
| `desktop-chromium` | Desktop Chrome, 1280×720 | baseline desktop e teclado |
| `ipad-webkit` | iPad Pro 11, WebKit/touch | Safari tablet e reflow |
| `android-chromium` | Pixel 7, Chromium/touch | Android mobile e viewport estreita |

O reporter inclui o nome do projeto em cada caso. A suíte pública mantém
screenshot, trace e vídeo desligados e não contém sessão, conta real ou PII.

## Execução local e CI

```bash
npm run build
npm run test:e2e:install
npm run test:e2e
```

`test:e2e` executa antes um preflight de Chromium/WebKit. Quando faltarem, ele
falha com o comando de instalação, sem download implícito. A CI instala ambos
com dependências de sistema antes da suíte.

O servidor do teste usa o build local e `e2e/mock-api.mjs`. Convites usam apenas
fixtures fictícias; homepage, páginas legais, manifests e estados isolados de
login não dependem da API externa.

O smoke de comprovante administrativo roda nesse mesmo ambiente sintético. Ele
usa as portas dedicadas `3121`/`3122`, aceita a sessão fixture somente em HTTP
loopback e cobre popup válido, payload inseguro e URL expirada com `requestId`.
A URL efêmera não entra em snapshot ou log; screenshot, trace e vídeo continuam
desligados. Nenhuma chamada ao Preview ou ao armazenamento real é feita.

## Cobertura acessível incremental

- ativação do CTA por foco e teclado;
- foco visível explícito para links/botões/summary;
- termos a 200% e verificação de overflow horizontal;
- alerta semântico de autenticação indisponível;
- navegação por teclado até suporte;
- headings, robots, headers defensivos e estados 404/503.

Não foi adicionada dependência axe nesta fatia. Axe, contraste automatizado,
VoiceOver/TalkBack, zoom 400% e auditoria manual WCAG continuam pendentes.

## Smoke autenticado preparado

`authenticated-smoke-fixture.ts` lê apenas `SMOKE_AUTH_EMAIL`,
`SMOKE_AUTH_PASSWORD` e `SMOKE_AUTH_SURFACE`. Sem os dois secrets, retorna
estado desabilitado; não inventa credencial. O teste remoto usa configuração
separada, sem screenshot/trace/vídeo. Login real continua restrito ao release
gate autorizado e não faz parte da suíte local.

Para um smoke futuro no Preview, mantenha essa separação: use a conta sintética
já suportada pelas variáveis acima, interrompa/ignore com segurança quando os
secrets não existirem e injete o cenário de comprovante por fixture autorizada.
Não registre a URL retornada e não reutilize o mock local contra host remoto.

## Gate do comprovante em Preview

O gate remoto é separado do smoke local e não faz parte de `npm run test:e2e`:

```bash
SMOKE_PREVIEW_OPT_IN=RUN_SYNTHETIC_CREDENTIAL_PREVIEW_SMOKE \
SMOKE_ENVIRONMENT=preview \
SMOKE_BASE_URL=https://preview.example.test/ \
SMOKE_AUTH_SURFACE=admin \
SMOKE_AUTH_EMAIL='conta-sintetica' \
SMOKE_AUTH_PASSWORD='secret-do-ci' \
SMOKE_CREDENTIAL_TEST_MARKER='marcador-sintetico-unico' \
npm run test:e2e:credential:preview
```

O comando valida todos os campos antes de iniciar o Playwright. A URL deve ser
HTTPS e conter apenas a origem; o opt-in precisa ser literal, a superfície deve
ser `admin` e o marcador precisa identificar exatamente uma credencial da conta
sintética. `npm run test:e2e:credential:preview:check` permite obter evidência
somente do preflight, sem iniciar browser ou rede.

A configuração seleciona exclusivamente `preview-credential.spec.ts`, usa um
único worker e mantém screenshot, trace e vídeo desligados. Nem secrets nem a
URL assinada são impressos ou persistidos. O token de bypass é opcional e fica
somente em header. A execução remota requer autorização operacional separada;
este checkpoint validou apenas o preflight local.
