# Recuperação de erros e correlação Web

Admin e portal profissional possuem `error.tsx` e `loading.tsx` próprios. Erros
inesperados exibem mensagem segura, retry e suporte; `message`, stack, digest,
payload, sessão e dados pessoais não são renderizados ou registrados pelo código
da boundary.

Um `requestId` pode ser exibido e copiado apenas quando estiver em propriedade
explícita e passar a allowlist `A-Z`, `a-z`, números, ponto, sublinhado, dois
pontos e hífen, com até 128 caracteres. IDs com e-mail, espaços ou controles são
descartados.

Os BFFs administrativos/profissionais tocados encaminham somente esse header
allowlisted e devolvem preferencialmente o `x-request-id` seguro recebido da
API. Nenhum outro header interno é copiado automaticamente. A correlação não
inspeciona nem transforma o corpo, evitando que token, mensagem clínica ou PII
se torne metadata/log.

Observabilidade central, SLOs, dashboards e alertas permanecem pendentes. Um
fornecedor futuro deve ser aprovado pela privacidade e receber apenas eventos
minimizados.
