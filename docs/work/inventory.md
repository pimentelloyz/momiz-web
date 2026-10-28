# Inventário do painel administrativo Momiz

Atualizado em 28 de outubro de 2026. Este documento descreve o que está implementado no repositório web; não considera backlog, mock ou rota permitida no proxy como funcionalidade pronta.

## Convenções de estado

- **confirmado**: há fluxo executável e evidência direta no código.
- **parcial**: existe implementação útil, mas falta uma parte relevante do fluxo ou de sua robustez.
- **não encontrado**: a capacidade foi procurada no código relacionado e não foi localizada.
- **incerto**: o web pressupõe um contrato, mas a implementação ou o comportamento da dependência não pode ser confirmado neste repositório.

## Visão geral

O painel está concentrado em `/admin`, sem rotas próprias por seção. Após autenticação, uma única tela cliente alterna entre quatro áreas: acessos e demos, planos e recursos, profissionais de saúde e relatórios anônimos. A camada web mantém tokens em cookies HTTP-only e encaminha somente uma lista explícita de rotas para a API.

| Domínio/tela | Estado | Capacidade observada | Evidência |
| --- | --- | --- | --- |
| Login administrativo | **confirmado** | Login Firebase por senha ou Google, desafio TOTP quando exigido, troca do token Firebase por sessão da API e validação da autorização administrativa | `app/admin/login/page.tsx`, `app/admin/ui/admin-login-form.tsx`, `app/admin/api/session/route.ts` |
| Sessão e proteção | **confirmado** | Proteção server-side de `/admin`, cookies HTTP-only, refresh de token, logout e redirecionamento quando a sessão expira | `app/admin/page.tsx`, `lib/admin/admin-session.ts`, `app/admin/ui/admin-dashboard.tsx` |
| Acessos e demos | **confirmado** | Busca de contas, consulta do acesso efetivo, concessão/edição/revogação de demo, overrides e histórico de auditoria da conta | `app/admin/ui/admin-dashboard.tsx` |
| Planos e recursos | **confirmado** | Consulta da política vigente e histórico; criação, edição, validação, descarte, publicação e clonagem de rascunhos; diff e prévia de impacto | `app/admin/ui/access-package-policy-panel.tsx`, `app/admin/ui/access-policy-types.ts` |
| Profissionais de saúde | **confirmado** | Fila por situação, análise de credenciais, verificação/correção/rejeição/suspensão, renovação e abertura controlada de comprovante | `app/admin/ui/professional-care-review-panel.tsx` |
| Operação do piloto profissional | **confirmado** | Métricas operacionais, gates com justificativa/evidência, trilha auditável e exportação CSV | `app/admin/ui/professional-care-review-panel.tsx` |
| Denúncias de comunicação | **confirmado** | Fila por estado, detalhe, resolução ou descarte justificado | `app/admin/ui/professional-care-review-panel.tsx` |
| Relatórios de cuidado | **confirmado** | Relatório agregado por período, supressão indicada para contagens pequenas e exportação CSV | `app/admin/ui/care-analytics-panel.tsx` |
| Testes automatizados do admin | **não encontrado** | Não há testes unitários nem casos Playwright para login, sessão ou qualquer uma das quatro áreas administrativas | `test/`, `e2e/smoke.spec.ts` |

## Autenticação, autorização e sessão

### Capacidades confirmadas

- **confirmado** — `/admin` verifica a existência do refresh token no servidor e envia usuários sem sessão para `/admin/login`: `app/admin/page.tsx` e `lib/admin/admin-session.ts`.
- **confirmado** — o login cliente aceita senha e Google via Firebase, reconhece o desafio `auth/multi-factor-auth-required` e resolve TOTP de seis dígitos: `app/admin/ui/admin-login-form.tsx`.
- **confirmado** — a rota de sessão valida same-origin, troca o `idToken` em `/api/auth/firebase/exchange` e consulta `/api/admin/users?pageSize=1` para confirmar autorização: `app/admin/api/session/route.ts`.
- **confirmado** — tokens de acesso e refresh ficam em cookies `httpOnly`, `sameSite=lax`, `secure` em produção e limitados ao caminho `/admin`: `lib/admin/admin-session.ts`.
- **confirmado** — uma resposta 401 provoca uma tentativa de refresh e, se persistir, limpa a sessão: `lib/admin/admin-session.ts`.
- **confirmado** — MFA exigido pela API durante login ou proxy limpa a sessão e força nova autenticação: `app/admin/api/session/route.ts` e `app/admin/api/access/[...path]/route.ts`.

### Lacunas e riscos

- **parcial** — `hasAdminSession` confirma somente a presença do refresh token, não sua validade. A autorização efetiva ocorre nas chamadas seguintes à API; portanto a primeira renderização pode aceitar cookie expirado antes do redirecionamento cliente: `lib/admin/admin-session.ts`, `app/admin/page.tsx`.
- **parcial** — o frontend exibe mensagens da API, mas descarta códigos estruturados e `requestId`; isso reduz a capacidade de suporte correlacionar uma falha: `app/admin/ui/admin-api-client.ts`.
- **não encontrado** — não há teste automatizado do isolamento de cookies, refresh, same-origin, allowlist, MFA ou logout. Os testes E2E cobrem site público e login profissional, não `/admin`: `test/`, `e2e/smoke.spec.ts`.
- **incerto** — papéis/permissões granulares não são renderizados nem avaliados pelo web. O painel depende integralmente da allowlist e autorização da API, conforme `README.md` e `app/admin/api/session/route.ts`.

## Acessos e demos

### Capacidades confirmadas

- **confirmado** — carrega até 30 contas e permite busca por nome, e-mail ou ID: `app/admin/ui/admin-dashboard.tsx`.
- **confirmado** — mostra pacote efetivo, uso/limite de eventos ativos, demos ativas ou agendadas e auditoria de alterações: `app/admin/ui/admin-dashboard.tsx`.
- **confirmado** — cria ou edita acessos temporários `DEMO`, `STANDARD` e `PRO`, com início, término, motivo e observações: `app/admin/ui/admin-dashboard.tsx`.
- **confirmado** — a demo personalizada oferece overrides booleanos e limites para convidados, presentes, sugestões e vínculos profissionais: `app/admin/ui/admin-dashboard.tsx`.
- **confirmado** — o cliente exige que convite profissional e limite positivo sejam concedidos juntos: `app/admin/ui/admin-dashboard.tsx`.
- **confirmado** — revogação exige motivo via prompt e chama endpoint específico: `app/admin/ui/admin-dashboard.tsx`.

### Lacunas e riscos

- **parcial** — a consulta usa `pageSize=30`, mas não há paginação, carregamento incremental nem indicação de total; contas além da primeira página ficam inacessíveis sem busca: `app/admin/ui/admin-dashboard.tsx`.
- **parcial** — há estado de carregamento e estado inicial sem seleção, mas uma busca sem resultados produz apenas uma lista vazia, sem mensagem explícita: `app/admin/ui/admin-dashboard.tsx`.
- **parcial** — não há confirmação visual antes de liberar ou editar demo; a revogação usa `window.prompt`, com experiência e acessibilidade inferiores ao restante do painel: `app/admin/ui/admin-dashboard.tsx`.
- **parcial** — os metadados de capabilities usados nos overrides de demo são uma lista local menor que o registro completo de planos. Novas capabilities da API não aparecem automaticamente nessa tela: `app/admin/ui/admin-dashboard.tsx`, `app/admin/ui/access-policy-metadata.ts`.
- **incerto** — validações de datas, limites e concorrência dependem da API; o cliente converte valores e envia o payload, mas não demonstra tratamento específico de conflito ou versão: `app/admin/ui/admin-dashboard.tsx`.

## Planos e recursos

### Capacidades confirmadas

- **confirmado** — consulta simultaneamente política vigente, rascunhos, registro de capabilities e 30 itens de histórico: `app/admin/ui/access-package-policy-panel.tsx`.
- **confirmado** — edita uma matriz tipada para `FREE`, `DEMO`, `STANDARD` e `PRO`, agrupada por metadados de capability: `app/admin/ui/access-policy-types.ts`, `app/admin/ui/access-policy-metadata.ts`.
- **confirmado** — salva e descarta rascunho sem alterar imediatamente o acesso publicado: `app/admin/ui/access-package-policy-panel.tsx`.
- **confirmado** — antes de publicar, chama validação, diff e prévia de impacto, mostrando erros, avisos, quantidade de mudanças e contas afetadas: `app/admin/ui/access-package-policy-panel.tsx`.
- **confirmado** — permite inspecionar diff histórico e clonar versão anterior para rollback por nova publicação: `app/admin/ui/access-package-policy-panel.tsx`.

### Lacunas e riscos

- **parcial** — o histórico é limitado a 30 itens e não possui paginação: `app/admin/ui/access-package-policy-panel.tsx`.
- **parcial** — labels e descrições são mantidos localmente. Capability nova retornada pelo registro aparece com chave técnica e sem descrição até atualização do web: `app/admin/ui/access-policy-metadata.ts`.
- **parcial** — a tela tem loading e estado de política inexistente, mas falhas são comunicadas somente pelo feedback global; não há recuperação localizada ou botão explícito de tentar novamente: `app/admin/ui/access-package-policy-panel.tsx`, `app/admin/ui/admin-dashboard.tsx`.
- **incerto** — controle de concorrência entre dois administradores e rejeição de publicação sobre versão obsoleta dependem da API; os tipos trazem `basedOnVersion`, mas a UI não implementa resolução de conflito: `app/admin/ui/access-policy-types.ts`, `app/admin/ui/access-package-policy-panel.tsx`.

## Profissionais de saúde e piloto

### Capacidades confirmadas

- **confirmado** — filtra perfis por estado de verificação e apresenta identidade, bio, credenciais declaradas e histórico de revisão: `app/admin/ui/professional-care-review-panel.tsx`.
- **confirmado** — suporta verificar, solicitar correção, rejeitar e suspender; ações negativas exigem motivo. Há textos específicos para renovação de credencial: `app/admin/ui/professional-care-review-panel.tsx`.
- **confirmado** — solicita URL temporária à API para abrir documentos de credencial, sem expor uma URL persistida no componente: `app/admin/ui/professional-care-review-panel.tsx`.
- **confirmado** — exibe métricas de vínculos, comunicações bloqueadas, auditoria, denúncias, perfis pendentes e credenciais próximas do vencimento: `app/admin/ui/professional-care-review-panel.tsx`.
- **confirmado** — administra gates enumerados de prontidão do piloto, exige justificativa mínima e referência de evidência para aprovação, preserva histórico e exporta CSV: `app/admin/ui/professional-care-review-panel.tsx`.
- **confirmado** — administra denúncias abertas/resolvidas/descartadas, exige nota e atualiza a contagem local após conclusão: `app/admin/ui/professional-care-review-panel.tsx`.

### Lacunas e riscos

- **parcial** — perfis, denúncias, métricas e gates compartilham um componente grande; falhas de métricas são silenciosas salvo expiração de sessão, podendo deixar zeros com aparência de dados reais: `app/admin/ui/professional-care-review-panel.tsx`.
- **parcial** — downloads abrem popup antes da resposta e fazem fallback para navegação da página; não há confirmação de expiração, tipo ou tamanho do documento no cliente: `app/admin/ui/professional-care-review-panel.tsx`.
- **não encontrado** — apesar de o proxy permitir `care/relationships` e `care/audit-logs`, não há chamada nem tela detalhada para consultar vínculos ou eventos de auditoria. O painel mostra somente agregados e logs anexos a outros recursos: `app/admin/api/access/[...path]/route.ts`, `app/admin/ui/professional-care-review-panel.tsx`.
- **parcial** — não há paginação visível nas filas de perfis ou denúncias: `app/admin/ui/professional-care-review-panel.tsx`.
- **incerto** — validade real dos gates, critérios regulatórios e bloqueio de rollout são autoridade da API/processo externo. A própria UI informa que registrar gates não ativa rollout: `app/admin/ui/professional-care-review-panel.tsx`.

## Relatórios anônimos

### Capacidades confirmadas

- **confirmado** — o operador escolhe intervalo e consulta `care/analytics` com timestamps ISO: `app/admin/ui/care-analytics-panel.tsx`.
- **confirmado** — totais e agrupamentos carregam marca explícita de supressão; valores suprimidos não são escritos no CSV: `app/admin/ui/care-analytics-panel.tsx`.
- **confirmado** — a interface comunica limiar de supressão menor que cinco e período máximo de 366 dias: `app/admin/ui/care-analytics-panel.tsx`.
- **confirmado** — exportação CSV inclui BOM, escapa células e diferencia indicador suprimido: `app/admin/ui/care-analytics-panel.tsx`.

### Lacunas e riscos

- **incerto** — anonimização e imposição do limiar são produzidas pela API; o web apenas respeita o campo `suppressed`. Não há verificação independente neste repositório: `app/admin/ui/care-analytics-panel.tsx`.
- **parcial** — as restrições de 366 dias são informadas em texto, mas os campos de data não impedem no cliente um intervalo maior; a rejeição depende da API: `app/admin/ui/care-analytics-panel.tsx`.
- **não encontrado** — não há agendamento, comparação de períodos, gráficos ou exportação além de CSV: `app/admin/ui/care-analytics-panel.tsx`.

## Contratos e dependências

### API

- **confirmado** — `API_BASE_URL` seleciona a API e tem fallback local/produção: `lib/site-config.ts`.
- **confirmado** — autenticação depende de `/api/auth/firebase/exchange` e `/api/auth/refresh`; autorização inicial depende de `/api/admin/users`: `app/admin/api/session/route.ts`, `lib/admin/admin-session.ts`.
- **confirmado** — o proxy BFF expõe somente padrões explícitos para usuários/demos, políticas de acesso, perfis/credenciais, métricas, prontidão, analytics, vínculos, auditoria e denúncias; mutações exigem same-origin: `app/admin/api/access/[...path]/route.ts`.
- **parcial** — DTOs de resposta são declarados localmente nos componentes, sem cliente OpenAPI ou tipos compartilhados. Mudança de contrato pode compilar e falhar apenas em execução: `app/admin/ui/admin-dashboard.tsx`, `app/admin/ui/access-policy-types.ts`, `app/admin/ui/professional-care-review-panel.tsx`, `app/admin/ui/care-analytics-panel.tsx`.
- **incerto** — a existência e semântica dos endpoints upstream não foram validadas aqui; são dependência obrigatória da API.

### Aplicativo Flutter e portal profissional

- **confirmado** — o painel governa capabilities consumidas por outras experiências, inclusive `care.professional_invite` e `care.professional_relationship_limit`: `app/admin/ui/admin-dashboard.tsx`, `app/admin/ui/access-policy-metadata.ts`.
- **incerto** — este repositório não prova que o aplicativo Flutter interpreta todas as capabilities e limites com a mesma semântica; alterações na matriz exigem validação de contrato no app.
- **incerto** — decisões de perfil, renovação, suspensão e denúncia afetam fluxos do portal profissional e do app, mas a propagação é responsabilidade da API. O painel não possui sincronização direta com o app.

## Qualidade transversal e dívida relevante

- **confirmado** — layout administrativo impede indexação por robôs: `app/admin/layout.tsx`.
- **confirmado** — o CSS contém regras responsivas para as superfícies administrativas: `app/admin/ui/admin.module.css`.
- **parcial** — as seções parecem abas, mas usam apenas botões em `nav`; não há semântica `tablist`/`tab`/`tabpanel`, `aria-selected` nem navegação por setas: `app/admin/ui/admin-dashboard.tsx`.
- **parcial** — o feedback global usa `role=status`, porém mensagens de erro e sucesso compartilham a mesma apresentação e não há associação por operação: `app/admin/ui/admin-dashboard.tsx`.
- **não encontrado** — não há teste automatizado de contratos administrativos, componentes, acessibilidade ou responsividade: `test/`, `e2e/smoke.spec.ts`.
- **parcial** — existe validação defensiva de CSV contra fórmulas no painel profissional, enquanto o CSV de analytics escapa aspas mas não neutraliza prefixos `=`, `+`, `-` ou `@`. Hoje os rótulos são locais/controlados, mas a estratégia é inconsistente: `app/admin/ui/professional-care-review-panel.tsx`, `app/admin/ui/care-analytics-panel.tsx`.

## Próximos pacotes sugeridos

1. **Cobertura crítica do admin** — testes do proxy/sessão e E2E com API simulada para login, MFA, demos, publicação de política, revisão profissional e analytics. Prioridade alta por envolver autorização e mutações sensíveis.
2. **Observabilidade de erros** — preservar código canônico e `requestId` da API, diferenciar erro/sucesso e oferecer repetição localizada. Requer alinhar o envelope de erro com a API.
3. **Paginação e estados explícitos** — adicionar paginação para contas, histórico, perfis e denúncias; incluir estados vazios e falhas por seção. Requer confirmar cursores/totais nos contratos da API.
4. **Auditoria operacional detalhada** — criar telas somente leitura para `care/relationships` e `care/audit-logs`, já permitidas no proxy, com filtros e paginação. Confirmar necessidade, escopo de dados e política de acesso antes de implementar.
5. **Contrato tipado** — gerar ou compartilhar DTOs a partir do OpenAPI administrativo e validar mudanças no CI, reduzindo drift entre API e web.
6. **Acessibilidade das seções e confirmações** — implementar padrão de abas acessível, foco/teclado, diálogo de revogação e anúncios de erro consistentes.
7. **Governança de capabilities** — decidir se labels e descrições passam a vir do registro da API ou se haverá verificação automática de cobertura dos metadados locais; validar também o consumo pelo Flutter.
8. **Robustez de analytics** — validar intervalo no cliente, uniformizar proteção de CSV e adicionar testes que garantam que métricas suprimidas nunca sejam exportadas.
