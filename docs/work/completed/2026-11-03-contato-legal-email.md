# Correção do contato legal — Web

- Status: concluído
- Objetivo: corrigir para `momiz.app@gmail.com` o e-mail compartilhado pelas páginas legais e de suporte.
- Escopo: fallback de `siteConfig.supportEmail`, consumido por `/termos`, `/privacidade`, `/suporte` e `/excluir-conta`.
- Preservação: o override `SUPPORT_EMAIL` foi mantido para não substituir contatos de ambiente sem evidência; nenhum outro contato foi alterado.
- Metadata de loja: `docs/release/store-metadata.md` não existe neste repositório, portanto não houve atualização local.
- Verificações: busca focada confirmou a ausência do endereço antigo; o build sem `SUPPORT_EMAIL` gerou as quatro páginas com o texto e os links `mailto:` corretos; 55 testes, lint, typecheck, build e `git diff --check` aprovados.
