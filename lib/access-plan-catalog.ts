export type PublicPlanCode = "FREE" | "STANDARD" | "PRO";

export type PublicAccessPlan = {
  packageCode: PublicPlanCode;
  name: string;
  description: string;
  features: Array<{ capability: string; label: string }>;
  highlights: string[];
  limits: Record<string, number>;
};

export type PublicAccessPlanCatalog = {
  catalogVersion: number;
  source: "api" | "fallback";
  plans: PublicAccessPlan[];
};

const publicPlanCodes = new Set<PublicPlanCode>(["FREE", "STANDARD", "PRO"]);

// Snapshot comercial mínimo. A API continua sendo a autoridade e substitui este
// conteúdo sempre que estiver disponível. Atualize a versão ao revisar o fallback.
export const FALLBACK_PLAN_CATALOG_VERSION = 1;
export const FALLBACK_PUBLIC_PLANS: PublicAccessPlan[] = [
  {
    packageCode: "FREE",
    name: "Free",
    description: "Para começar seu chá com os recursos essenciais",
    highlights: ["1 chá ativo", "Até 10 pessoas convidadas e presentes por chá"],
    features: [
      { capability: "event.create", label: "Criação e edição do chá" },
      { capability: "invite.share", label: "Compartilhamento de convites" },
      { capability: "guest.manage", label: "Gestão de convidados" },
      { capability: "gift.manage", label: "Gestão de presentes" },
    ],
    limits: { "event.active_limit": 1 },
  },
  {
    packageCode: "STANDARD",
    name: "Standard",
    description: "Mais recursos para o chá que você já organiza, mantendo 1 chá ativo",
    highlights: ["1 chá ativo", "Até 250 pessoas convidadas e presentes por chá"],
    features: [
      { capability: "event.custom_theme", label: "Tema personalizado" },
      { capability: "gift.pix", label: "Contribuições via Pix" },
      { capability: "gift.collective", label: "Presentes em grupo" },
      { capability: "message.private", label: "Mensagens privadas" },
    ],
    limits: { "event.active_limit": 1 },
  },
  {
    packageCode: "PRO",
    name: "Pro",
    description: "Para organizar novos chás, com até 10 chás ativos",
    highlights: ["Até 10 chás ativos", "Até 1.000 pessoas convidadas e presentes por chá"],
    features: [
      { capability: "event.advanced_analytics", label: "Relatórios avançados" },
      { capability: "planning.budget", label: "Controle de orçamento" },
      { capability: "guest.import_contacts", label: "Importação de contatos" },
      { capability: "gift.contribution_reconciliation", label: "Conciliação de contribuições" },
    ],
    limits: { "event.active_limit": 10 },
  },
];

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePlan(value: unknown): PublicAccessPlan | null {
  const plan = object(value);
  if (!plan) return null;
  const packageCode = text(plan.packageCode) as PublicPlanCode;
  if (!publicPlanCodes.has(packageCode)) return null;
  const name = text(plan.name);
  const description = text(plan.description);
  if (!name || !description) return null;

  const features = Array.isArray(plan.features)
    ? plan.features.flatMap((value) => {
        const feature = object(value);
        const capability = text(feature?.capability);
        const label = text(feature?.label);
        return capability && label ? [{ capability, label }] : [];
      })
    : [];
  const highlights = Array.isArray(plan.highlights)
    ? plan.highlights.map(text).filter(Boolean)
    : [];
  const limitsValue = object(plan.limits) ?? {};
  const limits = Object.fromEntries(
    Object.entries(limitsValue).flatMap(([key, value]) =>
      typeof value === "number" && Number.isFinite(value) ? [[key, value]] : [],
    ),
  );

  return { packageCode, name, description, features, highlights, limits };
}

export function parsePublicAccessPlanCatalog(value: unknown): PublicAccessPlanCatalog | null {
  const root = object(value);
  if (!root || !Array.isArray(root.plans)) return null;
  const plans = root.plans.map(parsePlan).filter((plan): plan is PublicAccessPlan => Boolean(plan));
  if (![...publicPlanCodes].every((code) => plans.some((plan) => plan.packageCode === code))) {
    return null;
  }
  return {
    catalogVersion: typeof root.catalogVersion === "number" ? root.catalogVersion : 0,
    source: "api",
    plans: (["FREE", "STANDARD", "PRO"] as PublicPlanCode[])
      .map((code) => plans.find((plan) => plan.packageCode === code) as PublicAccessPlan),
  };
}

export async function loadPublicAccessPlanCatalog(options: {
  apiBaseUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<PublicAccessPlanCatalog> {
  const apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(`${apiBaseUrl}/api/billing/plans`, {
      next: { revalidate: 900 },
    });
    if (response.ok) {
      const parsed = parsePublicAccessPlanCatalog(await response.json());
      if (parsed) return parsed;
    }
  } catch {
    // A landing permanece disponível com um snapshot mínimo e versionado.
  }
  return {
    catalogVersion: FALLBACK_PLAN_CATALOG_VERSION,
    source: "fallback",
    plans: FALLBACK_PUBLIC_PLANS,
  };
}
