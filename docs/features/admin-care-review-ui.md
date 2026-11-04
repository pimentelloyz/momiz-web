# UI administrativa de revisão profissional

## Fatia extraída

`ProfessionalCareReviewPanel` continua responsável por orquestrar consultas,
seleção, mutações e mensagens do domínio de professional care. A seção de
prontidão do piloto foi extraída para `PilotReadinessPanel`, que recebe dados,
rascunhos e callbacks tipados e não conhece API, sessão ou navegação.

Responsabilidades:

- `professional-care-review-panel.tsx`: fetching, sessão, seleção, adapters de
  payload, exportação e comandos de mutação;
- `pilot-readiness-panel.tsx`: apresentação dos gates, edição acessível,
  histórico e estados loading/empty/success;
- `admin-primitives.ts`: `FeedbackState` e `FormField`, sem regra de negócio;
- `admin.module.css`: tokens e estilos existentes, com layout de uma coluna no
  breakpoint móvel já usado pelo painel.

O painel principal passou de 818 para 717 linhas. A extração é incremental: os
blocos de denúncias e credenciais permanecem no componente original para evitar
refactor massivo e concorrência de mudanças.

## Contrato de acessibilidade

- feedback loading/empty/success usa `role=status` e região live educada;
- feedback error/denied usa `role=alert` e live assertiva, sem desaparecer como
  toast;
- `FormField` associa label, ajuda e erro persistente por `htmlFor` e
  `aria-describedby`, adicionando `aria-invalid` quando necessário;
- botões não submetem formulários implicitamente (`type=button`);
- `select`, `textarea`, `input` e `details/summary` preservam comportamento
  nativo de teclado;
- o componente permanece montado e mantém keys estáveis durante salvamento;
  `aria-busy` comunica a operação sem mover foco automaticamente;
- erros de justificativa/evidência bloqueiam a ação e permanecem junto ao campo.

Dialogs e bottom sheets não foram introduzidos: a fatia não exige sobreposição,
e os estados persistentes são mais adequados à revisão administrativa.

## Próximas fatias possíveis

Denúncias e detalhes de credenciais podem ser extraídos separadamente após E2E
autenticado. Qualquer dialog futuro deve definir foco inicial, retorno de foco,
Escape e contenção de tabulação antes de substituir conteúdo inline.
