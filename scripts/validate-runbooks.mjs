import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const required = {
  "docs/operations/README.md": ["Matriz RACI proposta", "Metas propostas, não aprovadas"],
  "docs/operations/incident-response.md": ["Checklist de declaração, ack e escalonamento", "Registro mínimo de tempos"],
  "docs/operations/login.md": ["Diagnóstico", "Recuperação e validação"],
  "docs/operations/legal-and-deep-links.md": ["Termos", "Deep links"],
  "docs/operations/release-gate.md": ["Promoção Preview → Production", "Rollback"],
  "docs/operations/game-day.md": ["Dry-run local sem mutação", "Ensaio autorizado futuro"],
};
const failures = [];

for (const [relativePath, markers] of Object.entries(required)) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath}: arquivo ausente`);
    continue;
  }
  const content = readFileSync(absolutePath, "utf8");
  for (const marker of markers) {
    if (!content.includes(marker)) failures.push(`${relativePath}: seção ausente (${marker})`);
  }

  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(resolve(dirname(absolutePath), target))) {
      failures.push(`${relativePath}: link interno ausente (${match[1]})`);
    }
  }

  for (const block of content.matchAll(/```bash\n([\s\S]*?)```/g)) {
    for (const command of block[1].split("\n").map((line) => line.trim()).filter(Boolean)) {
      if (!/^npm run (operations:validate|operations:game-day)$/.test(command)) {
        failures.push(`${relativePath}: comando não aprovado para dry-run (${command})`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Runbooks inválidos:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Runbooks válidos: ${Object.keys(required).length} documentos e links internos conferidos.`);

