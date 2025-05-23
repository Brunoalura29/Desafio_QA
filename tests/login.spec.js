import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

const VALID_EMAIL = 'qauser@example.com';
const VALID_PASSWORD = 'teste123';
const INVALID_EMAIL = 'naoexiste@example.com';
const INVALID_PASSWORD = 'errado123';

test.describe('Login Tests', () => {
  test('Cenário 1 – Login com sucesso', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(VALID_EMAIL, VALID_PASSWORD);
    await expect(page).toHaveURL(/.*(produtos|home)/);
  });

  test('Cenário 2 – E-mail inválido', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(INVALID_EMAIL, 'senhaqualquer');
    await expect(loginPage.errorMessage).toContainText('Email e/ou senha inválidos');
  });

  test('Cenário 3 – Senha inválida', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(VALID_EMAIL, INVALID_PASSWORD);
    await expect(loginPage.errorMessage).toContainText('Email e/ou senha inválidos');
  });

  test('Cenário 4 – Campos vazios', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.clickLogin();
    await expect(loginPage.errorMessage).toContainText('Password não pode ficar em branco');
  });

  test('Cenário 5 – Link para registro de novo usuário', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.clickRegister();
    await expect(page).toHaveURL(/.*register/);
  });
});
