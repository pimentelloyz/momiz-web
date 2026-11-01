# Portal profissional e operação de saúde

**Estado:** `PARTIAL` e `FLAGGED`.

O portal possui implementação ampla, mas os módulos MT-01 a MT-09 são liberados individualmente. Sem MT-01, permanece disponível o dashboard profissional legado com perfil, pacientes, agenda, exportação ICS e equipes de clínica.

## Módulos e flags

| Módulo | Flag | Entrega |
| --- | --- | --- |
| Contextos de cuidado | `NEXT_PUBLIC_ENABLE_MT01_CARE_CONTEXTS` | bootstrap, seleção e troca de perfil/gestação, resumo contextual |
| Vínculos e consentimento | `NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS` | convites, aceite/recusa/cancelamento e encerramento de vínculo |
| Leitura de pacientes | `NEXT_PUBLIC_ENABLE_MT03_PROFESSIONAL_PATIENTS` | lista paginada e cache efêmero por sessão |
| Documentos compartilhados | `NEXT_PUBLIC_ENABLE_MT04_DOCUMENT_SHARES` | lista, download temporário, revisão e comentários |
| Agenda contextual | `NEXT_PUBLIC_ENABLE_MT05_APPOINTMENTS` | lista, criação/alteração de estado, histórico e exportação ICS |
| Chat de cuidado | `NEXT_PUBLIC_ENABLE_MT06_CARE_CHAT` | mensagens, paginação, recibo de leitura e retry idempotente |
| Eventos de trabalho de parto | `NEXT_PUBLIC_ENABLE_MT07_LABOR_EVENTS` | timeline somente leitura com texto de segurança |
| Notificações | `NEXT_PUBLIC_ENABLE_MT08_NOTIFICATIONS` | feed paginado e marcação de abertura |
| Preferências | `NEXT_PUBLIC_ENABLE_MT08_NOTIFICATION_PREFERENCES` | matriz de categoria/canal com versionamento |
| Entitlements | `NEXT_PUBLIC_ENABLE_MT09_ENTITLEMENTS` | resumo do plano profissional |
| Patrocínio de chat | `NEXT_PUBLIC_ENABLE_MT09_CHAT_SPONSORSHIP` | validação do direito de mensagem por vínculo |

Flag ausente ou diferente de `true` deixa o módulo correspondente `DISABLED`.

## Operação implementada

- cadastro profissional precisa existir e MFA pode ser exigido;
- dashboard legado: perfil, pacientes, agenda, exportação de calendário e clínicas;
- clínicas: criar clínica, aceitar convite, listar membros, convidar, cancelar convite, suspender/reativar e transferir propriedade;
- portal contextual: módulos da tabela acima, com erros canônicos e `requestId`;
- ações mutáveis usam chaves de idempotência quando o contrato exige;
- dados clínicos permanecem no backend; a web evita inferências e exibe avisos não emergenciais.

## Contratos realmente consumidos

Principais rotas diretas da API por meio do BFF:

- `GET /api/care/professional/profile`, `/patients`, `/agenda`, `/agenda/export.ics`;
- `/api/care/professional/clinics` e sub-recursos de membros/convites;
- `GET /api/account/care-profiles`, `POST /api/account/care-context/resolve`;
- `/api/care/v2/pregnancies/{pregnancyId}/summary`, `relationships`, `documents`, `appointments`, `labor-events`;
- `/api/care/v2/relationships/{relationshipId}/messages` e `read-receipts`;
- `/api/account/notifications`, `/notification-preferences`, `/care-entitlements`;
- `/api/care/v2/relationships/{relationshipId}/message-entitlement`.

Os métodos e sub-recursos exatos são delimitados pelas policies em `lib/professional/` e pelos painéis que fazem as chamadas.

## Administração de saúde

No painel administrativo estão implementados:

- revisão, correção, rejeição, suspensão e renovação de perfis profissionais;
- acesso temporário a comprovantes de credencial;
- métricas operacionais;
- gates auditáveis de prontidão do piloto e exportação CSV;
- denúncias de comunicação e resolução com justificativa.

Rotas consumidas: `/api/admin/care/profiles`, `/review`, `/credentials/.../download-url`, `/metrics`, `/pilot-readiness`, `/communication-reports`.

## Limitações e validação externa

- cada módulo depende de flag e dos scopes/autorização retornados pela API;
- prontidão do piloto é registro administrativo, não ativa rollout automaticamente;
- validação clínica, jurídica, de privacidade, pentest, MFA e simulação de incidente são `EXTERNAL_VALIDATION_REQUIRED`;
- eventos de trabalho de parto não são diagnóstico, atendimento nem confirmação de leitura profissional;
- não há telemedicina ou decisão clínica automatizada implementada.

## Evidências

- `app/profissional/page.tsx`
- `app/profissional/ui/mt01-professional-portal.tsx`
- `app/profissional/ui/professional-dashboard.tsx`
- `app/profissional/ui/professional-appointments-panel.tsx`
- `app/profissional/ui/professional-documents-panel.tsx`
- `app/profissional/ui/professional-chat-panel.tsx`
- `app/profissional/ui/professional-notifications-panel.tsx`
- `app/profissional/ui/professional-labor-events-panel.tsx`
- `app/profissional/ui/clinic-team-panel.tsx`
- `app/admin/ui/professional-care-review-panel.tsx`
- `lib/professional/`

## Testes e validação

- `test/professional-portal.test.ts`
- `npm test -- --test-name-pattern='professional'`
- validar cada combinação de flag, perfil autorizado/negado, expiração, paginação, idempotência e exportação em ambiente integrado.

