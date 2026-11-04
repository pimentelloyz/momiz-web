# Adoção OpenAPI incremental — WEB-007

- Status: capability local concluída em 2026-11-04; WEB-007 permanece parcial porque os demais BFFs não foram migrados.
- Objetivo: consumir deterministicamente o contrato de `GET /care/professional/terms` sem introduzir SDK/dependência pesada.
- Artefato: snapshot explícito `momiz-openapi-cf9ca805c5c621b46af82898bd1d99fa1b1ae8ab`, contrato `1.0.0`, SHA-256 `0210e6b6141a74c974fb9103d344524e1b6741f2e3be47ac40ecd962752b6726`.
- Entregas: gerador mínimo; tipo/parser com header de origem; check de checksum, diretório, source SHA e stale output; gate na CI; BFF público fail-closed; testes de sucesso, erro, payload inválido e mismatch; guia de atualização do artifact.
- Segurança: nenhuma credencial é necessária; erro upstream não é replicado; resposta não validada ou divergente nunca é apresentada como vigente; cache e indexação do BFF são desativados.
- Divergência detectada: a constante atual da API usa `professional-terms-v1`, enquanto o manifest legal Web registra `1.0`. Nenhum lado foi alterado silenciosamente; o BFF responde mismatch até reconciliação aprovada.
- Verificações: `npm run openapi:generate`, `npm run openapi:check`, geração/check repetidos, testes focados, lint, typecheck, suíte completa, build e `git diff --check`.
- Ações não realizadas: alteração em API/App, migração ampla de DTOs/BFFs, dependência nova, deploy, commit ou push.
- Próximo passo: reconciliar a identificação técnica da versão com jurídico/produto e adotar uma segunda capability pequena usando o mesmo gate antes de extrair infraestrutura BFF comum.
