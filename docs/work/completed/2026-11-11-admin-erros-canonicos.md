# Erros canônicos nas operações administrativas

- Data: 2026-11-11
- Status: concluído localmente
- Objetivo: preservar o envelope canônico e a correlação das falhas do admin sem
  copiar corpos arbitrários ou dados sensíveis para a interface.

## Entrega

- `AdminApiError` preserva `message`, `code`, `requestId` e status HTTP.
- O parser aceita envelopes canônicos superiores ou aninhados e usa o header
  `x-request-id` seguro como fallback de correlação.
- Payload inválido, arrays, campos com tipos inesperados, códigos fora da
  allowlist e request IDs inseguros são ignorados; o corpo bruto nunca integra
  a mensagem de erro.
- HTTP 401 continua encerrando a sessão por status tipado. 403, 429 e 5xx
  permanecem disponíveis aos consumidores para diagnóstico e feedback.
- Usuários/demos, políticas de acesso, perfis profissionais, credenciais,
  denúncias, gates, métricas e analytics exibem o `requestId` quando disponível.
- O carregamento inicial de usuários passou a usar o mesmo cliente canônico.

## Verificações

- `node --test test/admin-api-client.test.ts test/admin-primitives.test.ts` —
  6/6 testes aprovados.
- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm run build` — aprovado com Next.js 16.4.3.
- `git diff --check` — aprovado.

## Dívida remanescente

- O painel ainda usa uma faixa global para sucessos e erros; recuperação e retry
  localizados por seção continuam pendentes.
- `code` e status permanecem no erro tipado para lógica/telemetria futura, mas a
  UI mostra somente a mensagem canônica e o identificador de suporte.
- Não foi configurado fornecedor externo de observabilidade nem correlação em
  ambiente remoto.
