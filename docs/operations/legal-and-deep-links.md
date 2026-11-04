# Termos, links canônicos e deep links

## Termos

1. Verifique `/termos`, `/health-professional-terms`, o arquivo versionado em
   `/legal/health-professional-terms/1.0` e `/legal/manifest.json`.
2. Confirme título, versão, data, URL canônica e disponibilidade; não altere
   texto jurídico ou status de aprovação durante um incidente técnico.
3. O endpoint `/api/legal/professional-terms` responde somente quando versão/URL
   da API e manifest Web coincidem. `TERMS_VERSION_MISMATCH` requer jurídico,
   produto e API/Web; não aplique tradução silenciosa de versão.
4. Rollback restaura o SHA validado, mas uma versão jurídica já vigente exige
   decisão do responsável jurídico antes de reverter conteúdo.

## Deep links

1. Verifique `/.well-known/apple-app-site-association` e
   `/.well-known/assetlinks.json` no artifact/smoke do mesmo SHA.
2. Confirme content-type, JSON válido, IDs oficiais e rotas `/care/invite/*` e
   `/events/*`. Não use token real; use identificador sintético/opaque.
3. Separe falha de manifesto Web, associação/cache da plataforma e roteamento do
   App. Web é responsável pelo arquivo/HTTPS; Mobile é consultado para App.
4. Após rollback autorizado, repita smoke Web e validação em dispositivo de
   teste. Cache de Apple/Google pode atrasar a confirmação e deve ser registrado,
   não tratado como sucesso imediato.

Escalonamento e coleta segura seguem [resposta a incidentes](incident-response.md).

