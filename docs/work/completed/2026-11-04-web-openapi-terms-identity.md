# Identidades dos termos profissionais — WEB-007/WEB-010

- Status: atualização contratual local concluída em 2026-11-04; WEB-007 e WEB-010 permanecem parciais pelos demais contratos e pela aprovação jurídica pendente.
- Objetivo: eliminar o mismatch artificial separando o ID técnico do aceite da versão editorial, sem tradução silenciosa.
- Artefato: `momiz-openapi-d91c5e6422617516458c00ee70a39c2babb72692`, contrato `1.0.0`, SHA-256 `6d2391ec25a20047d71e039c06f43bd2c6d67d519fbb159163b288fc6ba1153b`.
- Entregas: gerador ampliado para propriedades YAML inline/multiline, enum e depreciação; parser/tipos regenerados; manifest público com `acceptanceId` e `documentVersion`; BFF comparando ID técnico, versão editorial, path, URL e status jurídico; resposta sem alias depreciado.
- Compatibilidade: `version` é aceito somente como fallback de `acceptanceId` quando o campo novo está ausente. Se ambos existirem e divergirem, ou se `documentVersion` divergir, o resultado é mismatch fail-closed.
- Jurídico: `documentVersion` permanece `1.0` e `legalReviewStatus` permanece `PENDING_LEGAL_REVIEW`; nenhum texto ou aprovação foi alterado.
- Segurança: upstream inválido/erro continua redigido, respostas usam `no-store`/`noindex` e nenhum payload sensível é propagado.
- Verificações: geração/check do novo artifact, testes focados novo/legado/inválido/mismatch/upstream, lint, typecheck, suíte completa, build e `git diff --check`.
- Ações não realizadas: API/App, texto jurídico, deploy, commit, push ou edição manual do arquivo gerado.
- Próximo passo: migrar consumidores restantes para `acceptanceId` e remover o fallback legado somente em mudança contratual futura coordenada.
