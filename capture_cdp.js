const CDP = require('chrome-remote-interface');

async function captureConsoleLogs() {
  let client;
  try {
    // Connect to Chrome instance
    client = await CDP({ port: 9222 });
    const { Runtime, Page, Log } = client;

    // Enable domains
    await Runtime.enable();
    await Page.enable();
    await Log.enable();

    // Collect console logs
    const logs = [];
    
    Runtime.consoleAPICalled(({ type, args, timestamp }) => {
      const message = args.map(arg => arg.value || arg.description || JSON.stringify(arg)).join(' ');
      const logEntry = `[${type.toUpperCase()}] ${message}`;
      logs.push(logEntry);
      console.log(logEntry);
    });

    Runtime.exceptionThrown(({ timestamp, exceptionDetails }) => {
      const logEntry = `[EXCEPTION] ${exceptionDetails.text}`;
      logs.push(logEntry);
      console.log(logEntry);
    });

    Log.entryAdded(({ entry }) => {
      const logEntry = `[${entry.level.toUpperCase()}] ${entry.text}`;
      logs.push(logEntry);
      console.log(logEntry);
    });

    // Navigate to page
    console.log('=== Navigating to http://localhost:8080 ===\n');
    await Page.navigate({ url: 'http://localhost:8080' });
    await Page.loadEventFired();
    
    // Wait for logs
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`\n=== Summary: ${logs.length} logs captured ===`);

  } catch (err) {
    console.error('Error:', err.message);
    console.log('\nMake sure Chrome is running with: --remote-debugging-port=9222');
  } finally {
    if (client) await client.close();
  }
}

captureConsoleLogs();
