# Roadmap de melhorias — Momiz Web

**Data da auditoria:** 4 de novembro de 2026  
**Escopo:** `momiz-web` (Next.js 16, site público, BFF administrativo e portal profissional)  
**Natureza:** análise e planejamento; nenhuma correção de produto foi aplicada.

## 1. Resumo executivo

A base tem bons controles locais: TypeScript estrito, proxies com allowlist, cookies `httpOnly`, separação entre admin/profissional, `noindex` nos portais, DTOs minimizados e 55 testes unitários passando. O build de produção também conclui e `npm audit --omit=dev` não encontrou vulnerabilidades conhecidas.

O risco imediato é operacional: **os logins administrativo e profissional estão indisponíveis em produção**. Ambos chegam ao navegador com os botões de autenticação desabilitados, estado que o código produz quando a configuração Firebase é nula. O snapshot local de variáveis de produção contém as três variáveis Firebase, com valores presentes e redigidos, portanto existe divergência entre a configuração local esperada e o runtime/deployment publicado.

Em seguida, devem ser tratados o endurecimento HTTP, a ausência de observabilidade e error boundaries, a falta de smoke pós-deploy e a cobertura E2E insuficiente para fluxos autenticados e dispositivos móveis. A dívida estrutural se concentra em componentes/CSS muito grandes, contratos mantidos manualmente e muitos BFFs semelhantes sem uma infraestrutura comum.

## 2. Método, classificação e evidências

- **Confirmado:** observado diretamente no código, build, testes ou HTTP de produção.
- **Hipótese:** risco plausível que requer teste autenticado, dado operacional ou revisão especializada.
- **P0:** indisponibilidade, perda/exposição de dados ou bloqueio de operação crítica.
- **P1:** risco alto de segurança, regressão ou incapacidade de detectar/recuperar falhas.
- **P2:** qualidade, escala, acessibilidade, performance ou dívida relevante.
- **P3:** manutenção e refinamentos de menor urgência.

Comandos principais usados:

```bash
rg --files app lib test e2e docs
rg -n 'process\.env|NEXT_PUBLIC_|FIREBASE|console\.|requestId' app lib
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --omit=dev --json
npm outdated --json
curl -D - https://momiz.com.br/{,admin/login,profissional/login,health-professional-terms}
```

Resultados: lint, typecheck, 55/55 testes unitários e build passaram; audit de produção retornou 0 vulnerabilidades. O E2E local não iniciou porque o Chromium do Playwright não estava instalado, conforme a própria mensagem de erro; a CI instala o navegador antes de executar (`.github/workflows/ci.yml:26-27`).

## 3. Roadmap priorizado

### Now — restaurar operação e reduzir risco imediato

#### WEB-001 — Restaurar e vigiar a autenticação de produção

- **Prioridade:** P0; **estado:** parcial — prevenção local concluída em 04/11/2026, restauração remota pendente; **natureza:** quick win operacional + prevenção estrutural.
- **Evidência:** `app/admin/login/page.tsx:8-17` e `app/profissional/login/page.tsx:21-29` tornam `firebaseConfig` nula sem `FIREBASE_WEB_API_KEY` ou `FIREBASE_PROJECT_ID`; os formulários desabilitam ambos os botões nesse estado (`app/admin/ui/admin-login-form.tsx:220-238`, `app/profissional/ui/professional-login-form.tsx:172-189`). Em 04/11/2026, `curl` das duas URLs de produção mostrou os dois botões com `disabled=""`. O arquivo local ignorado `.env.prod.local` possui `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID` e `FIREBASE_AUTH_DOMAIN` preenchidas (valores não inspecionados nem registrados).
- **Risco:** painel administrativo e portal profissional ficam integralmente bloqueados, sem mensagem explícita ao usuário e sem alerta operacional.
- **Proposta:** reconciliar as variáveis no ambiente **Production** do projeto Vercel correto, confirmar escopo/runtime, redeploy controlado e adicionar validação de configuração no startup/build e smoke remoto. Renderizar um estado de indisponibilidade explícito, com correlação e canal de suporte, em vez de apenas desabilitar controles.
- **Dependências:** credenciais/projeto Firebase e Vercel; API deve manter `/api/auth/firebase/exchange` e autorização de perfil/admin.
- **Aceite/validação:** botões habilitados; login Google e senha testados com contas autorizada/não autorizada e MFA; sessão criada e logout funcional; teste automatizado falha se a configuração obrigatória estiver ausente; alerta dispara antes de usuários reportarem.
- **Evidência de implementação local:** `lib/firebase-client-config.ts` centraliza validação sem expor valores; `next.config.ts` bloqueia builds Vercel Preview/Production inválidos; `npm run auth:preflight` oferece o mesmo gate para outras promoções; os dois formulários exibem alerta acessível e suporte quando a configuração não está disponível; testes unitários cobrem configuração válida, ausente e inválida, e o smoke E2E cobre os dois estados públicos de indisponibilidade.
- **Pendências externas verificáveis:** reconciliar as três variáveis nos ambientes Vercel corretos sem registrar valores; confirmar o domínio autorizado no Firebase; executar redeploy controlado; validar Google, senha, MFA, contas autorizada/não autorizada, sessão e logout; configurar monitoramento pós-deploy. Essas ações não foram executadas neste pacote local.

#### WEB-002 — Criar gate de release e smoke pós-deploy

- **Prioridade:** P1; **estado:** parcial — gate local preparado em 04/11/2026, Preview/Production e rollback reais pendentes; **natureza:** dívida estrutural de operação.
- **Evidência:** a CI valida somente o checkout local (`.github/workflows/ci.yml:21-31`); `vercel.json:1-5` define apenas framework/região; não há teste contra Preview/Production nem validação de env. O E2E cobre 10 cenários públicos/isolamento visual, não autenticação (`e2e/smoke.spec.ts:1-88`).
- **Risco:** um build verde pode publicar portais inutilizáveis, associações mobile incorretas ou API incompatível.
- **Proposta:** promoção Preview → Production com checks de saúde, env obrigatória, headers, `.well-known`, homepage, catálogo e login configurado; smoke autenticado seguro com contas sintéticas e rollback documentado.
- **Dependências:** API com ambiente de smoke e contas sintéticas; App para validação real de universal/app links.
- **Aceite/validação:** pipeline bloqueia promoção quando env/login/contrato falham; relatório guarda deployment URL e request IDs; rollback ensaiado.
- **Evidência de implementação local:** `.github/workflows/release-gate.yml` recebe URL/SHA/ambiente e separa Preview de Production; `scripts/release-preflight.mjs` rejeita entradas inválidas; `scripts/remote-release-smoke.mjs` cobre homepage, `.well-known`, termos e ambos os logins, falhando quando a configuração de autenticação não está disponível; `playwright.release.config.ts` e `e2e/release-auth.spec.ts` suportam conta sintética apenas por secrets e tornam sua ausência uma falha em Production; o artifact registra URL, SHA e `x-request-id`/`x-vercel-id` quando disponíveis. A CI existente continua instalando Chromium antes do E2E e agora valida o preflight do gate.
- **Runbook:** `docs/operations/release-gate.md` documenta promoção, proteção de secrets, evidências, falha fechada e rollback para versão previamente validada.
- **Pendências externas verificáveis:** cadastrar conta sintética mínima e secrets aprovados; executar o workflow contra Preview e Production reais; validar contrato/API com a conta; ensaiar rollback na Vercel; confirmar monitoramento e ownership. Nenhuma dessas ações remotas foi executada neste pacote.

#### WEB-003 — Endurecer cabeçalhos e política de conteúdo

- **Prioridade:** P1; **estado:** parcial — baseline local e CSP Report-Only concluídos em 04/11/2026; enforcement/smoke real pendentes; **natureza:** quick win com etapa estrutural de CSP.
- **Evidência:** `next.config.ts:6-16` configura somente `Content-Type` dos manifests. Produção apresentou HSTS da plataforma, mas não CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` ou proteção contra framing.
- **Risco:** superfície maior para XSS, clickjacking, vazamento de referrer e abuso de capacidades do navegador, especialmente em telas com dados de saúde/admin.
- **Proposta:** adicionar baseline global (`nosniff`, `frame-ancestors`, referrer e permissions); implantar CSP primeiro em `Report-Only`, inventariar Firebase/Google Fonts/conexões, migrar para enforcement com nonce/hash; usar `Cache-Control: private, no-store` e `X-Robots-Tag` nas rotas sensíveis.
- **Dependências:** domínios Firebase/Auth/API e eventual coletor de relatórios CSP.
- **Aceite/validação:** Mozilla Observatory/securityheaders compatível com a meta; login Google/MFA funciona; CSP não contém `unsafe-eval` em produção e violações são monitoradas.
- **Evidência de implementação local:** `lib/security-headers.ts` define baseline global (`nosniff`, deny framing, referrer e capabilities) e CSP Report-Only sem `unsafe-eval`/wildcards; `next.config.ts` aplica `private, no-store` e `X-Robots-Tag` a `/admin/**`, `/profissional/**` e `/api/**`; testes unitários, E2E e smoke remoto verificam os headers. O inventário e a sequência segura até enforcement estão em `docs/security/headers-and-csp.md`.
- **Pendências externas verificáveis:** executar Google/senha/TOTP no Preview e Production; configurar coletor de violações aprovado; observar e corrigir reports; remover `unsafe-inline` com suporte oficial de nonce/hash; ensaiar enforcement e rollback. Produção e enforcement não foram alterados neste pacote.

#### WEB-004 — Observabilidade e recuperação de falhas

- **Prioridade:** P1; **estado:** parcial — boundaries e correlação local entregues em 04/11/2026; observabilidade/SLO remotos pendentes; **natureza:** dívida estrutural.
- **Evidência:** não existem `app/error.tsx`, `app/global-error.tsx`, `loading.tsx` ou instrumentação; a única emissão server-side localizada é `console.error` em `lib/event-details-server.ts:12-20`. Request IDs aparecem em vários corpos, mas os BFFs nem sempre preservam headers de correlação; por exemplo, `app/admin/api/access/[...path]/route.ts:78-81` repassa só `content-type`.
- **Risco:** telas brancas/erros genéricos, diagnóstico lento, ausência de SLO e correlação quebrada entre navegador, Vercel e API.
- **Proposta:** error boundaries por superfície, páginas 404/5xx coerentes, logging estruturado e sanitizado, tracing/erro client-server, Web Vitals, SLOs de login/BFF/deep link e preservação padronizada de `x-request-id`.
- **Dependências:** convenção canônica de erros/requestId da API; fornecedor de observabilidade aprovado pela privacidade.
- **Aceite/validação:** falhas sintéticas geram UI recuperável e evento correlacionável; nenhum dado clínico/token é enviado; dashboards e alertas possuem owner/runbook.
- **Fatia entregue:** `app/admin/error.tsx` e `app/profissional/error.tsx` oferecem retry/suporte sem mensagem, stack ou digest; loadings usam live region. `lib/request-correlation.ts` allowlista IDs opacos e os BFFs de sessão/access/care/contexto/pacientes tocados preservam `x-request-id` seguro sem copiar headers internos ou payload. Testes rejeitam PII/control characters e comprovam ausência de dados sensíveis nos headers. Runbook: `docs/operations/error-recovery-correlation.md`.
- **Pendências:** smoke autenticado de falha/retry/cópia; correlação ponta a ponta com API; error boundary global público; fornecedor aprovado; logs estruturados, Web Vitals, SLOs, dashboards, alertas e ownership.

#### WEB-005 — Testar os caminhos críticos e acessibilidade em matriz real

- **Prioridade:** P1; **estado:** parcial — testes semânticos da fatia administrativa adicionados em 04/11/2026; matriz autenticada/browser permanece pendente; **natureza:** dívida estrutural de qualidade.
- **Evidência:** Playwright usa apenas `Desktop Chrome` (`playwright.config.ts:19-23`); não há E2E de admin, sessão, MFA, portal, documentos, agenda, chat ou revisão. O E2E local exige instalação manual do browser e falhou antes dos testes por essa pré-condição.
- **Risco:** regressões móveis/iPad/Safari e falhas autenticadas chegam à produção; fluxos clínicos não têm proteção ponta a ponta.
- **Proposta:** fixtures de autenticação/mock contratual, projetos Mobile Safari/iPad/Android, axe-core, navegação por teclado, zoom 200/400%, contraste e testes de estados loading/empty/error/denied/success.
- **Dependências:** contratos/mocks da API; jornadas conjuntas com App para deep links.
- **Aceite/validação:** suíte mínima cobre login, MFA, autorização, troca de contexto, revogação, documento e erro; zero violações críticas axe; execução local autocontida ou preflight instrutivo.
- **Fatia entregue:** testes unitários renderizam as primitives de feedback e formulário, cobrindo live regions, alertas acionáveis, label, `aria-describedby` e `aria-invalid`. O painel extraído usa controles nativos de teclado e `aria-busy`. E2E autenticado, Safari/iPad/Android, zoom e axe continuam pendentes e impedem concluir WEB-005.

### Next — consolidar contratos, segurança e experiência

#### WEB-006 — Tipar e validar ambiente/feature flags centralmente

- **Prioridade:** P1; **estado:** confirmado.
- **Evidência:** env é lida diretamente em múltiplos pontos (`lib/site-config.ts:6-14`, páginas de login e `app/profissional/page.tsx:19-30`); onze flags `NEXT_PUBLIC_ENABLE_*` controlam módulos, sem schema ou relatório de configuração. `.env.example` deixa Firebase vazio por design, mas CI/build não verifica requisitos por ambiente.
- **Risco:** divergência silenciosa build/runtime, combinações inválidas e publicação parcial de features.
- **Proposta:** módulo server-only com schema, matriz de dependência entre flags e fail-fast por ambiente; expor ao cliente apenas valores realmente públicos; endpoint/diagnóstico operacional sem segredos.
- **Aceite/validação:** combinações inválidas falham antes do deploy; teste cobre prod/preview/dev; nenhuma variável secreta entra no bundle.

#### WEB-007 — Contratos API gerados e infraestrutura BFF comum

- **Prioridade:** P1; **estado:** confirmado.
- **Evidência:** não há schema/OpenAPI gerado no repositório; DTOs/parsers e allowlists são manuais em `lib/professional/*` e rotas `app/{admin,profissional}/api/**`. Várias rotas repetem same-origin, forward, parse de erro, no-store e MFA.
- **Risco:** drift de enum/path/status, tratamento divergente de erros e custo elevado para cada endpoint.
- **Proposta:** consumir artefato OpenAPI versionado da API, gerar tipos/clientes, adicionar contract tests e criar factory BFF com allowlist explícita, limites, correlação, headers e erro canônico.
- **Dependências:** API publicar/validar OpenAPI e política de compatibilidade.
- **Aceite/validação:** breaking change falha na CI; nenhum `any`; todos os BFFs preservam status, erro/requestId permitidos e headers seguros.

#### WEB-008 — Defesa em profundidade dos BFFs e sessão

- **Prioridade:** P1; **estado:** confirmado quanto às lacunas locais; abuso efetivo é hipótese.
- **Evidência:** cookies são `httpOnly`, `secure` em produção, `sameSite=lax` e escopados (`lib/admin/admin-session.ts:8-18`, `lib/professional/professional-session.ts:11-23`), o que é positivo. Porém `sameOrigin` aceita ausência de `Origin`, corpos são lidos sem limite explícito e não há rate limit no BFF (`app/admin/api/session/route.ts`, `app/api/deep-link-handoffs/route.ts`, proxies).
- **Risco:** brute force/amplificação, payload excessivo e dependência exclusiva de controles upstream.
- **Proposta:** checar `Origin`/`Sec-Fetch-Site`, CSRF token onde necessário, limite de corpo/timeout, rate limiting por rota sensível, rotação/revogação de refresh e testes de fixation/replay; confirmar controles equivalentes na API antes de duplicar.
- **Aceite/validação:** testes negativos cross-site/oversize/rate; tokens nunca aparecem em logs; logout e 401 limpam sessão de forma consistente.

#### WEB-009 — Sistema visual e acessibilidade dos portais

- **Prioridade:** P2; **estado:** parcial — primitives de feedback/form aplicadas à prontidão do piloto em 04/11/2026; auditoria ampla pendente.
- **Evidência:** existem 62 controles de formulário e somente 37 ocorrências do padrão simples label+controle; há foco customizado parcial, responsividade e `prefers-reduced-motion` no site público, mas os três CSS somam cerca de 2.644 linhas. Formulários complexos e painéis são densos e implementados individualmente.
- **Risco:** inconsistência de foco/erro/teclado, regressões mobile e alto custo para manter o padrão premium.
- **Proposta:** biblioteca interna de Field, Select/combobox, DateTime, Dialog/BottomSheet web responsivo, Feedback, EmptyState, DataTable e Button; tokens compartilhados; auditoria WCAG 2.2 AA com leitores de tela.
- **Aceite/validação:** componentes têm documentação e testes; foco não se perde; mensagens usam `aria-describedby/live`; touch targets e contraste aprovados; 320 px e iPad sem overflow.
- **Fatia entregue:** `admin-primitives.ts` adiciona `FeedbackState` e `FormField`; `PilotReadinessPanel` aplica loading/empty/success persistentes, erros de campo associados e controles nativos. O layout reutiliza CSS/tokens e o breakpoint de uma coluna existente. Dialog/bottom sheet não foi criado sem necessidade real. Contraste, leitores de tela, touch targets e matriz de viewport ainda requerem validação assistida.

#### WEB-010 — Governança jurídica e versionamento de consentimento

- **Prioridade:** P1; **estado:** parcial — governança técnica local entregue em 04/11/2026; adequação/aprovação jurídica e adoção multi-repo pendentes.
- **Evidência:** termos profissionais são texto estático versão 1.0 (`app/health-professional-terms/page.tsx:5,91-100`); termos/privacidade gerais também residem em componentes. O próprio checkpoint anterior registra revisão jurídica pendente.
- **Risco:** texto e versão aceitos no App/API divergirem, ou publicação ocorrer sem aprovação/arquivo histórico.
- **Proposta:** revisão jurídica LGPD/saúde, identificador imutável comum entre Web/API/App, histórico público, data de vigência, owner/aprovação e teste que compara versão/link esperado.
- **Dependências:** API persiste versão/aceite; App abre URL e envia exatamente a versão vigente.
- **Aceite/validação:** parecer/aprovação registrada; versão única nos três projetos; versões antigas auditáveis; mudança material força novo aceite.
- **Fatia entregue:** `lib/legal-documents.ts` centraliza ID, versão 1.0, data ISO, canonical, arquivo permanente e status explícito `PENDING_LEGAL_REVIEW`; página e metadata exibem versão/link; `/legal/manifest.json` oferece contrato público e `/legal/health-professional-terms/1.0` mantém a rota auditável. Testes comparam manifest/constante e unicidade do histórico. Processo: `docs/legal/health-professional-terms-governance.md`.
- **Pendências:** parecer jurídico, owner/aprovação registrada, snapshot realmente publicado, adoção da constante/manifest na API e no App, persistência do aceite e teste ponta a ponta. Nenhuma aprovação foi inferida.

#### WEB-011 — Decompor módulos monolíticos e CSS

- **Prioridade:** P2; **estado:** parcial — primeira extração concluída em 04/11/2026.
- **Evidência:** `professional-care-review-panel.tsx` tem ~818 linhas, `admin-dashboard.tsx` ~666, `access-package-policy-panel.tsx` ~477; `admin.module.css` ~1.147 e `professional.module.css` ~955 linhas.
- **Risco:** conflitos, regressões cruzadas, renderizações desnecessárias e baixa testabilidade.
- **Proposta:** separar por domínio/use case, hooks de dados, adapters e componentes apresentacionais; extrair primitives/tokens sem big-bang.
- **Aceite/validação:** limites de tamanho/complexidade acordados; testes por módulo; bundle e interações não pioram.
- **Fatia entregue:** a prontidão do piloto foi movida para `pilot-readiness-panel.tsx`, com tipos e apresentação próprios; o painel principal caiu de 818 para 717 linhas e preservou fetching, sessão e mutações. Responsabilidades e próximos limites estão em `docs/features/admin-care-review-ui.md`. Denúncias, credenciais, dashboard e CSS monolítico permanecem para fatias posteriores.

#### WEB-012 — Semântica de cache adequada ao serverless e dados sensíveis

- **Prioridade:** P2; **estado:** resolvido localmente em 04/11/2026; validação operacional pendente.
- **Evidência:** pacientes usam `Map` em memória com até 100 entradas/15 s (`lib/professional/professional-patient-cache.ts:3-21`). Em serverless, instâncias não compartilham memória e invalidação é local; a chave usa epoch de sessão, o que reduz mistura, mas não garante invalidação global.
- **Risco:** comportamento inconsistente entre instâncias e complexidade sem benefício previsível; dados sensíveis permanecem em memória do processo.
- **Proposta:** medir benefício; preferir ETag/no-store direto ou cache externo com criptografia, TTL, namespace e invalidação definida; documentar threat model.
- **Aceite/validação:** teste multi-instância/revogação; nenhuma resposta revogada reaparece; hit ratio e latência justificam o cache.
- **Decisão/evidência:** o `Map` de 15 segundos foi removido em vez de ganhar uma invalidação apenas local. `app/profissional/api/patients/[profileId]/route.ts` consulta a API em toda leitura por `readProfessionalPatientsFresh(..., cache: "no-store")`; sessão, perfil e autorização continuam no upstream. O teste de revogação simula resposta 200 seguida de 403 e comprova duas chamadas sem reaproveitamento. Como não há mais cache server-side clínico, hit ratio deixa de ser um critério de promoção; reintrodução exige medição, threat model e invalidação distribuída documentados.

### Later — performance, descoberta e manutenção contínua

#### WEB-013 — Orçamento de performance e Web Vitals

- **Prioridade:** P2; **estado:** ausência confirmada.
- **Evidência:** não há coleta Web Vitals, bundle analyzer ou budgets. A home usa imagens grandes com Next Image, enquanto convite usa `<img>` remoto (`app/convite/[slug]/page.tsx:92`).
- **Proposta:** RUM consentido/minimizado, budgets por rota, análise de JS/hydration, otimização de imagens/fontes e lazy loading dos painéis.
- **Aceite:** metas LCP/INP/CLS por p75, CI avisa regressão e nenhum identificador clínico entra em analytics.

#### WEB-014 — SEO e conteúdo público governado

- **Prioridade:** P2; **estado:** confirmado.
- **Evidência:** metadata/OG/canonical existem (`app/layout.tsx`), sitemap inclui home e links legais (`app/sitemap.ts`), mas não há dados estruturados, `lastModified` real nem governança editorial. `robots.ts` permite tudo, confiando no meta noindex dos layouts privados.
- **Proposta:** Organization/SoftwareApplication/FAQ schema quando verdadeiro, datas reais, Search Console, robots explicitamente defensivo para `/admin`, `/profissional` e APIs, conteúdo/claims com owner.
- **Aceite:** rich-results sem erro, sitemap estável, rotas privadas ausentes do índice e claims revisados.

#### WEB-015 — Atualizações de dependência e higiene do runner

- **Prioridade:** P3; **estado:** confirmado.
- **Evidência:** audit de produção sem vulnerabilidades; existem patches de Next/React e versões novas de Firebase. Testes emitem `MODULE_TYPELESS_PACKAGE_JSON` porque `package.json` não declara módulo.
- **Proposta:** Renovate/Dependabot em lotes, patch mensal com canary, decidir `type: module` ou runner explícito e manter lockfile.
- **Aceite:** atualizações passam matriz completa; zero warnings conhecidos; política de patch crítico definida.

#### WEB-016 — Runbooks e ownership operacional

- **Prioridade:** P2; **estado:** ausência confirmada.
- **Evidência:** CI e Vercel estão configurados, mas não há no repositório runbook de deploy, rollback, env, incidentes de login/deep link, SLO ou owners por superfície.
- **Proposta:** runbooks curtos, checklist de release, RACI, restauração de env, rotação de credenciais e incidente de dados.
- **Aceite:** exercício trimestral; uma pessoa sem contexto consegue diagnosticar e reverter seguindo o documento.

## 4. Sequenciamento sugerido

1. **0–2 dias:** WEB-001; em paralelo, smoke mínimo de WEB-002 e cabeçalhos seguros não-CSP de WEB-003.
2. **Semana 1:** WEB-002, WEB-004 e CSP Report-Only; criar contas sintéticas e alertas.
3. **Semanas 2–3:** WEB-005, WEB-006, WEB-007 e WEB-010.
4. **Semanas 4–6:** WEB-008, WEB-009, WEB-011 e decisão de cache WEB-012.
5. **Contínuo:** WEB-013 a WEB-016.

## 5. Quick wins versus dívida estrutural

**Quick wins:** corrigir env Firebase e redeploy; mensagem explícita de indisponibilidade; headers básicos; smoke HTTP; propagar request ID; adicionar Safari/mobile ao Playwright; declarar/preparar browser local; remover warnings do runner.

**Dívida estrutural:** contracts gerados, factory BFF, observabilidade/SLO, design system acessível, decomposição dos painéis, governança jurídica multi-repo e promoção controlada de releases.

## 6. Dependências a comunicar ao coordenador

- **API:** OpenAPI versionado; erros/requestId; contas de smoke; rate limits; política de versão dos termos; contrato de flags e deep-link handoff.
- **App:** universal/app links; versão e URL dos termos; testes de retorno da loja; coerência de jornadas profissionais e consentimento.
- **Infra:** Vercel Production env, projeto Firebase autorizado, domínios OAuth, observabilidade, CSP reporting e processo de rollback.

