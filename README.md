# Momiz Web

Landing page institucional do Momiz, preparada para deploy na Vercel em
`momiz.com.br`.

## Desenvolvimento

```bash
cp .env.example .env.local
npm install
npm run dev
```

As variáveis `NEXT_PUBLIC_APP_STORE_URL` e `NEXT_PUBLIC_GOOGLE_PLAY_URL` ativam
os botões das lojas. Sem elas, os botões exibem “Em breve”.

## Deploy na Vercel

1. Importe este repositório na Vercel ou execute `vercel link`.
2. Cadastre as variáveis do `.env.example` nos ambientes desejados.
3. Adicione `momiz.com.br` e `www.momiz.com.br` em **Settings > Domains**.
4. Na Hostinger, remova os apontamentos web antigos e configure:
   - `A` — nome `@` — valor `76.76.21.21`
   - `A` — nome `www` — valor `76.76.21.21`
5. Configure `www.momiz.com.br` para redirecionar ao domínio principal.

Não altere os nameservers da Hostinger se o e-mail ou outros serviços usam a
zona DNS atual. Esses valores foram confirmados com `vercel domains inspect` em
2 de outubro de 2026; confirme novamente no painel se a configuração for aplicada
em outra data.

Os arquivos de App Links ficam em `public/.well-known`. Antes de publicar o app
Android na Play Store, acrescente ao `assetlinks.json` o SHA-256 do certificado
**App signing** exibido no Play Console; ele normalmente difere da chave de upload.
