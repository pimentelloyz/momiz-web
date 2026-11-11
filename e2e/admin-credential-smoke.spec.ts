import { expect, test } from "@playwright/test";
import { localAdminFixtureCookies } from "./authenticated-smoke-fixture";

test.beforeEach(async ({ context, page, baseURL }) => {
  const cookies = localAdminFixtureCookies(baseURL || "");
  expect(cookies, "A sessão sintética só pode ser usada no servidor local explícito.").not.toBeNull();
  await context.addCookies(cookies || []);
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  const careTab = page.getByRole("button", { name: "Profissionais de saúde" });
  await careTab.click();
  await expect(careTab).toHaveClass(/adminTabActive/);
  await expect(page.getByRole("heading", { name: "Credenciais declaradas" })).toBeVisible();
});

test("comprovante seguro abre popup somente após validação", async ({ page }) => {
  const credential = page.locator("article").filter({ hasText: "Credencial válida" });
  const popupPromise = page.waitForEvent("popup");
  await credential.getByRole("button", { name: "Ver comprovante" }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole("heading", { name: "Comprovante sintético aberto" })).toBeVisible();
  await expect(credential.getByRole("status")).toContainText("Operação concluída");
  await popup.close();
});

test("payload inseguro não abre popup nem expõe a URL", async ({ context, page }) => {
  const credential = page.locator("article").filter({ hasText: "Payload inválido" });
  const pagesBefore = context.pages().length;
  await credential.getByRole("button", { name: "Ver comprovante" }).click();
  await expect(credential.getByRole("alert")).toContainText("req-credential-invalid");
  await expect.poll(() => context.pages().length).toBe(pagesBefore);
  await expect(credential).not.toContainText("javascript:");
  await expect(credential).not.toContainText("fixture-secret");
});

test("URL expirada mantém correlação e não abre popup", async ({ context, page }) => {
  const credential = page.locator("article").filter({ hasText: "URL expirada" });
  const pagesBefore = context.pages().length;
  await credential.getByRole("button", { name: "Ver comprovante" }).click();
  await expect(credential.getByRole("alert")).toContainText("A URL temporária expirou.");
  await expect(credential.getByRole("alert")).toContainText("req-credential-expired");
  await expect.poll(() => context.pages().length).toBe(pagesBefore);
});
