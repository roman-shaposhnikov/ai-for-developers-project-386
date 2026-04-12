# E2E Тесты для Book a Call

Набор end-to-end тестов на Playwright для приложения "Запись на звонок".

## Структура

```
e2e/
├── fixtures/           # Тестовые данные и типы
│   ├── test-data.ts   # Тестовые данные (события, гости, расписания)
│   └── types.ts       # TypeScript типы для API
├── helpers/            # Вспомогательные инструменты
│   ├── api-client.ts  # HTTP клиент для API
│   └── page-objects.ts # Page Object Models
├── public/            # Тесты публичных страниц (гостевой flow)
│   ├── events.spec.ts        # Список событий
│   ├── booking.spec.ts       # Выбор времени
│   └── booking-form.spec.ts  # Форма бронирования
├── admin/             # Тесты админ панели
│   ├── events.spec.ts   # Управление событиями
│   ├── schedule.spec.ts # Управление расписанием
│   └── bookings.spec.ts # Управление бронированиями
├── api/               # API интеграционные тесты
│   └── api.spec.ts    # Тесты API endpoints
└── integration/       # End-to-end интеграционные тесты
    └── full-flow.spec.ts # Полные пользовательские сценарии
```

## Запуск тестов

### Вариант 1: Docker (рекомендуется) — все зависимости уже установлены

```bash
# Собрать Docker образ
make docker-build

# Запустить тесты в Docker
make docker-test

# Или напрямую через docker compose
docker compose -f .devcontainer/compose.yaml run --rm devcontainer npm test

# Запустить конкретный тест
docker compose -f .devcontainer/compose.yaml run --rm devcontainer npx playwright test public/events.spec.ts

# Открыть отчёт
docker compose -f .devcontainer/compose.yaml run --rm devcontainer npx playwright show-report
```

### Вариант 2: Локально (требует установки браузеров)

```bash
npm install
npx playwright install chromium

# Запуск всех тестов
npx playwright test
```

### Запуск тестов конкретной группы

```bash
# Публичные страницы
npx playwright test public/

# Админ панель
npx playwright test admin/

# API тесты
npx playwright test api/

# Интеграционные тесты
npx playwright test integration/
```

### Docker сервисы

Схема `compose.yaml` включает:

```yaml
services:
  devcontainer  # Интерактивная разработка + Playwright тесты
  frontend      # Frontend dev server (port 5173)
```

**Запуск development окружения:**
```bash
make docker-dev    # Запускает devcontainer + frontend
# Frontend доступен на http://localhost:5173
# Тесты запускаются из devcontainer
```

**Пересборка после изменений:**
```bash
make docker-rebuild
```

### Запуск тестов конкретной группы

```bash
# Публичные страницы
npx playwright test public/

# Админ панель
npx playwright test admin/

# API тесты
npx playwright test api/

# Интеграционные тесты
npx playwright test integration/
```

### Запуск в конкретном браузере

```bash
# Только Chrome
npx playwright test --project=chromium

# Только Firefox
npx playwright test --project=firefox
```

### Запуск с UI (для отладки)

```bash
npx playwright test --ui
```

### Запуск в headed режиме (видимый браузер)

```bash
npx playwright test --headed
```

## Конфигурация

### Переменные окружения

```bash
# Базовый URL фронтенда (по умолчанию: http://localhost:5173)
export BASE_URL=http://localhost:5173

# URL API бэкенда (по умолчанию: http://localhost:3000/api/v1)
export API_URL=http://localhost:3000/api/v1

# Данные для авторизации в админке
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=admin123
```

## Покрытие тестами

### Публичный flow (Гость)

- [x] Просмотр списка активных событий
- [x] Выбор даты и времени бронирования
- [x] Заполнение формы бронирования
- [x] Валидация данных гостя
- [x] Подтверждение бронирования
- [x] Отмена бронирования с токеном
- [x] Копирование ссылки управления
- [x] Обработка ошибок (занятые слоты)

### Админ панель

- [x] Аутентификация
- [x] Список всех событий (включая неактивные)
- [x] Создание события
- [x] Валидация данных события
- [x] Редактирование события
- [x] Удаление события
- [x] Блокировка удаления события с бронированиями
- [x] Управление расписанием
- [x] Просмотр бронирований
- [x] Отмена бронирований

### API

- [x] CRUD операции для событий
- [x] Управление расписанием
- [x] Вычисление доступных слотов
- [x] Создание бронирований
- [x] Валидация бронирований
- [x] Отмена бронирований (админ/гость)
- [x] Обработка ошибок

## Архитектура тестов

### Page Object Pattern

Все страницы представлены как Page Object Models в `helpers/page-objects.ts`:

```typescript
const publicPage = new PublicEventsListPage(page);
await publicPage.goto();
await publicPage.clickEventCard('intro-call');
```

### API Client

HTTP клиент для прямого взаимодействия с API в `helpers/api-client.ts`:

```typescript
const api = createApiClient(request, { username, password });
const event = await api.createEvent({ title, slug, duration, description });
```

### Fixtures

Тестовые данные централизованы в `fixtures/test-data.ts`:

- `sampleEvents` — примеры событий
- `sampleGuests` — примеры гостей
- `defaultWeeklySchedule` — стандартное расписание
- Хелперы для генерации уникальных данных

## Best Practices

1. **Изоляция тестов** — каждый тест создаёт свои данные и очищает их в `afterEach`
2. **Повторяемость** — использование `generateUniqueSlug()` для уникальных данных
3. **Читаемость** — Page Object Models делают тесты похожими на пользовательские шаги
4. **Надёжность** — ожидание видимости элементов перед взаимодействием
5. **Параллельность** — тесты настроены на параллельный запуск (`fullyParallel: true`)

## Отчёты

HTML отчёт генерируется автоматически:

```bash
npx playwright show-report
```

## CI/CD

Тесты настроены для запуска в CI:

- Headless режим автоматически включается при `CI=true`
- Повторные попытки при нестабильных тестах
- Скриншоты при ошибках
- Видео и трассировка при повторных попытках
