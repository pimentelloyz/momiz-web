import { expect, test } from "@playwright/test";

test("home carrega e leva o CTA principal para o download", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Seu chá perto de quem importa/,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Começar meu chá" }).click();
  await expect(page).toHaveURL(/\/#baixar$/);
  await expect(page.getByRole("heading", { name: /Leve o Momiz/ })).toBeVisible();
});

const legalPages = [
  ["/termos", "Termos de uso"],
  ["/privacidade", "Política de privacidade"],
  ["/suporte", "Central de suporte"],
  ["/excluir-conta", "Excluir conta e dados"],
  ["/health-professional-terms", "Termos de uso para profissionais de saúde"],
] as const;

for (const [path, heading] of legalPages) {
  test(`${path} carrega o conteúdo legal`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}

test("manifests de associação mobile preservam os identificadores oficiais", async ({ request }) => {
  const apple = await request.get("/.well-known/apple-app-site-association");
  expect(apple.ok()).toBeTruthy();
  const appleManifest = await apple.json();
  expect(JSON.stringify(appleManifest)).toContain("2B3NAR3YX7.com.lifeados.momiz");
  expect(JSON.stringify(appleManifest)).toContain("/care/invite/*");

  const android = await request.get("/.well-known/assetlinks.json");
  expect(android.ok()).toBeTruthy();
  const androidManifest = await android.json();
  expect(JSON.stringify(androidManifest)).toContain("com.lifeados.momiz.app");
});

test("headers defensivos protegem páginas públicas e superfícies sensíveis", async ({ request }) => {
  const home = await request.get("/");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home.headers()["x-frame-options"]).toBe("DENY");
  expect(home.headers()["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");

  for (const path of ["/admin/login", "/profissional/login", "/api/deep-link-handoffs"]) {
    const response = await request.get(path);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  }
});

test("convite público usa a API local e expõe o deep link", async ({ page }) => {
  await page.goto("/convite/smoke?guest=guest-smoke");

  await expect(page.getByRole("heading", { level: 1, name: "Nosso chá de teste" })).toBeVisible();
  await expect(page.getByText("Fixture pública sem dados reais.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir no Momiz e escolher" })).toHaveAttribute(
    "href",
    "momiz://convite/smoke?guest=guest-smoke",
  );
});

test("convite inexistente apresenta o estado 404", async ({ page }) => {
  await page.goto("/convite/not-found");

  await expect(
    page.getByRole("heading", { name: "Não encontramos este convite" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Conhecer o Momiz" })).toBeVisible();
});

test("falha transitória do convite apresenta recuperação segura", async ({ page }) => {
  await page.goto("/convite/transient");

  await expect(
    page.getByRole("heading", { name: "Não foi possível carregar o convite" }),
  ).toBeVisible();
  await expect(page.getByText(/Tivemos uma instabilidade/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir para o início" })).toBeVisible();
});

test("fallback de evento expõe deep link e bloqueia indexação", async ({ page }) => {
  const eventId = "123e4567-e89b-42d3-a456-426614174000";
  await page.goto(`/events/${eventId}`);

  await expect(page.getByRole("heading", { name: "Continue no app" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir evento no Momiz" })).toHaveAttribute(
    "href",
    `momiz://events/${eventId}`,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex.*nofollow|nofollow.*noindex/,
  );
});

test("portal profissional apresenta login isolado do site público", async ({ page }) => {
  await page.goto("/profissional/login");

  await expect(page.getByRole("heading", { level: 1, name: "Acesso profissional" })).toBeVisible();
  await expect(page.getByText(/Consulte pacientes e compromissos autorizados/)).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Login temporariamente indisponível");
  await expect(page.getByRole("link", { name: "Acessar a Central de suporte" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toHaveCount(0);
  await expect(page.locator("header.site-header")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex.*nofollow|nofollow.*noindex/,
  );
});

test("painel administrativo explica autenticação indisponível", async ({ page }) => {
  await page.goto("/admin/login");

  await expect(page.getByRole("heading", { level: 1, name: "Acesso administrativo" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Login temporariamente indisponível");
  const retry = page.getByRole("button", { name: "Sair e tentar novamente" });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(page.getByRole("button", { name: "Sair e tentar novamente" })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Acessar a Central de suporte" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toHaveCount(0);
});
