# MT-07 — binding web profissional

Este binding aplica o [contrato técnico central MT-07](../../../omah-api/docs/medical-team-roadmap/MT07_TECHNICAL_CONTRACT.md) somente à visão profissional autorizada.

## Superfície

- Flag web: `NEXT_PUBLIC_ENABLE_MT07_LABOR_EVENTS=false`.
- BFF permitido: `GET /api/care/v2/pregnancies/{pregnancyId}/labor-events` com contexto MT-01 e autorização server-side.
- Profissional não cria, corrige, sincroniza nem exporta eventos. Essas ações permanecem owner/app.
- Leitura exige relationship `ACTIVE`, pregnancy coerente e `labor.events.read`; o web não interpreta scopes localmente como autoridade.

## Dados e linguagem

A UI mostra timeline técnica allowlisted: tipo, horário, duração descritiva quando devolvida, versão e estado de sync. Não mostra contador/frequência agregada, fase, risco, diagnóstico, recomendação calculada, observação, cor ou odor. O aviso deixa explícito que registros e notificações não provam leitura, atendimento ou conduta clínica.

Notificações `LABOR` e deep link `LABOR_EVENTS` dependem de migration/catalog MT-08 e não são adicionadas pelo web antes disso. Nenhum payload clínico é gerado pelo cliente.

## Falha fechada e rollout

Enum/tipo/sync desconhecido bloqueia o item ou a superfície com `requestId`. Troca de contexto aborta requests e limpa memória. Produção continua bloqueada até revisão obstetra/jurídico, OpenAPI, migration, grants, testes A/B/IDOR e flags centrais.
