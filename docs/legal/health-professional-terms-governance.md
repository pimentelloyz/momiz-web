# Governança técnica — termos para profissionais de saúde

## Identidade vigente

- documento: `health-professional-terms`;
- versão: `1.0`;
- vigência técnica: `2026-11-04`;
- URL canônica: `https://momiz.com.br/health-professional-terms`;
- arquivo permanente: `https://momiz.com.br/legal/health-professional-terms/1.0`;
- manifest: `https://momiz.com.br/legal/manifest.json`;
- aprovação: `PENDING_LEGAL_REVIEW`.

A fonte técnica é `lib/legal-documents.ts`. Página, metadata, arquivo e manifest
usam a mesma constante. O manifest permite que App/API comparem versão e URL
sem extrair texto do HTML; adoção nesses projetos continua uma dependência
externa.

## Histórico e mudança de versão

A versão 1.0 permanece acessível pela rota permanente. Para uma mudança futura:

1. não altere materialmente o snapshot publicado sem revisão jurídica;
2. crie nova versão e data efetiva na fonte técnica;
3. preserve a rota/conteúdo da versão anterior;
4. acrescente a versão ao histórico do manifest;
5. valide canonical, archive e manifest por teste;
6. coordene a mesma versão imutável com API/App;
7. registre owner, parecer e data de aprovação antes da publicação.

Este mecanismo não declara adequação jurídica e não substitui aceite versionado
na API. O status pendente é intencional e deve permanecer até existir evidência
de aprovação.
