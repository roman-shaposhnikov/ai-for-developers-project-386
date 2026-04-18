const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/node/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Собираем консольные логи
  const consoleLogs = [];
  
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      time: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  // Собираем ошибки страницы
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  // Переходим на страницу
  console.log('Navigating to http://localhost:8080...');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  
  // Ждем немного для загрузки React приложения
  await page.waitForTimeout(3000);
  
  console.log('\n--- Console Logs Summary ---');
  console.log(`Total logs captured: ${consoleLogs.length}`);
  
  // Выводим все логи
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.text}`);
  });
  
  await browser.close();
})();
