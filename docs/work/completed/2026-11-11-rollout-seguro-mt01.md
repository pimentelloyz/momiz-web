# Rollout seguro do portal profissional MT-01

- Data: 2026-11-11
- Status: concluído localmente
- Objetivo: preservar clínicas, equipes e convites ao ativar MT-01 e rejeitar
  combinações inválidas das flags profissionais.

## Entrega

- A gestão de clínicas/equipes passou a compor também o portal contextual e
  permanece independente da existência ou do estado de um contexto gestacional.
- `clinicInvite` continua sendo lido pelo componente compartilhado nos modos
  legado e contextual, sem alteração dos endpoints existentes.
- A resolução das onze flags foi centralizada com valores booleanos estritos e
  dependências explícitas: MT-02–09 → MT-01, MT-04/MT-06 → MT-02,
  preferências → notificações e sponsorship → entitlements.
- Configuração inválida bloqueia a superfície profissional com alerta acessível
  que informa somente nomes de flags e dependências, sem reproduzir valores.
- Loading de clínicas recebeu `role=status`, `aria-busy` e heading associado.
- README, exemplo de ambiente e catálogo funcional documentam a matriz.

## Verificações

- `npm test -- --test-name-pattern='professional rollout|professional proxy|MT-0'`
  — 82 testes executados, 82 aprovados.
- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm run build` — aprovado com Next.js 16.4.3; 22 páginas estáticas geradas e
  `/profissional` mantida como rota dinâmica.
- `git diff --check` — aprovado.

### Revisão de integração

- A matriz foi alinhada ao app para exigir também MT-02 quando MT-04 estiver
  habilitado, pois leitura e colaboração de documentos dependem de um vínculo.
- O teste de dependências cobre explicitamente MT-04 → MT-02.
- Após o alinhamento: testes focados 82/82, typecheck, lint e diff-check aprovados.

## Dependências e próximo passo

- A API continua sendo autoridade de autorização e deve habilitar seus módulos
  correspondentes antes das flags web.
- Nenhuma flag remota foi ativada e nenhum deploy foi realizado.
- Antes do rollout remoto, validar uma conta com contexto, uma sem contexto e um
  link real de convite de clínica em Preview autenticado.
