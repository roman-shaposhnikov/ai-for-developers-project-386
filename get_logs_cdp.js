const CDP = require('chrome-remote-interface');

async function getConsoleLogs() {
    let client;
    try {
        // Получаем список страниц
        const targets = await CDP.List({ port: 9222 });
        const pageTarget = targets.find(t => t.url.includes('localhost:8080'));

        if (!pageTarget) {
            console.log('Страница localhost:8080 не найдена');
            return;
        }

        console.log(`Найдена страница: ${pageTarget.title} (${pageTarget.id})`);

        // Подключаемся к странице
        client = await CDP({ port: 9222, target: pageTarget.id });
        const { Runtime, Console, Log, Page } = client;

        // Включаем необходимые домены
        await Console.enable();
        await Log.enable();
        await Page.enable();

        const logs = [];

        // Обработчик сообщений консоли
        Console.messageAdded(({ message }) => {
            const logEntry = `[${message.level.toUpperCase()}] ${message.text}`;
            logs.push(logEntry);
            console.log(logEntry);
        });

        // Обработчик записей логов
        Log.entryAdded(({ entry }) => {
            const logEntry = `[LOG.${entry.level.toUpperCase()}] ${entry.text}`;
            logs.push(logEntry);
            console.log(logEntry);
        });

        console.log('\n=== Перезагружаю страницу ===');
        await Page.reload({ ignoreCache: true });

        // Ждем для сбора логов после перезагрузки
        console.log('=== Жду загрузки страницы... ===\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('\n=== Итого ===');
        console.log(`Всего логов: ${logs.length}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

getConsoleLogs();
