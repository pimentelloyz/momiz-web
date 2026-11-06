# Deploy de produção da web

- Data: 2026-11-06
- Status: concluído
- Responsável: `/root`
- Escopo: validação, publicação Vercel e smoke tests da aplicação web.
- Fora de escopo: publicação da API e dos aplicativos móveis.

## Resultado

- Produção: `https://momiz.com.br`.
- Deployment: `https://momiz-3n87d84fw-momiz.vercel.app`.
- Vercel deployment ID: `dpl_9R3JMFGdE3Wk3bqrzTSAQsMVzra5`.
- Inspector: `https://vercel.com/momiz/momiz-web/9R3JMFGdE3Wk3bqrzTSAQsMVzra5`.
- SHA publicado: `4e14d7ffcb43`.
- Nenhum aplicativo móvel foi gerado ou publicado.

## Verificações

- `release:preflight`: aprovado para produção e SHA esperado.
- Lint, typecheck, 78 testes e build: aprovados.
- Smoke remoto aprovado em `/`, `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json`, `/termos`, `/health-professional-terms`, `/admin/login` e `/profissional/login`.
- `git diff --check`: aprovado para os checkpoints.

## Configuração

As variáveis Firebase necessárias ao build foram registradas como secrets do ambiente Production da Vercel sem persistir seus valores no repositório.
