# Site público e conteúdo institucional

**Estado:** `IMPLEMENTED`, com links de loja em `EXTERNAL_VALIDATION_REQUIRED`.

## Escopo entregue

- landing page responsiva com apresentação do produto, benefícios, jornada, presentes e CTA de download;
- seção de planos alimentada pelo catálogo público da API;
- páginas de termos, privacidade, suporte e exclusão de conta;
- metadados, sitemap e robots;
- links oficiais para App Store e Google Play, com estado visual “Em breve” quando não houver URL válida.

Os cards de equipe de cuidado, aniversários, álbuns e comunidade em `app/page.tsx` são anúncios “Em breve”; não representam funcionalidades públicas disponíveis na web.

## Rotas e contratos consumidos

- `GET /api/billing/plans`: carregado no servidor por `lib/access-plan-catalog.ts`; a landing aplica fallback local quando o catálogo remoto falha ou é inválido.
- URLs de lojas são resolvidas por `lib/store-links.ts` a partir das variáveis públicas e fallbacks oficiais.

## Configuração e estados

- `NEXT_PUBLIC_APP_STORE_URL` ou `NEXT_PUBLIC_APP_STORE_APP_ID`: define o destino iOS.
- `NEXT_PUBLIC_GOOGLE_PLAY_URL`: define o destino Android.
- ausência ou URL fora dos hosts esperados: botão desabilitado, sem navegação externa.
- a publicação/aprovação das lojas não é validada por este projeto (`EXTERNAL_VALIDATION_REQUIRED`).

## Evidências

- `app/page.tsx`
- `app/site-chrome.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/termos/page.tsx`
- `app/privacidade/page.tsx`
- `app/suporte/page.tsx`
- `app/excluir-conta/page.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `lib/access-plan-catalog.ts`
- `lib/store-links.ts`

## Testes e validação

- `test/access-plan-catalog.test.ts`
- `test/store-links.test.ts`
- `npm test -- --test-name-pattern='plan|store'`
- `npm run build`

