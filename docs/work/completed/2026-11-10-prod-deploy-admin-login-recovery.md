# Deploy de produção da recuperação do login administrativo

- Data: 2026-11-10
- Status: concluído
- SHA publicado: `45d99ab`
- Produção: `https://momiz.com.br`

## Resultado

- Deployment Vercel: `dpl_EqQojfPEg9MvZWe7iNdkkkJXMCGu`.
- URL imutável: `https://momiz-q1i94ql0g-momiz.vercel.app`.
- Inspector:
  `https://vercel.com/momiz/momiz-web/EqQojfPEg9MvZWe7iNdkkkJXMCGu`.
- O estado de autenticação indisponível agora oferece “Sair e tentar
  novamente”, limpando sessão Firebase e cookie administrativo.

## Verificações

- lint, typecheck, 78 testes e build: aprovados;
- preflight de produção: aprovado;
- sete smokes remotos: aprovados, incluindo `/admin/login` e
  `/profissional/login`;
- `git diff --check`: aprovado.
