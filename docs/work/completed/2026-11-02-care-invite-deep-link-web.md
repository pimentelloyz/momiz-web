# Deep link de convite profissional — Web

- Status: concluído
- Objetivo: eliminar o `404` de `/care/invite/:token` e associar esse caminho ao app no iOS.
- Arquivos alterados: rota de fallback em `app/care/invite/[token]/page.tsx`, helper em `lib/deep-links.ts`, associação em `public/.well-known/apple-app-site-association` e teste focado em `test/deep-links.test.ts`.
- Entrega: página no layout Momiz com CTA para abrir o convite no app e links oficiais de download para iPhone e Android.
- Privacidade: a página não consulta dados clínicos; usa metadados estáticos com `noindex`, `nofollow` e `nocache`, sem incluir o token em metadata ou logs.
- Verificações: teste focado (suíte com 55 testes aprovados), `npm run typecheck`, `npm run build` e `git diff --check`.
- Dependências: o App deve tratar o Universal Link e o deep link `momiz://care/invite/:token`.
