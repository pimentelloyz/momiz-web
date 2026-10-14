# Backlog — Painel editorial web do Hub de dicas

**Status:** Backlog — não implementar agora  
**Prioridade sugerida:** P2  
**Escopo futuro:** `momiz-web`, `omah-api` e integração de leitura no `omah_app`  
**Responsáveis necessários:** Produto, Conteúdo, Saúde/Clínico, Engenharia e Privacidade

## Contexto atual

O aplicativo já lista dicas por meio de `GET /api/content`, com busca,
categorias e paginação. Os registros ficam na tabela `content_tips`.

A API já possui uma base de CMS protegida por autenticação administrativa:

- `GET /api/content/admin` — listar conteúdos por status;
- `POST /api/content/admin` — criar rascunho;
- `PATCH /api/content/admin/:id` — editar com controle de versão;
- `POST /api/content/admin/:id/publish` — publicar;
- `POST /api/content/admin/:id/archive` — arquivar;
- `GET /api/content/admin/:id/revisions` — consultar revisões.

O acesso é controlado pelas allowlists `ADMIN_USER_IDS` e `ADMIN_EMAILS`.
Ainda não existe uma interface web para operar esses endpoints.

O modelo atual contém apenas título, slug, resumo, categoria, tempo de leitura,
status e versão. Portanto, ele ainda não suporta um artigo completo nem registra
formalmente a revisão clínica e as fontes utilizadas.

## Objetivo

Criar um painel web interno para a equipe cadastrar, revisar, publicar, atualizar
e arquivar as dicas exibidas no aplicativo sem depender de migrations, alterações
manuais no banco ou uma nova versão do app.

O painel deve preservar histórico editorial, exigir revisão adequada para
conteúdo de saúde e impedir que rascunhos ou versões não aprovadas apareçam para
usuários.

## Fora de escopo

- Autoria automática ou publicação automática por inteligência artificial.
- Diagnóstico, prescrição ou recomendação médica personalizada.
- Comentários públicos nos artigos.
- Monetização, anúncios ou conteúdo patrocinado.
- Alteração do conteúdo diretamente pelo aplicativo móvel.
- Implementação do painel nesta etapa de backlog.

## Perfis e permissões

### Administrador

- Gerencia usuários autorizados ao painel.
- Pode criar, editar, enviar para revisão, publicar e arquivar.
- Pode restaurar uma revisão anterior, gerando uma nova versão auditável.

### Editor

- Cria e edita rascunhos.
- Envia conteúdo para revisão.
- Não publica conteúdo de saúde sem aprovação.

### Revisor clínico

- Analisa texto, fontes, alertas e limites da orientação.
- Aprova ou devolve com observações.
- Não precisa administrar usuários ou configurações do sistema.

Todas as ações editoriais devem registrar usuário, data, versão e transição de
estado.

## Fluxo editorial proposto

```text
Rascunho
   └─▶ Em revisão
          ├─▶ Alterações solicitadas ─▶ Rascunho
          └─▶ Aprovado ─▶ Publicado ─▶ Arquivado
```

Regras:

- Apenas conteúdos publicados são retornados por `GET /api/content`.
- Edição de um conteúdo publicado cria uma nova versão em rascunho; a versão
  pública permanece disponível até a aprovação da substituta.
- Arquivamento remove o conteúdo das novas listagens, sem apagar histórico.
- Publicação exige fontes e revisão clínica quando a categoria envolver saúde.
- Mudanças concorrentes devem continuar usando versionamento otimista.

## Modelo editorial futuro

Além dos campos já existentes, planejar:

- `body`: conteúdo completo em Markdown restrito ou blocos estruturados;
- `coverImageUrl`: imagem opcional com texto alternativo;
- `sources`: lista de título, organização, URL e data de consulta;
- `reviewStatus`: `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`;
- `reviewedById`, `reviewedAt` e observação do revisor;
- `scheduledAt`: publicação agendada opcional;
- `unpublishedAt`: retirada controlada de publicação;
- `audience`: gestante, puerpério, bebê ou geral;
- `gestationalWeekFrom` e `gestationalWeekTo`, quando aplicável;
- `tags`: termos para busca e organização editorial;
- `seoTitle` e `seoDescription`, caso exista leitura web pública futura.

O corpo não deve aceitar HTML arbitrário. A renderização precisa sanitizar links,
imagens e qualquer marcação vinda do editor.

## Telas do painel

### 1. Login e acesso negado

- Reutilizar a autenticação do ecossistema Momiz.
- Validar permissão no servidor, nunca apenas no cliente.
- Informar claramente quando o usuário não estiver na equipe editorial.

### 2. Lista editorial

- Busca por título, slug e tag.
- Filtros por categoria, estado, autor, revisor e data.
- Colunas: título, categoria, estado, versão, atualização, autor e revisor.
- Ações rápidas: editar, enviar para revisão, publicar, arquivar e visualizar.
- Indicadores de conteúdo sem fonte, sem revisão ou desatualizado.

### 3. Editor

- Título, slug, resumo, categoria, tempo de leitura e público.
- Editor de corpo com pré-visualização equivalente à renderização do app.
- Gerenciamento de fontes e imagem de capa.
- Salvamento explícito com indicação de versão e conflito concorrente.
- Contagem de caracteres e validações acessíveis.

### 4. Revisão

- Comparação entre versão anterior e versão proposta.
- Campo obrigatório de observação ao solicitar alterações.
- Identificação do revisor e horário da decisão.
- Checklist editorial e clínico antes da aprovação.

### 5. Histórico

- Linha do tempo imutável de versões e transições.
- Visualização de uma revisão sem alterar o conteúdo atual.
- Restauração por cópia para uma nova versão, nunca sobrescrita histórica.

### 6. Pré-visualização

- Simulação em larguras de celular.
- Estados de fonte ampliada e tema claro.
- Links identificáveis e aviso educativo visível.
- Visualização do card no Hub e do artigo completo.

## Evolução necessária da API

- Ampliar `ContentTip` e `ContentTipRevision` com corpo, fontes e revisão.
- Criar migration com valores opcionais para preservar o catálogo atual.
- Evoluir o contrato OpenAPI antes do painel.
- Retornar o corpo completo na leitura pública ou criar
  `GET /api/content/:slug` para detalhes.
- Adicionar filtros administrativos por texto, categoria, estado e revisor.
- Adicionar transições explícitas de revisão e publicação.
- Manter controle de versão otimista e respostas `409` acionáveis.
- Registrar auditoria sem armazenar tokens ou dados pessoais desnecessários.
- Aplicar rate limit às rotas administrativas e proteção contra conteúdo ativo.

## Integração com o aplicativo

- O Hub continua consumindo apenas conteúdos publicados.
- O card usa título, resumo, categoria e tempo de leitura.
- A página de leitura usa o corpo completo e as fontes retornadas pela API.
- Conteúdo antigo sem corpo deve ter fallback controlado para o resumo.
- Cache local precisa ser invalidado por versão ou `updatedAt`.
- Links externos devem abrir com confirmação e esquema seguro (`https`).
- O app deve manter o aviso de que o conteúdo é educativo e não substitui
  acompanhamento profissional.

## Segurança, saúde e privacidade

- A autorização administrativa precisa ocorrer na API.
- Conteúdo de saúde exige revisão humana antes de publicação.
- Fontes devem ser confiáveis, rastreáveis e ter data de consulta.
- Não utilizar dados pessoais de usuários para compor artigos.
- Logs não devem armazenar o corpo inteiro do conteúdo.
- Uploads devem validar tipo, tamanho e assinatura real do arquivo.
- Política de links deve bloquear esquemas inseguros e redirecionamentos
  suspeitos.
- Deve existir procedimento de retirada urgente de conteúdo incorreto.

## Observabilidade

- Registrar criação, edição, envio para revisão, aprovação, publicação e
  arquivamento.
- Medir falhas de publicação e conflitos de versão.
- Alertar sobre erros recorrentes nas rotas administrativas.
- Futuramente medir abertura e conclusão de leitura sem coletar conteúdo de
  saúde individual ou consultas de busca identificáveis.

## Plano de implementação futuro

### Fase 1 — Contrato e dados

- Definir o formato do corpo e das fontes.
- Evoluir schema, migration, entidades, revisões e OpenAPI.
- Criar endpoint público de detalhe.
- Cobrir compatibilidade com os 15 registros atuais.

### Fase 2 — Fundação do painel

- Autenticação, autorização e layout administrativo.
- Lista editorial com filtros e estados.
- Criação e edição de rascunhos.

### Fase 3 — Revisão e publicação

- Fluxo de revisão clínica.
- Comparação de versões.
- Publicação, arquivamento e retirada urgente.

### Fase 4 — Pré-visualização e integração

- Preview fiel ao app.
- Leitura completa no aplicativo.
- Cache por versão e tratamento de conteúdo legado.

### Fase 5 — Qualidade operacional

- Auditoria, métricas, alertas e documentação de suporte.
- Testes de segurança, acessibilidade e responsividade.
- Homologação editorial e clínica antes do rollout.

## Testes futuros

- Autorização negativa para usuários fora da equipe editorial.
- CRUD de rascunho e validação dos campos.
- Concorrência e conflito de versão.
- Transições válidas e inválidas do fluxo editorial.
- Impedimento de publicação sem revisão ou fontes obrigatórias.
- Sanitização de Markdown, links e imagens.
- Histórico imutável e restauração como nova versão.
- Arquivamento removendo o conteúdo da API pública.
- Compatibilidade de conteúdo legado sem corpo.
- Acessibilidade por teclado, leitor de tela e contraste.
- Responsividade em desktop, tablet e celular.

## Definition of Ready

- Formato do corpo do artigo aprovado.
- Responsáveis editoriais e clínicos definidos.
- Política de fontes e revisão documentada.
- Papéis e permissões aprovados.
- Wireframes do painel e da leitura completa validados.
- Decisão sobre hospedagem e domínio administrativo tomada.

## Definition of Done

- Editores operam todo o fluxo sem acesso ao banco ou terminal.
- Nenhum conteúdo é publicado sem autorização e auditoria.
- O app recebe artigo completo, fontes e versão publicada.
- Rascunhos e revisões nunca vazam na API pública.
- Testes de segurança, contrato, interface e acessibilidade estão verdes.
- Runbook de publicação, correção e retirada urgente está disponível.

## Dependências

- CMS existente da `omah-api`.
- Autenticação administrativa e configuração de `ADMIN_USER_IDS` ou
  `ADMIN_EMAILS`.
- Definição editorial e revisão clínica.
- Evolução do Hub de dicas no `omah_app` para corpo completo.

