# MT-01 — binding técnico web de contexto e isolamento

Status: binding normativo do cliente web, pré-código. Vincula F01 diretamente e prepara F04, F05, F11 e F12. Implementa no cliente as decisões de [MT-01 — contrato técnico da API](../../../omah-api/docs/medical-team-roadmap/MT01_TECHNICAL_CONTRACT.md); o contrato central e o OpenAPI prevalecem.

## 1. Escopo e invariantes

O web identifica o contexto desejado em toda leitura ou mutação clínica, mas nunca decide se ele é autorizado. A API resolve conta, sessão, perfil, contexto, vínculo, estado, scope, grant e entitlement em cada request e aplica `deny by default`.

Invariantes:

1. contexto clínico é explícito por request; não é inferido de `patientUserId`, último item visitado ou filtro da tela;
2. `profileId` e `pregnancyId` são UUIDs opacos, nunca prova de autorização; `clinicId` não integra o contexto clínico MT-01;
3. troca de contexto invalida dados sensíveis do contexto anterior antes de buscar o novo;
4. uma resposta, cache, exportação ou deep link de um contexto não pode ser reutilizado em outro;
5. o admin de verificação não adota contexto clínico e não ganha acesso a prontuário;
6. contexto e autenticação são coisas distintas: cookie de sessão autentica; o contexto explícito delimita o request; a API autoriza ambos;
7. nenhuma regra comercial é calculada no web; F11 consome entitlements resolvidos pela API.

## 2. Superfícies e fronteiras

### Portal profissional

`/profissional` usa sessão própria, hoje implementada em `lib/professional/professional-session.ts`, `app/profissional/api/session/route.ts` e `app/profissional/api/care/[...path]/route.ts`. MT-01 evolui essa fronteira para bootstrap e requests contextuais. O portal pode listar apenas contextos autorizados pela API e nunca fabricar opção a partir de dados locais.

### Admin

`/admin` mantém sessão e proxy separados em `lib/admin/admin-session.ts`, `app/admin/api/session/route.ts` e `app/admin/api/access/[...path]/route.ts`. Operações administrativas recebem um `targetProfileId` ou recurso-alvo conforme OpenAPI, não um “contexto clínico ativo”. O shell admin nunca envia headers de contexto profissional e não reutiliza cache do portal.

### Pública e deep links

Uma rota pública pode resolver intenção minimizada, mas não carrega dados clínicos. Após autenticação, a intenção é revalidada e transformada em navegação contextual somente se o bootstrap listar aquele contexto. Token de convite segue contrato próprio de MT-02 e não vira credencial de contexto.

## 3. Modelo de contexto esperado

O contexto é a combinação explícita retornada por `POST /api/account/care-context/resolve`; MT-01 não define `contextId` sintético nem contexto ativo global no servidor.

```ts
type WebContext = {
  profileId: string;
  profileType: "PROFESSIONAL" | "PATIENT" | "COMPANION";
  profileVersion: number;
  pregnancyId: string;
  pregnancyVersion: number;
  accessKind: "OWNER" | "COMPANION_MEMBERSHIP" | "PROFESSIONAL_RELATIONSHIP";
  membershipId: string | null;
  relationshipId: string | null;
};
```

`profileId` e `pregnancyId` são obrigatórios nas rotas clínicas v2. Clínica permanece superfície organizacional separada: `CareClinicMembership` nunca concede acesso à pregnancy. Contexto profissional é selecionável apenas quando a API listar uma relação visível; vínculo encerrado/revogado deixa de resolver contexto clínico. Essas propriedades continuam sendo entrada de autorização, não autorização em si.

## 4. Bootstrap de sessão

Após o exchange Firebase existente, o BFF chama `GET /api/account/care-profiles`. A resposta é minimizada, não inclui dados clínicos e segue o contrato central:

```json
{
  "profiles": [
    {
      "id": "8e954350-5c54-4d7c-a58c-06cb7ac85919",
      "type": "PROFESSIONAL",
      "status": "ACTIVE",
      "version": 1,
      "professional": {
        "professionalProfileId": "9a954350-5c54-4d7c-a58c-06cb7ac85919",
        "verificationStatus": "VERIFIED"
      },
      "contexts": [
        {
          "pregnancyId": "3dd3776b-683a-4861-b555-ae528fb99518",
          "accessKind": "PROFESSIONAL_RELATIONSHIP",
          "status": "ACTIVE"
        }
      ]
    }
  ],
  "requestId": "req_opaque"
}
```

Decisões do cliente:

- o primeiro contexto não é selecionado silenciosamente quando houver mais de uma opção;
- preferência local é apenas conveniência; o cliente confirma `profileId` e `pregnancyId` na lista e chama `POST /api/account/care-context/resolve`;
- contexto único `ACTIVE` pode ser selecionado automaticamente e anunciado;
- bootstrap sem perfil renderiza “cadastro necessário”; sem contexto utilizável renderiza vazio/denied conforme código;
- tokens nunca entram no DTO React, HTML, localStorage ou JavaScript cliente.

O BFF espera a resolução central exatamente com `profileId`, `pregnancyId` e `expectedProfileVersion`, e persiste a escolha somente depois de resposta contendo `profileVersion`, `pregnancyVersion`, `accessKind`, `membershipId|relationshipId` e `requestId`.

## 5. Transporte por request

### Escolha normativa

Para operações contextuais do browser ao BFF, o contexto fica em segmento de path:

```text
/profissional/api/profiles/{profileId}/pregnancies/{pregnancyId}/summary
/profissional/api/profiles/{profileId}/pregnancies/{pregnancyId}/patients
/profissional/api/profiles/{profileId}/pregnancies/{pregnancyId}/agenda
```

O BFF valida somente formato/tamanho do identificador, obtém o bearer token de cookie HTTP-only e encaminha à API:

```http
Authorization: Bearer <server-only>
X-Momiz-Profile-Id: 8e954350-5c54-4d7c-a58c-06cb7ac85919
X-Momiz-Pregnancy-Id: 3dd3776b-683a-4861-b555-ae528fb99518
X-Request-Id: req_generated_or_propagated
```

Os headers `X-Momiz-Profile-Id` e `X-Momiz-Pregnancy-Id` são internos BFF→API. Headers de contexto enviados diretamente pelo browser são descartados e nunca encaminhados. O BFF encaminha a rota upstream canônica `/api/care/v2/pregnancies/{pregnancyId}/...`; a API compara path/header e valida conta, perfil, pregnancy, membership ou relationship.

### O que é permitido

- **path:** `profileId`, `pregnancyId` e IDs opacos de recursos; é a fonte explícita de contexto para o BFF;
- **query:** somente filtros, cursor, ordenação e período publicados; nunca contexto como substituto do path;
- **body:** payload funcional e `version`/`idempotencyKey` quando definidos; não repete contexto;
- **headers browser→BFF:** cabeçalhos HTTP comuns e `Idempotency-Key` apenas quando o BFF/contrato aceitar; nenhum header de autorização/contexto fornecido pelo cliente;
- **headers BFF→API:** bearer server-only, `X-Momiz-Profile-Id`, `X-Momiz-Pregnancy-Id`, `X-Request-Id` e idempotência conforme OpenAPI.

### Persistência segura

O par `{ profileId, pregnancyId }` selecionado pode ser persistido como preferência em cookie HTTP-only, `Secure` em produção, `SameSite=Lax`, limitado a `/profissional`, com vida no máximo igual à sessão. Isso é persistência local do cliente, não contexto global no servidor. O cookie não é autoridade e não permite omitir contexto do path/headers. Em cada bootstrap, o BFF revalida a preferência contra a listagem e chama `care-context/resolve`; valor adulterado, expirado ou removido é ignorado e apagado.

Não usar localStorage, sessionStorage, cookie legível por JavaScript ou cache compartilhado para contexto clínico. Um identificador no path continua manipulável pelo usuário; segurança vem da autorização server-side, não do segredo do ID ou do cookie.

## 6. SSR, proxy e renderização

- o layout/página server-side verifica sessão e obtém bootstrap antes de renderizar shell contextual;
- SSR não incorpora bearer/refresh token nem listas clínicas no HTML quando não necessárias ao primeiro paint;
- o proxy mantém allowlist de path **e método**, como base em `lib/professional/care-proxy-policy.ts`, ampliada somente após OpenAPI;
- mutações continuam same-origin; respostas 401 limpam sessão; 403 contextual não deve encerrar automaticamente uma sessão válida;
- MFA obrigatório retorna erro canônico e pode limpar sessão conforme contrato central;
- `Cache-Control: private, no-store` é obrigatório em bootstrap e respostas clínicas; Next fetch usa `cache: "no-store"`;
- admin e profissional mantêm cookies, namespaces, rotas e módulos de cache separados.

## 7. Chaves de cache e estado cliente

Toda query contextual inclui, no mínimo:

```text
[surface, accountSessionEpoch, profileId, pregnancyId, resource, normalizedFilters]
```

Exemplos:

```text
["professional", epoch, "profile-uuid", "pregnancy-uuid", "patients", cursor, search]
["professional", epoch, "profile-uuid", "pregnancy-uuid", "agenda", from, to, status]
```

`patientUserId` nunca é parte suficiente de uma chave clínica; detalhe usa `pregnancyId`/`relationshipId` resolvidos no contexto. Cache não é persistido em storage do browser. Ao trocar, revogar ou terminar contexto: cancelar requests, remover queries do contexto anterior, limpar seleção/formulários/exports/object URLs, substituir navegação e só então buscar o novo bootstrap/recurso.

Respostas atrasadas carregam o par de contexto esperado no closure/metadado da query; se perfil ou pregnancy ativa mudou, são descartadas mesmo que tenham status 200.

## 8. Troca de contexto

Fluxo normativo:

1. usuário aciona seletor e confirma quando houver formulário não salvo;
2. UI entra em `switching`, bloqueia novas mutações e mantém nome do contexto de destino visível;
3. BFF chama `POST /api/account/care-context/resolve` com versão esperada;
4. cliente cancela requests e purga estado sensível anterior;
5. preferência HTTP-only é atualizada apenas após sucesso;
6. navegação usa `replace`, busca bootstrap/dados do destino e move foco ao `h1`;
7. falha preserva ou restaura o contexto anterior somente se ele continuar válido; `PREGNANCY_CONTEXT_DENIED` remove a opção.

Troca não altera grants, entitlements ou vínculo. Não é permitido “lembrar” seleção por aba através de storage cliente divergente da sessão.

## 9. Logout e expiração

Logout limpa cookies de acesso, refresh e preferência de contexto; cancela requests, purga caches e object URLs e usa `replace` para login. O comportamento estende `clearProfessionalSession` em `lib/professional/professional-session.ts` quando o contrato for implementado.

Em 401, o BFF tenta refresh uma vez como hoje. Se falhar, limpa tudo. Em conflito de versão, refaz bootstrap/resolve uma vez, nunca repete mutação automaticamente sem idempotency key. Abas antigas devem falhar fechadas após logout/troca de conta por `accountSessionEpoch` diferente.

## 10. Deep links e retorno pós-login

Deep link web usa rota própria e IDs opacos, por exemplo:

```text
/profissional/profiles/{profileId}/pregnancies/{pregnancyId}/agenda/{appointmentId}
```

Após login:

1. `returnTo` aceita somente path relativo allowlisted, com limites de tamanho e formato;
2. bootstrap confirma o par `profileId`/`pregnancyId` disponível;
3. API reautoriza o recurso no contexto;
4. contexto diferente exige troca explícita/confirmada;
5. negado, removido ou encerrado renderiza estado seguro sem revelar existência/dados;
6. URL não contém e-mail, nome, diagnóstico, token de sessão ou conteúdo clínico.

O padrão seguro de `safeReturnTo` em `app/profissional/login/page.tsx` deve ser ampliado por parser de rotas allowlisted, não por regex aberta nem URL externa.

## 11. Erros e `requestId`

Envelope obrigatório esperado:

```json
{
  "error": {
    "code": "PREGNANCY_CONTEXT_DENIED",
    "message": "Este contexto não está mais disponível.",
    "requestId": "req_opaque",
    "details": null
  }
}
```

Códigos mínimos que o web trata explicitamente:

| Código | Comportamento web |
| --- | --- |
| `AUTH_USER_REQUIRED` | limpar sessão/contexto e ir ao login com retorno seguro |
| `MFA_REQUIRED` | limpar sessão incompatível e iniciar fluxo MFA |
| `CARE_CONTEXT_HEADERS_REQUIRED` | falha de binding/BFF; não repetir e registrar `requestId` |
| `CARE_CONTEXT_INVALID` | remover preferência inválida e refazer bootstrap |
| `CARE_PROFILE_NOT_FOUND` | estado sem perfil próprio; nunca fallback para outro papel |
| `CARE_PROFILE_ACCESS_DENIED` | purgar contexto, mostrar denied e não trocar de papel |
| `PREGNANCY_NOT_FOUND` | remover preferência própria; não revelar acesso cruzado |
| `PREGNANCY_CONTEXT_DENIED` | purgar contexto e mostrar denied sem enumerar recurso |
| `CARE_CONTEXT_TYPE_DENIED` | negar operação e manter contexto somente se ainda resolvível |
| `CARE_CONTEXT_MISMATCH` | falha fechada; refazer bootstrap/rota, sem repetir mutação |
| `PROFILE_VERSION_CONFLICT` | refazer list/resolve e pedir nova escolha se necessário |
| `PREGNANCY_VERSION_CONFLICT` | recarregar contexto/recurso e pedir revisão |
| `IDEMPOTENCY_KEY_REUSED` | falhar a mutação sem gerar nova chave nem repetir; exibir erro seguro/`requestId` e reconciliar o estado antes de nova ação |
| `LEGACY_CONTEXT_AMBIGUOUS` | bloquear fallback v1; exigir rota/contexto v2 |
| `RELATIONSHIP_INACTIVE` | estado terminated/read-only conforme resposta |
| `VERSION_CONFLICT` | preservar entrada, recarregar versão e pedir revisão |
| `QUOTA_EXCEEDED` | estado plan/limit vindo da API; preservar origem |

O cliente exibe `requestId` copiável em erro de suporte, sem stack, token ou payload. Códigos desconhecidos usam falha segura e telemetria minimizada.

## 12. Estados UX e acessibilidade

| Estado | Binding |
| --- | --- |
| loading/bootstrap | shell neutro com nome da superfície; não piscar dados do contexto anterior |
| switching | bloquear mutações, anunciar destino e progresso |
| empty | diferenciar sem perfil, sem contexto e sem recursos no contexto |
| error | retry seguro, mensagem e `requestId`; mutação não repete sem idempotência |
| offline | mostrar indisponibilidade; não reutilizar dados de outro contexto nem persistir clínico |
| denied | não revelar existência; ação para voltar a contexto permitido |
| plan | apresentar decisão da API; não confundir quota com consentimento |
| pending | verificação/consentimento em linguagem específica |
| read-only | ocultar/desabilitar mutações com motivo textual |
| terminated | purgar novos dados, explicar encerramento e respeitar retenção autorizada |

O seletor usa controle nativo ou padrão ARIA comprovado, nome acessível e contexto atual persistente no título/header. A troca anuncia resultado em live region, restaura foco no `h1` e funciona por teclado. Status não depende apenas de cor; loading respeita redução de movimento. Testes cobrem foco, nomes, ordem, zoom e viewport móvel.

## 13. Compatibilidade com `patientUserId`

Durante migração aditiva:

- respostas novas carregam `profileId`, `pregnancyId` e, temporariamente, `patientUserId` quando necessário;
- o web trata `patientUserId` somente como identificador legado de exibição/filtro compatível, nunca como contexto ou chave de autorização;
- cache e rotas novas priorizam IDs novos; nenhum fallback escolhe gestação quando houver ambiguidade;
- se a API retornar múltiplas gestações sem `pregnancyId`, o cliente falha com estado `CONTEXT_REQUIRED`, não mescla dados;
- endpoints legados permanecem atrás de flag e somente para contas sem contexto novo, conforme contrato central;
- telemetria agregada mede uso do fallback sem registrar IDs pessoais;
- remoção do legado exige zero consumo observado e teste de compatibilidade OpenAPI.

## 14. Feature flags, rollout e rollback

Flags centrais são resolvidas server-side e não concedem autorização:

- `CARE_CONTEXTS_READ_ENABLED`: list/resolve;
- `CARE_CONTEXTS_WRITE_ENABLED`: criação de perfil/pregnancy, fora do reader inicial web;
- `CARE_CONTEXTS_DUAL_WRITE_ENABLED`: compatibilidade transacional;
- `CARE_CONTEXTS_SHADOW_READ_ENABLED`: comparação v1/v2 sem dados sensíveis;
- `CARE_CONTEXTS_V2_ROUTES_ENABLED`: rotas clínicas v2 do canário.

O web não inventa flags comerciais. Uma flag de apresentação do deploy pode ocultar a entrada, mas nunca substitui as flags/autorizações centrais.

Ordem: testes automatizados → ambiente não produtivo com contas A/B sintéticas → equipe interna → piloto allowlisted → ampliação gradual. Métricas: bootstrap/switch success, erros por código, fallback legado, cache descartado e denied; nunca IDs ou conteúdo clínico.

Rollback desliga rotas/contexto novo e volta somente ao reader legado explicitamente compatível. Não apaga perfis/contextos, não reativa vínculo, não reduz autorização e não migra cookie cliente como fonte de verdade. Se fallback seguro não existir para a conta, o rollback fecha a feature com estado indisponível em vez de mesclar pacientes.

## 15. Matriz mínima de testes web

### Contrato e unidade

- parse/validação estrita dos UUIDs de perfil/pregnancy, deep link e `returnTo`;
- allowlist por path e método; header browser de contexto é descartado;
- cache key sempre contém surface/session epoch/profile/context;
- códigos/`requestId` mapeiam para estado correto;
- preferência adulterada ou ausente é ignorada e `resolve` é obrigatório antes do uso.

### Integração BFF/API

- bearer e os dois headers de contexto são adicionados server-side; nenhum token chega ao browser;
- contexto A com recurso B retorna denied indistinguível de inexistente;
- troca invalida cache e request atrasado de A não atualiza B;
- 401 refresh uma vez; stale refaz bootstrap sem duplicar mutação;
- logout limpa três cookies e cache; admin/profissional não compartilham sessão.

### E2E A/B e IDOR

- mesma conta, dois perfis e duas gestações: lista, detalhe, agenda, exportação e back/forward isolados;
- duas contas: editar path/context/resource não revela paciente alheia;
- vínculo revogado durante tela aberta bloqueia próxima leitura/mutação;
- aba antiga após troca/logout não repopula cache;
- deep link do contexto A autenticado no B resulta denied/troca explícita;
- quota de F11 não bloqueia leitura própria nem substitui autorização;
- admin verificador não abre rota clínica mesmo conhecendo IDs;
- teclado/leitor de tela cobrem seletor e todos os estados da seção 12.

## 16. Checklist pré-código

- [ ] Contrato central MT-01 e OpenAPI publicados, versionados e compatíveis com este binding.
- [ ] Fonte de verdade da gestação e modelo de perfis/acompanhante aprovados.
- [ ] UUIDs, cardinalidades, listagem e resolve DTOs conferem com o OpenAPI.
- [ ] Transporte path + headers `X-Momiz-Profile-Id`/`X-Momiz-Pregnancy-Id` e allowlists aprovados por segurança/API.
- [ ] Matriz F01/F04/F05/F11/F12 e testes negativos A/B/IDOR anexados ao pacote.
- [ ] Erros canônicos e `requestId` confirmados.
- [ ] Estratégia aditiva de `patientUserId` e condição de remoção aprovadas.
- [ ] Flags, coortes, métricas minimizadas, rollback e runbook definidos.
- [ ] UX/a11y para loading, switching, empty, error, offline, denied, plan, pending, read-only e terminated revisada.
- [ ] `docs/work/ACTIVE.md` registra arquivos, verificações e donos; nenhuma decisão aberta foi convertida em regra comercial.

Sem todos os itens, o pacote permanece documental e não autoriza alteração de código, sessão, proxy ou autenticação.
