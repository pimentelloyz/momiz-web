# Termos de uso para profissionais de saúde

- Status: concluído em 2026-11-04.
- Objetivo: disponibilizar uma página pública, em pt-BR, com os termos aplicáveis ao uso do Momiz por profissionais de saúde.
- Escopo entregue: rota estática `/health-professional-terms`, metadados e URL canônica, conteúdo legal, versão e vigência próprias, navegação legal, footer e sitemap.
- Conteúdo coberto: cadastro e verificação profissional; autorização da paciente; sigilo e uso responsável; condutas proibidas; limites da plataforma; revogação e encerramento; segurança, registros e auditoria; alterações; legislação; contato.
- Reuso: a página utiliza o componente `LegalPage`; o componente passou a aceitar uma data de atualização opcional, preservando a data padrão das páginas existentes.
- Critérios validados: URL exata; conteúdo em pt-BR; estrutura semântica; layout responsivo existente; navegação por links; metadados; ausência de termos técnicos internos no texto público.
- Verificações executadas: `npm run lint`, `npm run typecheck`, `npm test` (55 testes), `npm run build` (rota gerada estaticamente) e `git diff --check`, todos aprovados.
- Dependências: o aplicativo deve apontar a WebView para `https://momiz.com.br/health-professional-terms`.
- Risco residual: o texto é uma proposta de produto e deve passar por revisão jurídica antes do deploy/publicação.
- Próximo passo: coordenador revisar o diff, obter a validação jurídica necessária e coordenar a URL com o aplicativo.
