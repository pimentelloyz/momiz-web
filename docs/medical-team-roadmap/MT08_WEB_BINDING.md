# MT-08 — binding web de notificações

Este binding aplica ao portal profissional o [contrato técnico central MT-08](../../../omah-api/docs/medical-team-roadmap/MT08_TECHNICAL_CONTRACT.md). A API permanece autoridade de perfil, preferência, autorização, TTL, stale, status e conteúdo genérico.

## Superfície e flags

- `NEXT_PUBLIC_ENABLE_MT08_NOTIFICATIONS=false`: habilita feed e abertura explícita.
- `NEXT_PUBLIC_ENABLE_MT08_NOTIFICATION_PREFERENCES=false`: habilita a matriz editável; pode permanecer desligada com o feed ativo.
- O dashboard legado e `/admin` não recebem essa superfície.
- MT-07, entitlement, provider, device token e conteúdo clínico permanecem fora.

## BFF profile-scoped

O browser acessa somente:

- `GET /profissional/api/notifications/{profileId}/feed`;
- `GET|PATCH /profissional/api/notifications/{profileId}/preferences`;
- `POST /profissional/api/notifications/{profileId}/feed/{notificationId}/opened`.

O BFF constrói `X-Momiz-Profile-Id`, usa sessão server-only, `private, no-store`, same-origin nas mutações e allowlists de query. O body de preferência não aceita profile ID. O feed não expõe `sourceResourceId`.

## Matriz e opt-out

A UI exige a matriz materializada de seis categorias (`INVITATION`, `RELATIONSHIP`, `APPOINTMENT`, `REMINDER`, `DOCUMENT`, `MESSAGE`) por dois canais (`IN_APP`, `PUSH`). Não cria defaults locais. Toggle é otimista, envia `expectedVersion` e `Idempotency-Key`, reverte em erro e recarrega em `CARE_NOTIFICATION_VERSION_CONFLICT`.

Desabilitar afeta novas entregas e não apaga o histórico já retornado. Nenhuma decisão comercial é aplicada.

## Feed, status e abertura

O feed usa cursor opaco, deduplica por `notificationId` e trata cursor inválido por reload seguro. Estados têm significado estritamente técnico:

- `QUEUED`: elegível/fila;
- `SENT`: adapter aceitou, sem prova de chegada ou leitura;
- `FAILED`: entrega esgotada;
- `OPENED`: interação autenticada explícita no botão “Abrir”;
- `CANCELED`: entrega impedida por preferência, TTL, revogação ou stale.

Receber push, carregar o feed ou navegar por outra área nunca chama `opened`.

## Deep links e contexto

Deep link é enum local allowlisted, nunca URL arbitrária. Após `opened`, a UI tenta focar uma superfície já montada e autorizada no contexto atual. Destino desconhecido, desabilitado ou pertencente a outro contexto permanece no feed e orienta selecionar o contexto adequado. IDs de recurso e paciente não entram na URL ou no estado do cliente.

## Segurança e aceite pré-código/rollout

- [x] flags web false por padrão;
- [x] sessão e header de perfil construídos no BFF;
- [x] feed/preferências separados por `sessionEpoch+profileId`;
- [x] payload minimizado e enum desconhecido fail-closed/fallback feed;
- [x] `SENT`/`OPENED` sem inferência clínica;
- [x] rollback otimista e `requestId` visível;
- [ ] OpenAPI/flags/migration MT-08 disponíveis na API;
- [ ] matriz A/B/IDOR, cursor, opt-out concorrente e stale aprovados;
- [ ] payload push inspecionado sem conteúdo clínico;
- [ ] rollout/rollback central ensaiado antes de habilitar as flags web.
