import { test, expect } from '@playwright/test';

/**
 * Пример E2E теста
 * @see https://playwright.dev/docs/writing-tests
 */

test.describe('Главная страница', () => {
  test('должна загружаться', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Запись на звонок|Book a Call/);
  });
});
