# Momiz Web

Landing page institucional do Momiz, preparada para deploy na Vercel em
`momiz.com.br`.

## Desenvolvimento

```bash
cp .env.example .env.local
npm install
npm run dev
```

A página fica disponível em `http://localhost:3021`. A API local do Momiz usa
`http://localhost:3020`.

## Testes

```bash
npm test
npm run build
npm run test:e2e:install
npm run test:e2e
```

Os smoke tests E2E sobem o build de produção em `http://127.0.0.1:3021` e uma
API fake local em `http://127.0.0.1:3022`. Os cenários de convite usam somente
fixtures fictícias, sem acessar a API externa. No CI, o Chromium e suas
dependências de sistema são instalados antes da suíte.

As variáveis `NEXT_PUBLIC_APP_STORE_URL` e `NEXT_PUBLIC_GOOGLE_PLAY_URL` ativam
os botões das lojas. Sem elas, os botões exibem “Em breve”.

`SITE_URL` define a URL canônica do site, `API_BASE_URL` define a API usada pela
página pública de convite e `SUPPORT_EMAIL` define o canal exibido nas páginas
legais. Essas variáveis são server-only. Em desenvolvimento, use
`http://localhost:3020` para a API; na Vercel, use `https://api.momiz.com.br`.

O painel administrativo usa `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID` e
`FIREBASE_AUTH_DOMAIN` para autenticação por senha e Google. O Firebase apenas
prova a identidade; a allowlist da API continua sendo a autoridade que concede
acesso administrativo.

### MT-01 no localhost

O contexto explícito de cuidado do portal profissional fica desligado por padrão.
Para testar localmente contra uma API que já exponha os contratos MT-01, defina
`NEXT_PUBLIC_ENABLE_MT01_CARE_CONTEXTS=true` em um arquivo local ignorado pelo Git
e reinicie `npm run dev`. Sem a flag, `/profissional` preserva integralmente o
dashboard legado. Com a flag, o portal usa apenas listagem/resolução de contextos
e o resumo v2; não mistura dados das rotas legadas baseadas em `patientUserId`.

O BFF espera `GET /api/account/care-profiles`,
`POST /api/account/care-context/resolve` e
`GET /api/care/v2/pregnancies/{pregnancyId}/summary`. A API continua sendo a
autoridade de autorização; a preferência HTTP-only do web é somente conveniência.

O canário MT-02 depende do MT-01 e também fica desligado. Para testar convites
profissional→paciente, vínculos e scopes somente leitura, defina adicionalmente
`NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS=true`. A API local precisa expor os
contratos v2 de invitations/relationships e manter suas flags centrais ativas.
O portal não oferece edição de scopes ao profissional nem mistura rotas v1.

O reader MT-03 também depende do contexto MT-01. Use
`NEXT_PUBLIC_ENABLE_MT03_PROFESSIONAL_PATIENTS=true` somente com a API local v2
e suas flags centrais ativas. O BFF mantém ETag e corpo por até 15 segundos em
cache privado segregado por sessão/perfil/query; o navegador recebe `no-store`.
A lista usa cursor opaco, busca com debounce e não oferece detalhe enquanto não
existir rota v2 autorizada. O dashboard legado permanece inalterado com a flag
desligada.

O reader MT-04 depende do contexto MT-01 e permanece desligado por padrão. Para
validar documentos compartilhados em localhost, defina
`NEXT_PUBLIC_ENABLE_MT04_DOCUMENT_SHARES=true` junto das flags centrais da API.
O BFF expõe somente lista, download efêmero, revisão e comentário profissionais;
upload, grants e versões não fazem parte do portal. URLs de download não são
persistidas, e documentos não verificados ou sem share ativo falham fechados.

A agenda MT-05 também exige MT-01 e fica desligada por padrão com
`NEXT_PUBLIC_ENABLE_MT05_APPOINTMENTS=false`. Em localhost, habilite-a somente
com as rotas e flags v2 centrais ativas. A UI usa cursor, `allowedActions`, versão
e timezone fornecidos pelo contrato; mutações reutilizam a chave idempotente até
uma resposta definitiva, conflitos recarregam a agenda e o ICS é baixado de uma
resposta autenticada `no-store`. Na criação profissional, o web envia o vínculo
autorizado e a API deriva paciente e gestação; não há entrada manual de UUID
clínico. A agenda v1 permanece intacta com a flag falsa.

O chat profissional MT-06 depende do contexto/vínculo MT-01/MT-02 e permanece
desligado com `NEXT_PUBLIC_ENABLE_MT06_CARE_CHAT=false`. Em localhost, habilite
somente com as rotas e flags centrais v2. O composer exige o aviso
`NON_EMERGENCY_V1`, pagina mensagens por cursor, reutiliza `clientMessageId` e
chave idempotente no retry, confirma leitura até uma mensagem verificável e não
inclui entitlement ou anexos. Bloqueio/revogação falham fechados; o chat v1 não
é alterado com a flag desligada.

O feed MT-08 usa `NEXT_PUBLIC_ENABLE_MT08_NOTIFICATIONS=false`; a edição da
matriz usa adicionalmente `NEXT_PUBLIC_ENABLE_MT08_NOTIFICATION_PREFERENCES=false`.
Ambas ficam desligadas por padrão. O BFF aceita somente feed, preferências e
abertura explícita profile-scoped. A interface materializa as seis categorias e
os canais `IN_APP`/`PUSH`, reverte toggles em erro/conflito e trata deep links
como enums allowlisted. Estados `SENT` e `OPENED` são técnicos e não representam
leitura de mensagem, confirmação de consulta ou atendimento.

O reader profissional MT-07 usa `NEXT_PUBLIC_ENABLE_MT07_LABOR_EVENTS=false`.
Ele mostra somente eventos compartilhados e estado técnico de sync autorizados
pela API, sem captura/correção/export, contador, diagnóstico ou recomendação.
Notificação enviada/aberta não é apresentada como atendimento.

O painel MT-09 usa `NEXT_PUBLIC_ENABLE_MT09_ENTITLEMENTS=false`; a decisão OR de
chat por vínculo usa adicionalmente `NEXT_PUBLIC_ENABLE_MT09_CHAT_SPONSORSHIP=false`.
Tiers, catálogo, uso, limites, grace e referências de preço vêm da API. A UI não
hardcode preço cobrável, não ativa plano e não inicia checkout. Downgrade pode
limitar novas ações, mas nunca oculta leitura, histórico ou recursos de segurança.

## Deploy na Vercel

1. Importe este repositório na Vercel ou execute `vercel link`.
2. Cadastre as variáveis do `.env.example` nos ambientes desejados.
3. Adicione `momiz.com.br` e `www.momiz.com.br` em **Settings > Domains**.
4. Na Hostinger, remova os apontamentos web antigos e configure:
   - `A` — nome `@` — valor `76.76.21.21`
   - `A` — nome `www` — valor `76.76.21.21`
5. Configure `www.momiz.com.br` para redirecionar ao domínio principal.

Não altere os nameservers da Hostinger se o e-mail ou outros serviços usam a
zona DNS atual. Esses valores foram confirmados com `vercel domains inspect` em
2 de outubro de 2026; confirme novamente no painel se a configuração for aplicada
em outra data.

Os arquivos de App Links ficam em `public/.well-known`. Antes de publicar o app
Android na Play Store, acrescente ao `assetlinks.json` o SHA-256 do certificado
**App signing** exibido no Play Console; ele normalmente difere da chave de upload.

## Documentacao de produto

- [Roadmap de participacao presencial/virtual e presentes](docs/roadmap-participacao-presentes-web.md)
- [Backlog do painel editorial do Hub de dicas](docs/backlog-painel-editorial-hub-dicas.md)
