import assert from "node:assert/strict";
import test from "node:test";
import {
  FALLBACK_PLAN_CATALOG_VERSION,
  loadPublicAccessPlanCatalog,
  parsePublicAccessPlanCatalog,
} from "../lib/access-plan-catalog.ts";

const plan = (packageCode: string, eventLimit: number) => ({
  packageCode,
  name: packageCode === "FREE" ? "Free" : packageCode === "STANDARD" ? "Standard" : "Pro",
  description: `Descrição ${packageCode}`,
  features: [{ capability: "event.create", label: "Criação de chá" }],
  highlights: [`${eventLimit} chá(s) ativo(s)`],
  limits: { "event.active_limit": eventLimit },
});

test("parses and orders the public plans while omitting Demo", () => {
  const parsed = parsePublicAccessPlanCatalog({
    catalogVersion: 7,
    plans: [plan("PRO", 10), plan("DEMO", 1), plan("FREE", 1), plan("STANDARD", 1)],
  });

  assert.equal(parsed?.catalogVersion, 7);
  assert.deepEqual(parsed?.plans.map((item) => item.packageCode), ["FREE", "STANDARD", "PRO"]);
});

test("rejects incomplete or malformed catalogs", () => {
  assert.equal(parsePublicAccessPlanCatalog({ plans: [plan("FREE", 1)] }), null);
  assert.equal(parsePublicAccessPlanCatalog({ plans: "invalid" }), null);
});

test("loads the canonical API catalog", async () => {
  let requestedUrl = "";
  const catalog = await loadPublicAccessPlanCatalog({
    apiBaseUrl: "https://api.example.test/",
    fetchImpl: (async (url: string | URL | Request) => {
      requestedUrl = String(url);
      return Response.json({
        catalogVersion: 4,
        plans: [plan("FREE", 1), plan("STANDARD", 1), plan("PRO", 10)],
      });
    }) as typeof fetch,
  });

  assert.equal(requestedUrl, "https://api.example.test/api/billing/plans");
  assert.equal(catalog.source, "api");
  assert.equal(catalog.catalogVersion, 4);
});

test("uses the versioned fallback when the API is unavailable or invalid", async () => {
  const network = await loadPublicAccessPlanCatalog({
    apiBaseUrl: "https://api.example.test",
    fetchImpl: (async () => { throw new Error("offline"); }) as typeof fetch,
  });
  const invalid = await loadPublicAccessPlanCatalog({
    apiBaseUrl: "https://api.example.test",
    fetchImpl: (async () => Response.json({ plans: [] })) as typeof fetch,
  });

  assert.equal(network.source, "fallback");
  assert.equal(network.catalogVersion, FALLBACK_PLAN_CATALOG_VERSION);
  assert.deepEqual(network, invalid);
});
