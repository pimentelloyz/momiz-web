import { expect, test } from '@playwright/test';

const email = process.env.SMOKE_AUTH_EMAIL;
const password = process.env.SMOKE_AUTH_PASSWORD;
const required = process.env.SMOKE_REQUIRE_AUTH === 'true';
const surface = process.env.SMOKE_AUTH_SURFACE === 'admin' ? 'admin' : 'profissional';

test('conta sintética inicia uma sessão no deployment candidato', async ({ page }) => {
  if (!email || !password) {
    if (required) {
      expect(email && password, 'SMOKE_AUTH_EMAIL e SMOKE_AUTH_PASSWORD são obrigatórios para esta promoção').toBeTruthy();
    }
    test.skip(true, 'Conta sintética não configurada; smoke autenticado opcional neste ambiente.');
  }

  const loginPath = surface === 'admin' ? '/admin/login' : '/profissional/login';
  await page.goto(loginPath);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${surface}(?:$|\\?)`));
});
