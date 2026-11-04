# Fatia acessível da revisão profissional — INT-10/INT-11

- Status: fatia local concluída em 2026-11-04; WEB-005/009/011 permanecem parciais.
- Objetivo: reduzir o acoplamento do painel de revisão profissional e estabelecer primitives acessíveis reutilizáveis sem alterar API/BFF.
- Extração: `PilotReadinessPanel` concentra apresentação, formulários e histórico da prontidão; `ProfessionalCareReviewPanel` preserva fetching, sessão, seleção, exportação e mutações.
- Redução objetiva: o painel principal passou de 818 para 717 linhas. Denúncias, credenciais e outros módulos não foram movidos nesta fatia.
- Primitives: `FeedbackState` cobre loading, empty, error, denied e success com live regions adequadas; `FormField` associa label, ajuda e erro persistente com `aria-describedby`/`aria-invalid`.
- Teclado/foco: controles permanecem HTML nativos; botões declaram `type=button`; histórico usa `details/summary`; keys estáveis e montagem contínua preservam foco durante save; `aria-busy` comunica a operação.
- Responsividade: CSS/tokens existentes foram reutilizados; o grid de gates mantém o breakpoint existente de uma coluna em viewport móvel.
- Testes: renderização semântica valida loading/success/error/denied, live regions, ação persistente, label, descrição e erro associados.
- Verificações aprovadas: `npm run lint`, `npm run typecheck`, `npm test` (66/66), `npm run build` e `git diff --check`.
- Limitação: Chromium não está instalado localmente e o painel exige sessão admin; E2E autenticado, axe, Safari/iPad/Android, zoom e leitores de tela permanecem pendentes.
- Contratos: nenhuma rota, payload, sessão, API ou BFF foi alterado.
- Próximo passo: validar a fatia em Preview autenticado e extrair denúncias ou credenciais em pacote separado.
