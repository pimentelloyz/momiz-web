import { existsSync } from "node:fs";
import { chromium, webkit } from "@playwright/test";

const required = [
  ["Chromium", chromium.executablePath()],
  ["WebKit", webkit.executablePath()],
];
const missing = required.filter(([, executable]) => !existsSync(executable));

if (missing.length) {
  process.stderr.write(`Browsers Playwright ausentes: ${missing.map(([name]) => name).join(", ")}.\n`);
  process.stderr.write("Execute: npm run test:e2e:install\n");
  process.exitCode = 1;
} else {
  process.stdout.write("Browsers Playwright prontos: Chromium e WebKit.\n");
}
