<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Momiz Web — instruções para agentes

## Escopo

- Este repositório contém o painel web em Next.js.
- O agente web altera somente este repositório.
- Dependências de API ou app devem ser reportadas ao coordenador em `../omah-api`.

## Contexto inicial

1. Leia `docs/work/ACTIVE.md`.
2. Localize o código relacionado com `rg`.
3. Leia somente documentos específicos da feature; não varra toda a pasta de documentação.
4. Para uma mudança entre projetos, siga `../omah-api/docs/work/ORCHESTRATION.md`.

## Arquitetura e produto

- Preserve os padrões existentes de Next.js, React e TypeScript.
- A API é a autoridade para autenticação administrativa, autorização, planos e capacidades. Não duplique regras de negócio no cliente.
- Trate estados de carregamento, vazio, erro e sucesso de forma explícita.
- Mantenha acessibilidade, responsividade e navegação por teclado.
- Alterações em deep links e arquivos `.well-known` devem ser verificadas contra os identificadores reais dos apps.
- Preserve mudanças locais preexistentes.
- Não faça commit, push, deploy ou alterações externas sem solicitação explícita.

## Checkpoint

- Registre objetivo, aceite, verificações e próximo passo em `docs/work/ACTIVE.md`.
- Decisões duradouras vão para `docs/work/decisions.md`.
- Conclusões vão para `docs/work/completed/YYYY-MM-DD-identificador.md`.

## Verificação

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Execute apenas o conjunto proporcional à mudança, mas sempre faça `git diff --check`.
