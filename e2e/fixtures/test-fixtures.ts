/**
 * Playwright test fixtures с API моками
 */

import { test as base, expect } from '@playwright/test';
import { createApiMock, ApiMock } from '../helpers/api-mock';

// Расширяем базовый test с моками
type TestFixtures = {
  apiMock: ApiMock;
};

export const test = base.extend<TestFixtures>({
  // Автоматически настраиваем моки для каждого теста
  apiMock: async ({ page }, use) => {
    const apiMock = createApiMock(page);
    await apiMock.setup();
    await use(apiMock);
    apiMock.clear();
  },
});

export { expect };
