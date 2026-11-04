# Headers defensivos e evolução da CSP

## Baseline local

Todas as respostas recebem:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY` e `frame-ancestors 'none'` em CSP Report-Only;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy` bloqueando câmera, microfone, geolocalização, pagamentos,
  USB e browsing topics;
- `Content-Security-Policy-Report-Only`.

Rotas `/admin/**`, `/profissional/**` e `/api/**` recebem adicionalmente
`Cache-Control: private, no-store, max-age=0`, `Pragma: no-cache`, expiração
imediata e `X-Robots-Tag: noindex, nofollow, noarchive`. Metadados `robots` dos
layouts continuam como segunda camada para páginas admin/profissionais.

## Inventário CSP

As origens externas foram limitadas ao fluxo já usado pelo cliente Firebase:

| Diretiva | Origem | Motivo |
| --- | --- | --- |
| `script-src` | `https://apis.google.com` | bootstrap do Google/Firebase Auth |
| `script-src` | `https://www.gstatic.com` | recursos distribuídos do SDK Google |
| `frame-src` | `https://accounts.google.com` | autenticação Google |
| `frame-src`, `connect-src` | `https://<FIREBASE_AUTH_DOMAIN>` | iframe/handler do projeto configurado |
| `connect-src` | `https://identitytoolkit.googleapis.com` | login Firebase |
| `connect-src` | `https://securetoken.googleapis.com` | renovação de token Firebase |
| `connect-src` | `https://firebaseinstallations.googleapis.com` | instalação do cliente Firebase |
| `connect-src` | `https://www.googleapis.com` | APIs auxiliares do fluxo Google |
| `img-src` | `https://lh3.googleusercontent.com` | avatar retornado por conta Google |

Não há `unsafe-eval`, origem `*`, nonce estático nem domínio genérico
`*.googleapis.com`. `unsafe-inline` permanece apenas em script/style enquanto o
Next atual emite bootstrap e estilos inline; por isso a política não está em
enforcement.

## Caminho para enforcement

1. Executar o release gate em Preview com login por Google, senha e TOTP.
2. Conectar um coletor de CSP aprovado, sem dados clínicos ou tokens, e adicionar
   `report-to`/`report-uri` somente após definir retenção e owner.
3. Observar violações em Preview e Production por uma janela acordada; revisar
   cada nova origem contra uma funcionalidade comprovada.
4. Remover dependência de `unsafe-inline` com suporte oficial de nonce/hash do
   framework; não introduzir nonce estático ou middleware improvisado.
5. Promover a mesma política para `Content-Security-Policy` primeiro em Preview,
   repetir os fluxos autenticados e executar rollback diante de regressão.
6. Somente então aplicar enforcement em Production e manter Report-Only como
   política mais restrita de evolução, se necessário.

## Cache clínico

O cache em `Map` do reader de pacientes foi removido. Cada leitura passa pelo
BFF com `cache: no-store` e consulta novamente a API, que permanece autoridade
de sessão, perfil e revogação. Isso evita retenção de dados clínicos no processo
serverless e elimina a possibilidade de uma instância devolver, por até 15
segundos, uma resposta anterior à revogação. Otimização futura exige medição,
threat model, invalidação entre instâncias e autorização explícita; ETag só pode
ser reintroduzido se uma resposta 304 nunca reutilizar conteúdo após revogação.
