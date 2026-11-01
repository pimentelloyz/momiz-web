# Analytics de cuidado

**Estado:** `IMPLEMENTED`.

## Escopo entregue

- relatório administrativo por intervalo de datas;
- totais e agrupamentos agregados;
- supressão explícita de métricas quando a API considera a amostra insuficiente;
- exportação CSV local do relatório exibido;
- interface informa que nomes, e-mails, identificadores e conteúdo clínico não integram o relatório.

## Contrato consumido

- `GET /api/admin/care/analytics?from={iso}&to={iso}` por meio de `/admin/api/access/care/analytics`.

## Perfis e estados

- somente administrador autenticado e autorizado;
- carregando, relatório disponível, métrica suprimida, erro e sessão expirada;
- datas são convertidas para ISO antes da chamada.

## Limitações

- a web não calcula anonimização nem métricas; apresenta o resultado da API;
- exportação CSV ocorre no navegador e contém somente valores já retornados/agregados;
- não há tracking comportamental de marketing ou painel de produto implementado neste domínio.

## Evidências

- `app/admin/ui/care-analytics-panel.tsx`
- `app/admin/ui/admin-api-client.ts`
- `app/admin/api/access/[...path]/route.ts`

## Validação

- gerar relatório para período válido, verificar valores suprimidos e exportar CSV;
- testar sessão expirada e erro da API;
- `npm run lint && npm run typecheck`.

