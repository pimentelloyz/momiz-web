# Resposta a incidentes Web

## Severidade e ack propostos

- **P1:** login indisponível para todos, release incorreta promovida, exposição
  suspeita de dados ou todas as rotas públicas críticas fora. Ack alvo proposto:
  15 minutos; escalar imediatamente ao accountable e segurança quando houver
  suspeita de dados.
- **P2:** uma superfície crítica ou grupo relevante afetado, com alternativa
  segura. Ack alvo proposto: 30 minutos.
- **P3:** degradação sem bloqueio. Ack alvo proposto: próximo horário útil.

Metas e canais aguardam aprovação; se não houver plantonista confirmado, acione
a coordenação de release e registre explicitamente a lacuna.

## Checklist de declaração, ack e escalonamento

- [ ] Registrar horário UTC de detecção e fonte do sinal.
- [ ] Nomear líder do incidente e responsável técnico por papel.
- [ ] Registrar impacto observável, URL, ambiente e SHA; não inferir causa.
- [ ] Coletar `x-request-id` ou `requestId` somente se contiver até 128 caracteres
  da allowlist `[A-Za-z0-9._:-]`. Descartar valores com e-mail, espaços ou
  caracteres de controle.
- [ ] Confirmar ack e horário; para P1 sem ack em 15 min, escalar ao accountable
  e substituto. Para P2 sem ack em 30 min, fazer o mesmo.
- [ ] Acionar segurança/privacidade antes de copiar qualquer evidência com
  possível dado pessoal. Não colar corpo de resposta, cookie, token ou sessão.
- [ ] Escolher mitigação reversível; rollback remoto exige autorização.
- [ ] Registrar início da mitigação, restauração, validação e encerramento UTC.

## Diagnóstico sem contexto

1. Confirme se o impacto é apenas Web, upstream API ou configuração.
2. Preserve o relatório do release gate e os IDs seguros; não repita login real.
3. Para autenticação, use [login](login.md). Para termos/manifests, use
   [termos e deep links](legal-and-deep-links.md). Para regressão de release,
   use [release e rollback](release-gate.md).
4. Se a causa continuar incerta, pare novas promoções e mantenha o incidente
   aberto; não altere Firebase/Vercel por tentativa.

## Registro mínimo de tempos

Use: `detectedAt`, `acknowledgedAt`, `mitigationStartedAt`, `restoredAt`,
`closedAt`, severidade, ambiente, SHA afetado/restaurado, papel autorizador e
resultado do gate. O relatório não deve conter PII nem credenciais.

