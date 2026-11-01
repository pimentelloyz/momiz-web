# Catálogo de funcionalidades implementadas — Web

- Data: 2026-10-30
- Identificador: `catalogo-funcionalidades-implementadas-web`
- Responsável: `/root/web`

## Resultado

Foi criado `docs/features/README.md` como índice operacional e documentos específicos para:

- site público e conteúdo institucional;
- convites públicos e deep links;
- identidade, sessões e proxies BFF;
- administração de usuários e acessos;
- planos e capabilities;
- portal profissional e operação de saúde;
- analytics de cuidado.

Os documentos registram somente funcionalidades comprovadas no código, contratos realmente consumidos, perfis, flags, estados, limitações, evidências e formas de validação. Cards promocionais “Em breve” foram explicitamente excluídos do conjunto entregue.

## Verificações

- caminhos citados: validados no repositório;
- `npm test`: 49 testes aprovados;
- `npm run lint`: aprovado;
- `npm run build`: aprovado, incluindo TypeScript e geração de 17 páginas;
- `git diff --check`: aprovado.

O runner emitiu apenas o aviso preexistente `MODULE_TYPELESS_PACKAGE_JSON` durante os testes; não houve falha.

## Alterações externas

Nenhuma. Não houve commit, push, deploy, migration ou alteração em API/app.

