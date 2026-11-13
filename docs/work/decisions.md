# Decisões operacionais — Web

## D-WEB-001

A API é a fonte de verdade para autenticação, autorização, planos e capacidades; o painel apenas apresenta e opera esses contratos.

## D-WEB-002

O agente web não altera API ou app. Dependências são devolvidas ao coordenador com o contrato necessário.

## D-WEB-003

A landing apresenta planos a partir do catálogo público canônico da API, com snapshot mínimo versionado apenas para indisponibilidade. Recursos ainda não lançados são separados em “Em breve” e não aparecem como disponibilidade atual, mesmo quando sua capability já existir para desenvolvimento controlado.

Links de loja aceitam apenas hosts oficiais. O Google Play deriva do package `com.lifeados.momiz.app`; a App Store permanece indisponível até receber URL oficial ou ID numérico, pois o bundle `com.lifeados.momiz` não identifica uma página pública.

## D-WEB-004

As respostas de clínicas e equipes profissionais são contratos fechados e
validados antes de qualquer atualização de estado. Campos extras invalidam a
resposta para impedir que expansões de PII, foto ou metadata atravessem a
fronteira do painel. O token de convite só é aceito na resposta de criação e
permanece em memória apenas enquanto o link recém-gerado é exibido.

