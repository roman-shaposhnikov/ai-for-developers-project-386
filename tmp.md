 Как запустить фронтенд

 Context

 Запрос: «как запустить». Фронт уже реализован в services/front (FSD, React + Mantine + Vite, порт 8080) и
 интегрирован с корневым Makefile. Бэкенд на этом этапе ещё может быть не реализован, поэтому в дев-режиме
 контракт мокается через prism на :3000 и Vite-прокси /api → :3000 маршрутизирует запросы. Когда появится
 реальный бэк — переключить можно через VITE_API_BASE_URL или просто использовать make dev-front отдельно.

 Команды

 1. Поставить зависимости (один раз)

 npm install
 Корневой package.json объявляет workspace services/front, поэтому из корня ставится всё сразу.

 2. (Опционально) Перегенерировать типы из контракта

 Запускать после изменений в api/generated/openapi.yaml:
 make api-front
 Это вызывает openapi-typescript ../../api/generated/openapi.yaml -o src/shared/api/schema.ts.

 3. Запустить дев-режим

 Без бэкенда (с prism-моком):
 make dev          # = make dev-front-mock
 - Prism слушает на :3000 и отвечает по контракту примерами из OpenAPI.
 - Vite раздаёт SPA на :8080. Vite-прокси /api → http://localhost:3000 (см. services/front/vite.config.ts).
 - Открыть в браузере: http://localhost:8080/.

 С реальным бэкендом (когда поднят на :3000):
 make dev-front
 Прокси тот же (/api → :3000), просто prism не запускается. Если бэк на другом порту/хосте — задать
 VITE_API_BASE_URL=http://your-host:port.

 4. Маршруты для проверки (после make dev)

 - Публичные:
   - http://localhost:8080/ — список активных event types.
   - http://localhost:8080/{slug} — выбор слота (календарь на 14 дней + слоты).
   - http://localhost:8080/{slug}/book?start=ISO — форма гостя.
   - http://localhost:8080/booking/{id}/success — после брони, ссылка на отмену.
   - http://localhost:8080/booking/{id}/cancel?token=... — экран отмены.
 - Админ (без авторизации):
   - http://localhost:8080/admin → редирект на /admin/event-types.
   - /admin/event-types, /admin/bookings, /admin/availability.

 5. Тесты

 make test-u-front   # vitest run только для фронта
 make test-u         # агрегатор юнит-тестов
 make test           # все: u + i (заглушка) + e (заглушка)

 6. Прод-сборка (для проверки)

 npm --workspace=services/front run build
 npm --workspace=services/front run preview   # отдаст dist/ на :8080

 Devcontainer

 Если предпочитаете контейнер:
 make dc    # запуск
 make dcr   # пересборка + запуск
 В контейнере проброшены порты 8080 (SPA) и 3000 (бэк/мок).

 Troubleshooting

 - /api отдаёт 504/connection refused — prism/бэк не поднялся; проверить занятость :3000 (lsof -i :3000).
 - CORS-ошибки — обращаться нужно к http://localhost:8080, не к http://localhost:3000 напрямую: прокси Vite
 убирает CORS.
 - Типы не обновились после правки контракта — выполнить make api-front.
 - Изменился VITE_API_BASE_URL — Vite перечитает его только при перезапуске npm run dev.

 Verification

 1. npm install → нет ошибок.
 2. make dev → в логах видно «Prism is listening on http://0.0.0.0:3000» и «VITE … Local:
 http://localhost:8080/».
 3. curl -s http://localhost:8080/api/v1/public/events → 200 + JSON-массив (через прокси из prism).
 4. Открыть http://localhost:8080/ — отображается профиль Roman + список event types.
 5. make test-u-front — 19 тестов проходят.

 Критичные файлы (для справки, изменения не требуются)

 - Makefile — таргеты dev, dev-front, dev-front-mock, api-front, test-u-front.
 - services/front/vite.config.ts — порт 8080, прокси /api, alias @.
 - services/front/package.json — скрипты dev, build, gen:api, test.
 - services/front/src/shared/config/env.ts — резолв VITE_API_BASE_URL и default на window.location.origin.
