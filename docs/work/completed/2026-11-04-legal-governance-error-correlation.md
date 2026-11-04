# Governança legal, recuperação e correlação — INT-12/INT-13

- Status: implementação local concluída em 2026-11-04; WEB-004/010 permanecem parciais pelas dependências externas.
- Governança legal: constante única para ID, versão 1.0, data ISO, canonical, arquivo permanente e status `PENDING_LEGAL_REVIEW`; manifest público em `/legal/manifest.json`; arquivo auditável em `/legal/health-professional-terms/1.0`; página mostra versão e link permanente.
- Conteúdo jurídico: nenhuma cláusula ou redação material foi alterada. O status pendente evita inferir aprovação inexistente.
- Error boundaries: admin e profissional possuem `error.tsx` e `loading.tsx`; erros inesperados oferecem retry/suporte e nunca exibem message, stack, digest ou payload.
- Correlação: helper allowlista IDs opacos; BFFs tocados de sessão, access, care, contexto e pacientes encaminham/devolvem `x-request-id` seguro, preferindo o ID upstream. Headers internos e conteúdo do corpo não são copiados.
- UI segura: o identificador só aparece quando válido e pode ser copiado; e-mails, espaços e control characters são rejeitados.
- Testes: manifest/constante/histórico, canonical/archive, status jurídico pendente, allowlist, rejeição de PII/controles e ausência de payload sensível em headers.
- Verificações aprovadas: `npm run lint`, `npm run typecheck`, `npm test` (69/69), `npm run build`, smoke HTTP local do manifest/arquivo e `git diff --check`.
- Limitação: Chromium continua indisponível localmente; boundaries e cópia do request ID exigem E2E autenticado em Preview.
- Pendências externas: revisão/owner jurídico; publicação imutável; API/App adotarem versão/manifest; aceite persistido; correlação real com API; observabilidade, SLOs, dashboards, alertas e owner operacional.
- Ações não realizadas: deploy, alteração de API/App, segredo, log de PII/sessão, commit ou push.
