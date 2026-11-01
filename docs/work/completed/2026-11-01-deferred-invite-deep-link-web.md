# Deep link diferido de convite — Web

- Status: concluído
- Objetivo: manter o convite HTTPS canônico e criar handoff first-party seguro para instalação.
- Entrega: CTA Universal Link, proxy server-side, referrer Android opaco, retomada iOS por gesto explícito e fallback que preserva a página pública.
- Privacidade: nenhum slug ou identificador de convidado é incluído nos parâmetros das lojas.
- Dependências: a API deve emitir o token opaco e o app deve consumi-lo no cold start/deferred deep link.
- Verificações: testes de helpers/URLs, lint, typecheck, build e diff check.
