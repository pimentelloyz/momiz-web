# Consumo incremental do OpenAPI

A Web fixa o pacote publicado pela API no diretório
`contracts/openapi/momiz-openapi-<sha>`. O pacote deve conter `openapi.yaml` e
`manifest.json`; nome, SHA de origem e SHA-256 do contrato precisam concordar.

Nesta primeira fatia, somente `GET /care/professional/terms` é gerado. Para
atualizar, baixe o artifact `momiz-openapi-<sha>` do workflow da API, substitua
o diretório versionado, atualize o caminho explícito nos scripts npm e execute:

```bash
npm run openapi:generate
npm run openapi:check
```

`lib/generated/professional-terms-contract.ts` é determinístico e não deve ser
editado manualmente. O check da CI recalcula o checksum do YAML e compara os
bytes gerados, falhando se o artifact ou a saída estiverem stale.

A comparação com o manifest legal Web é fail-closed: payload inválido e
divergência de versão/URL são estados distintos. A aprovação jurídica e a
decisão sobre qual versão deve vigorar continuam fora deste mecanismo técnico.
O BFF público `/api/legal/professional-terms` usa o path e o parser gerados,
responde apenas quando API e manifest Web coincidem e não replica o payload de
erro do upstream.
