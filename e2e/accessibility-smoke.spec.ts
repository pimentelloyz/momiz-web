import { expect, test } from "@playwright/test";

test("CTA principal preserva foco visível e ativação por teclado", async ({ page }) => {
  await page.goto("/");
  const cta = page.getByRole("link", { name: "Começar meu chá" });
  await cta.focus();
  await expect(cta).toBeFocused();
  await expect(cta).toHaveCSS("outline-style", /^(?!none$).+/);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#baixar$/);
});

test("termos refluem a 200% sem overflow horizontal", async ({ page }) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("O smoke de reflow exige viewport explícito.");
  await page.setViewportSize({
    width: Math.floor(viewport.width / 2),
    height: Math.floor(viewport.height / 2),
  });
  await page.goto("/health-professional-terms");
  await expect(page.getByRole("heading", { level: 1, name: "Termos de uso para profissionais de saúde" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("indisponibilidade de login é anunciada e suporte funciona por teclado", async ({ page }) => {
  await page.goto("/admin/login");
  const alert = page.getByRole("alert").filter({ hasText: "Login temporariamente indisponível" });
  await expect(alert).toContainText("Login temporariamente indisponível");
  await expect(page.getByRole("button", { name: "Sair e tentar novamente" })).toBeVisible();
  const support = page.getByRole("link", { name: "Acessar a Central de suporte" });
  await support.focus();
  await expect(support).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/suporte$/);
  await expect(page.getByRole("heading", { level: 1, name: "Central de suporte" })).toBeVisible();
});
