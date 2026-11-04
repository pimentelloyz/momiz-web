# Operação da Web Momiz

Este índice é o ponto de entrada para operar a Web. Os owners abaixo são
**papéis propostos**, não pessoas nomeadas; a liderança ainda precisa confirmar
escala, substitutos e canais.

## Matriz RACI proposta

| Superfície | Responsável (R) | Accountable (A) | Consultados (C) | Informados (I) |
| --- | --- | --- | --- | --- |
| Login admin/profissional | Plantão Web | Coordenação de release | Plantão API e responsável Firebase | Suporte |
| Deploy e rollback Web | Coordenação de release | Responsável técnico Web | Plantão Web e segurança | Produto e suporte |
| Termos e versão publicada | Responsável jurídico/produto | Responsável jurídico | Plantões Web/API | Suporte |
| Deep links e manifests | Plantão Web | Responsável técnico Web | Responsável Mobile | Suporte |
| Incidente com possível dado pessoal | Plantão Web | Segurança/privacidade | Plantão API e jurídico | Liderança de incidente |

Confirmação organizacional necessária: nomes, escala 24x7 ou horário comercial,
canal primário, substituto e autoridade para promoção/rollback.

## Metas propostas, não aprovadas

Estas metas são hipóteses operacionais até aprovação e instrumentação. Não são
SLA contratual.

| Indicador | Proposta | Janela/medição | Status |
| --- | --- | --- | --- |
| SLO homepage, termos e manifests | 99,9% de respostas válidas | 30 dias, probe externo | Proposto; sem monitor aprovado |
| SLO login configurado | 99,5% sem estado indisponível | 30 dias, smoke sintético | Proposto; conta sintética pendente |
| Ack P1/P2 | 15 min / 30 min | da detecção ao aceite humano | Proposto; escala pendente |
| RTO login/release P1 | 60 min | da declaração à restauração validada | Proposto; game day real pendente |
| RTO termos/deep links | 4 h | da declaração à restauração validada | Proposto |
| RPO código/config Web | último deployment validado, alvo ≤ 24 h | SHA e artifact do gate | Proposto |
| RPO dados clínicos | não se aplica à Web | Web não é sistema de registro | Confirmar com API/privacidade |

## Fluxo de resposta

1. Abra [resposta a incidentes](incident-response.md) e classifique o impacto.
2. Use o runbook específico de [login](login.md),
   [termos/deep links](legal-and-deep-links.md) ou
   [release/rollback](release-gate.md).
3. Registre detecção, ack, início da mitigação e restauração em UTC, além de SHA,
   URL e somente `requestId` validado. Nunca registre sessão, token, e-mail,
   payload clínico ou secret.
4. Para ensaio local, siga o [game day](game-day.md).

