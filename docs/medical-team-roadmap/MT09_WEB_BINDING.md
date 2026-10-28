# MT-09 — binding web de planos e quotas

Este binding aplica o [contrato técnico central MT-09](../../../omah-api/docs/medical-team-roadmap/MT09_TECHNICAL_CONTRACT.md) ao perfil profissional.

## Superfície e flags

- `NEXT_PUBLIC_ENABLE_MT09_ENTITLEMENTS=false`: estado read-only do plano, catálogo, uso e limites.
- `NEXT_PUBLIC_ENABLE_MT09_CHAT_SPONSORSHIP=false`: decisão OR minimizada do chat no vínculo atual.
- BFF account usa `X-Momiz-Profile-Id`; chat usa relationship autorizado. Entitlement pertence a `CareProfile`, nunca à conta inteira.
- Restore, checkout, receipt, provider, admin/catalog mutation e cobrança ficam fora desta entrega.

## Regras de apresentação

Tiers `FREE|STANDARD|PRO`, status, limites, uso, remaining, grace e razões vêm integralmente da API/catalog version. O cliente não hardcode limites nem ativa plano. Preço só é exibido se devolvido pela API e sempre como **referência não cobrável**; não há botão de compra ou checkout inexistente.

Chat é permitido se o guard server-side retornar `allowed`, inclusive quando outro participante patrocina o relationship. A UI não exige dois planos e não revela o sponsor ID. Downgrade, `GRACE`, `EXPIRED` ou `REVOKED` podem bloquear novas criações/sends, mas nunca escondem leitura, histórico, receipts, export/delete owner ou segurança MT-07.

## Segurança e rollout

Perfil A e B usam caches/headers distintos; mismatch/IDOR falha fechado. Paywall é informativo e nunca substitui o guard transacional. Habilitação depende de OpenAPI, catálogo ativo, provider truth, migrations, quota reservation concorrente, testes A/B/downgrade/sponsorship e rollback central.
