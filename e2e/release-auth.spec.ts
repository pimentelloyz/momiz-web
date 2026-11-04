import { expect, test } from '@playwright/test';
import { readSyntheticAccount } from './authenticated-smoke-fixture';

const account = readSyntheticAccount(process.env);
const required = process.env.SMOKE_REQUIRE_AUTH === 'true';

test('conta sintética inicia uma sessão no deployment candidato', async ({ page }) => {
  if (!account) {
    if (required) {
      expect(account, 'SMOKE_AUTH_EMAIL e SMOKE_AUTH_PASSWORD são obrigatórios para esta promoção').toBeTruthy();
    }
    test.skip(true, 'Conta sintética não configurada; smoke autenticado opcional neste ambiente.');
    return;
  }

  const loginPath = account.surface === 'admin' ? '/admin/login' : '/profissional/login';
  await page.goto(loginPath);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${account.surface}(?:$|\\?)`));
});
