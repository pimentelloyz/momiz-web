# Funcionalidades implementadas — Momiz Web

Este diretório é o catálogo operacional do que existe no repositório `momiz-web`. Ele serve como ponto de partida para correções e evoluções: cada documento delimita perfis, estados, contratos consumidos, flags, limitações e evidências de código.

## Estados

- `IMPLEMENTED`: fluxo disponível no código sem depender de flag funcional.
- `PARTIAL`: parte utilizável, mas existe uma limitação explícita no próprio fluxo.
- `FLAGGED`: implementado e condicionado a variável de ambiente.
- `DISABLED`: código preservado, porém desligado por configuração.
- `EXTERNAL_VALIDATION_REQUIRED`: exige aprovação, credencial, dado ou validação fora deste repositório.

O estado descreve o código da web, não garante configuração em um ambiente específico.

## Mapa funcional

| Domínio | Estado | Perfis | Documento |
| --- | --- | --- | --- |
| Landing, conteúdo institucional, páginas legais e links das lojas | `IMPLEMENTED` / `EXTERNAL_VALIDATION_REQUIRED` | público | [public-site-and-content.md](public-site-and-content.md) |
| Convites públicos, detalhes públicos e deep links | `IMPLEMENTED` | convidado e público | [public-invitations.md](public-invitations.md) |
| Login, sessão e proxies BFF | `IMPLEMENTED` | administrador e profissional | [identity-session-and-proxies.md](identity-session-and-proxies.md) |
| Administração de usuários e acessos temporários | `IMPLEMENTED` | administrador | [access-administration.md](access-administration.md) |
| Catálogo público e matriz de planos/capabilities | `IMPLEMENTED` | público e administrador | [plans-and-capabilities.md](plans-and-capabilities.md) |
| Portal profissional e operação de saúde | `PARTIAL` / `FLAGGED` | profissional e administrador | [professional-care.md](professional-care.md) |
| Analytics de cuidado | `IMPLEMENTED` | administrador | [care-analytics.md](care-analytics.md) |

## Regras de manutenção

1. Atualize o documento do domínio junto com a mudança funcional.
2. Registre somente rotas efetivamente chamadas pela interface ou pelo BFF; uma entrada em allowlist não prova uso.
3. Não classifique texto promocional ou cards “Em breve” como funcionalidade entregue.
4. Não copie tokens, chaves, nomes, e-mails, documentos clínicos ou dados de usuários para estas páginas.
5. A API continua sendo autoridade para autenticação, autorização, capabilities, limites e estados clínicos.

## Verificação geral

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

