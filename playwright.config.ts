import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * E2E тесты для проекта "Запись на звонок"
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Запуск тестов в параллель - отключаем для data isolation */
  fullyParallel: false,

  /* Отказ при ошибках в CI */
  forbidOnly: !!process.env.CI,

  /* Количество повторов при падении */
  retries: process.env.CI ? 2 : 0,

  /* Количество воркеров - 1 для последовательного выполнения */
  workers: 1,

  /* Reporter */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  /* Глобальные настройки */
  use: {
    /* Базовый URL */
    baseURL: process.env.FRONTEND_URL || 'http://localhost:8080',

    /* Снимать скриншоты при ошибках */
    screenshot: 'only-on-failure',

    /* Записывать видео при повторных попытках */
    video: 'on-first-retry',

    /* Трассировка */
    trace: 'on-first-retry',

    /* Всегда headless (без GUI) */
    headless: true,

    /* Используем встроенный Chromium (без зависимости от системного Chrome) */
    // channel: 'chromium', // Disabled - using built-in chromium

    /* API base URL for backend */
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  },

  /* Глобальный setup */
  globalSetup: require.resolve('./e2e/fixtures/global-setup'),

  /* Конфигурация проектов - только Desktop Chromium */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Локальный dev сервер перед тестами */
  webServer: process.env.CI ? undefined : {
    command: 'make dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Таймауты */
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
});
