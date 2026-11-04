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
