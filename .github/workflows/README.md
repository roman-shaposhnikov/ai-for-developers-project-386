# GitHub Actions Workflows

Этот каталог содержит workflow для автоматического тестирования проекта.

## Workflows

### `e2e-tests.yml` — E2E Тесты

Запускает полный набор end-to-end тестов на Playwright в Docker окружении.

**Триггеры:**

- Push в `main`/`master`
- Pull Request в `main`/`master`
- Ручной запуск (workflow_dispatch)

**Стратегия:**

1. **E2E Tests** — полный набор тестов (все 88 сценариев)
   - Запускается на push в main и PR
   - Таймаут: 20 минут
   - Сохраняет полный отчёт и скриншоты

2. **Smoke Tests** — быстрая проверка критичных сценариев
   - Запускается только на Pull Request
   - Таймаут: 10 минут
   - Тестирует: просмотр событий, бронирование, отмену

**Артефакты:**

- `playwright-report/` — HTML отчёт
- `test-results/` — результаты тестов
- `screenshots/` — скриншоты при ошибках (только при падении)

**Доступ:**

- Артефакты доступны 7 дней
- HTML отчёт можно скачать и открыть локально

### `hexlet-check.yml` — Hexlet Проверки

**⚠️ НЕ УДАЛЯТЬ И НЕ ИЗМЕНЯТЬ**

Этот файл автоматически генерируется Hexlet и используется для проверки заданий курса.

---

## Локальный запуск тестов (до отправки в CI)

```bash
# Сборка Docker образов
make docker-build

# Запуск devcontainer + frontend + backend
make docker-dev

# Запуск всех E2E тестов
make docker-test

# Запуск конкретного файла
make docker-test-file FILE=public/booking.spec.ts

# Остановка сервисов
make docker-stop
```

## Устранение проблем в CI

### Тесты падают с таймаутом

**Причина:** Сервисы не успевают запуститься

**Решение:**

- Увеличить `sleep` в шаге "Start services"
- Проверить healthcheck endpoints

### Docker build медленный

**Причина:** Нет кэша слоёв

**Решение:** Кэширование уже настроено в workflow через `actions/cache@v4`

### Playwright report не загружается

**Причина:** Тесты падают до генерации отчёта

**Решение:** Артефакты сохраняются даже при `if: always()` или `if: failure()`

---

## Добавление новых тестов в CI

Если добавляете новые критичные сценарии, обновите smoke tests:

```yaml
- name: Run smoke tests
  run: |
    docker compose -f .devcontainer/compose.yaml run --rm devcontainer npx playwright test \
      public/events.spec.ts \
      public/booking.spec.ts \
      public/booking-form.spec.ts \
      admin/events.spec.ts  # ← добавить если критично
      --grep "smoke|Guest|create|cancel|ваш_сценарий"
```
