const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    logs.push(logEntry);
    console.log(logEntry);
  });
  
  page.on('pageerror', error => {
    const errorEntry = `[PAGE ERROR] ${error.message}`;
    logs.push(errorEntry);
    console.log(errorEntry);
  });
  
  // Navigate to the page
  console.log('=== Navigating to http://localhost:8080 ===\n');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  
  // Wait a bit for any additional logs
  await page.waitForTimeout(3000);
  
  console.log('\n=== Summary ===');
  console.log(`Total logs captured: ${logs.length}`);
  
  await browser.close();
})();
