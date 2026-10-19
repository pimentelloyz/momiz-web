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
] as const;

for (const [path, heading] of legalPages) {
  test(`${path} carrega o conteúdo legal`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}

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
