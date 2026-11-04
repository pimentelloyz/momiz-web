import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const artifactDir = valueAfter("--artifact-dir");
const check = args.includes("--check");

if (!artifactDir) {
  console.error("Informe --artifact-dir para o pacote momiz-openapi-<sha>.");
  process.exit(1);
}

const resolvedArtifactDir = resolve(artifactDir);
const contractPath = resolve(resolvedArtifactDir, "openapi.yaml");
const manifestPath = resolve(resolvedArtifactDir, "manifest.json");
const outputPath = resolve("lib/generated/professional-terms-contract.ts");

if (!existsSync(contractPath) || !existsSync(manifestPath)) {
  console.error(`Artefato OpenAPI incompleto em ${resolvedArtifactDir}.`);
  process.exit(1);
}

const contract = readFileSync(contractPath, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const checksum = createHash("sha256").update(contract).digest("hex");
const expectedName = `momiz-openapi-${manifest.sourceSha}`;

if (manifest.format !== "momiz-openapi-artifact-v1" ||
    manifest.sha256 !== checksum ||
    manifest.artifactName !== expectedName ||
    resolvedArtifactDir.split("/").at(-1) !== expectedName) {
  console.error("Manifest/checksum do artefato OpenAPI é inválido ou não corresponde ao diretório versionado.");
  process.exit(1);
}

const lines = contract.split(/\r?\n/);
const pathIndex = lines.findIndex((line) => line === "  /care/professional/terms:");
const nextPathIndex = lines.findIndex((line, index) => index > pathIndex && /^  \//.test(line));
if (pathIndex < 0 || nextPathIndex < 0) {
  console.error("Capability GET /care/professional/terms ausente do contrato.");
  process.exit(1);
}

const operation = lines.slice(pathIndex, nextPathIndex).join("\n");
if (!/\n    get:\n/.test(`\n${operation}\n`) || !operation.includes("operationId: getCurrentProfessionalTerms")) {
  console.error("Operation getCurrentProfessionalTerms ausente ou incompatível.");
  process.exit(1);
}

const requiredMatch = operation.match(/required: \[([^\]]+)\]/);
const propertiesBlock = operation.match(/properties:\n([\s\S]+)$/)?.[1] ?? "";
const required = requiredMatch?.[1].split(",").map((value) => value.trim()).filter(Boolean) ?? [];
const properties = [...propertiesBlock.matchAll(/^\s{18}(\w+): \{ type: (\w+)(?:, format: (\w+))?[^}]*\}/gm)]
  .map((match) => ({ name: match[1], type: match[2], format: match[3] ?? null }));

if (required.length === 0 || properties.length === 0 || required.some((name) => !properties.some((property) => property.name === name))) {
  console.error("Schema de resposta 200 não pôde ser derivado com segurança.");
  process.exit(1);
}

const tsType = (property) => property.type === "string" ? "string" : "unknown";
const validations = `  const payload = input as Record<string, unknown>;\n${properties.map((property) => {
  const presence = required.includes(property.name)
    ? `typeof payload.${property.name} !== "${property.type}"`
    : `payload.${property.name} !== undefined && typeof payload.${property.name} !== "${property.type}"`;
  const format = property.format === "uri"
    ? ` || (typeof payload.${property.name} === "string" && !isHttpUrl(payload.${property.name}))`
    : "";
  return `  if (${presence}${format}) issues.push("${property.name}");`;
}).join("\n")}`;
const fields = properties.map((property) => `  ${property.name}${required.includes(property.name) ? "" : "?"}: ${tsType(property)};`).join("\n");
const values = properties.map((property) => `      ${property.name}: payload.${property.name} as ${tsType(property)},`).join("\n");

const generated = `// GENERATED FILE — DO NOT EDIT. Run npm run openapi:generate.\n// Source: ${manifest.artifactName}; contract ${manifest.contractVersion}; sha256 ${manifest.sha256}\n\nexport const GET_CURRENT_PROFESSIONAL_TERMS_CONTRACT = {\n  operationId: "getCurrentProfessionalTerms",\n  method: "GET",\n  path: "/care/professional/terms",\n  sourceSha: "${manifest.sourceSha}",\n  sourceChecksum: "${manifest.sha256}",\n} as const;\n\nexport type GetCurrentProfessionalTermsResponse = {\n${fields}\n};\n\nexport type GetCurrentProfessionalTermsParseResult =\n  | { ok: true; value: GetCurrentProfessionalTermsResponse }\n  | { ok: false; error: { code: "INVALID_RESPONSE"; issues: string[] } };\n\nfunction isHttpUrl(value: string): boolean {\n  try {\n    const url = new URL(value);\n    return url.protocol === "https:" || url.protocol === "http:";\n  } catch {\n    return false;\n  }\n}\n\nexport function parseGetCurrentProfessionalTermsResponse(input: unknown): GetCurrentProfessionalTermsParseResult {\n  if (typeof input !== "object" || input === null || Array.isArray(input)) {\n    return { ok: false, error: { code: "INVALID_RESPONSE", issues: ["response"] } };\n  }\n  const issues: string[] = [];\n${validations}\n  if (issues.length > 0) return { ok: false, error: { code: "INVALID_RESPONSE", issues } };\n  return {\n    ok: true,\n    value: {\n${values}\n    },\n  };\n}\n`;

if (check) {
  if (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== generated) {
    console.error("Contrato gerado está stale. Execute npm run openapi:generate.");
    process.exit(1);
  }
  console.log(`Contrato gerado confere com ${manifest.artifactName}.`);
} else {
  writeFileSync(outputPath, generated);
  console.log(`Contrato gerado de ${manifest.artifactName}.`);
}
