# Game day Web

## Dry-run local sem mutação

O ensaio local valida runbooks, referências, artifact OpenAPI, manifests e
preflight de release usando somente `127.0.0.1`. Ele não abre navegador, não faz
login, não acessa rede e não altera Vercel/Firebase.

```bash
npm run operations:validate
npm run operations:game-day
```

O segundo comando grava `artifacts/runbook-game-day-report.json`, com SHA,
horários, duração e resultado de cada check, sem env ou segredo. Anexe esse
arquivo ao registro do exercício; `artifacts/` não é versionado.

## Ensaio autorizado futuro

1. Confirmar owners, janela, comunicação, deployment descartável e autoridade
   de rollback.
2. Registrar tempos de detecção, ack, decisão, início da mitigação e restauração.
3. Simular uma falha por vez (login configurado, termos, manifest ou release),
   sem dados reais.
4. Executar [gate e rollback](release-gate.md) no Preview autorizado.
5. Revisar RTO/RPO/SLO propostos em [ownership](README.md), anexar evidências e
   abrir ações com owner por papel e prazo.

INT-17/WEB-016 permanece parcial até esse exercício remoto controlado e um ack
humano real serem observados.

