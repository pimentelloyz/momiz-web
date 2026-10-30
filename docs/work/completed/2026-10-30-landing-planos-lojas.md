# Landing: planos, próximos recursos e lojas

- Data: 2026-10-30
- Responsável: `/root/landing_plans_stores_web_impl`
- Status: concluído

## Resultado

- A landing ganhou uma seção responsiva de planos FREE, STANDARD e PRO, alimentada pelo catálogo canônico da API e protegida por fallback mínimo versionado.
- Standard deixa explícito que amplia o chá atual e mantém 1 chá ativo; Pro comunica até 10 chás ativos.
- A navegação passou a incluir o atalho Planos.
- A seção “Em breve” separa gestão de profissionais/equipe de cuidado e festas de aniversário com álbuns e comunidade privada de mães e famílias.
- Google Play aponta por padrão para `com.lifeados.momiz.app`.
- App Store aceita somente URL oficial ou ID numérico válido; o ambiente Production usa o ID oficial `6818518953`.

## Verificações

- `npm test`: 49 testes aprovados.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado.
- `npm run build`: aprovado; landing revalida catálogo a cada 15 minutos.
- `git diff --check`: aprovado.

## Dependência

- A API deve disponibilizar anonimamente somente `GET /api/billing/plans`.
- Manter `NEXT_PUBLIC_APP_STORE_APP_ID=6818518953` no ambiente Production da Vercel.
