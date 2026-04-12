import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * E2E тесты для проекта "Запись на звонок"
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Запуск тестов в параллель */
  fullyParallel: true,
  
  /* Отказ при ошибках в CI */
  forbidOnly: !!process.env.CI,
  
  /* Количество повторов при падении */
  retries: process.env.CI ? 2 : 0,
  
  /* Количество воркеров */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  /* Глобальные настройки */
  use: {
    /* Базовый URL */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    /* Снимать скриншоты при ошибках */
    screenshot: 'only-on-failure',
    
    /* Записывать видео при повторных попытках */
    video: 'on-first-retry',
    
    /* Трассировка */
    trace: 'on-first-retry',
    
    /* Headless режим в CI */
    headless: !!process.env.CI,
  },

  /* Конфигурация проектов для разных браузеров */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Тесты на мобильных устройствах */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Локальный dev сервер перед тестами */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
