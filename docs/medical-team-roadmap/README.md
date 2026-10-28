# Gestão de equipe médica — materialização web

Este diretório traduz o roadmap central para as superfícies web do Momiz. Ele não substitui os contratos da API nem autoriza desenvolvimento.

## Fontes e precedência

Leia, nesta ordem:

1. [Roadmap de produto](../../../omah-api/docs/medical-team-roadmap/MOMIZ_MEDICAL_TEAM_ROADMAP.md).
2. [Análise central de lacunas](../../../omah-api/docs/medical-team-roadmap/MOMIZ_GAP_ANALYSIS.md).
3. [Especificações F01–F13](../../../omah-api/docs/medical-team-roadmap/FEATURE_SPECIFICATIONS.md).
4. [Contratos lógicos](../../../omah-api/docs/medical-team-roadmap/LOGICAL_CONTRACTS.md).
5. [Rastreabilidade MT-01–MT-10](../../../omah-api/docs/medical-team-roadmap/TRACEABILITY_AND_DELIVERY.md).
6. [Contrato técnico central MT-01](../../../omah-api/docs/medical-team-roadmap/MT01_TECHNICAL_CONTRACT.md).
7. [Especificações das superfícies web](WEB_FEATURE_SPECIFICATIONS.md).
8. [Rastreabilidade web](WEB_TRACEABILITY.md).
9. [Binding web MT-01](MT01_WEB_CONTRACT.md), obrigatório antes de implementar contexto no cliente.

Código existente e contratos OpenAPI publicados são fatos do sistema atual. O roadmap descreve intenção; uma rota permitida no proxy, um tipo local, um mock ou este documento não provam implementação.

## Superfícies

- **Admin `/admin`**: verificação profissional, políticas de acesso, demos, gates do piloto, denúncias e analytics. Não deve receber acesso clínico irrestrito.
- **Portal profissional `/profissional`**: autenticação profissional, bloqueio por verificação, pacientes e agenda somente leitura e gestão de clínicas. É uma base parcial, não o painel completo do roadmap.
- **Pública**: somente jornadas minimizadas que forem explicitamente aprovadas, como resolução segura de convite. Não há hoje UI pública de equipe médica.
- **App Flutter**: continua responsável pelas jornadas da gestante/acompanhante e pelos fluxos local-first. Dependências são registradas aqui, não implementadas no web.

## Regra obrigatória antes de implementar

Nenhuma F01–F13 pode virar código web antes de:

1. selecionar o pacote MT correspondente;
2. resolver suas decisões bloqueantes com os donos indicados;
3. publicar/atualizar primeiro o contrato central e o OpenAPI da API;
4. fechar matriz de autorização, estados, erros canônicos e `requestId`;
5. definir testes negativos, concorrência, idempotência e isolamento entre pacientes;
6. registrar o pacote em `docs/work/ACTIVE.md`, com rollout e rollback.

DTO, enum ou endpoint não deve ser inventado no cliente. Ampliações do proxy só acompanham contrato publicado e não contam como UI pronta.

## Estados de classificação

- `confirmado`: fluxo executável com evidência no código.
- `parcial`: existe base útil, mas falta parte relevante da jornada ou garantia.
- `não encontrado`: busca dirigida não localizou implementação.
- `incerto`: depende de contrato, ambiente ou validação externa ainda não comprovada.

## Estado atual

As treze features estão especificadas para web, mas continuam sujeitas aos gates centrais. O primeiro pacote técnico permanece MT-01; MT-10 é transversal e encerra o piloto somente após evidências clínicas, jurídicas, de segurança e operação.
