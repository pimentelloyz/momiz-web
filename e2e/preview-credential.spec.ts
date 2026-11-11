import { expect, test } from "@playwright/test";
import { readSyntheticAccount } from "./authenticated-smoke-fixture";

const account = readSyntheticAccount(process.env);
const marker = process.env.SMOKE_CREDENTIAL_TEST_MARKER?.trim();
if (!account || account.surface !== "admin" || !marker) {
  throw new Error("The credential Preview spec requires the validated synthetic admin fixture.");
}

test("conta sintética abre apenas o comprovante administrativo marcado", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin(?:$|\?)/);

  await page.getByRole("button", { name: "Profissionais de saúde" }).click();
  const credential = page.locator("article").filter({ hasText: marker });
  await expect(credential).toHaveCount(1);
  const popupPromise = page.waitForEvent("popup");
  await credential.getByRole("button", { name: "Ver comprovante" }).click();
  const popup = await popupPromise;
  await expect(credential.getByRole("status")).toContainText("Operação concluída");
  await popup.close();
});
