# Frontend для Book a Call

## Context

`services/front/` сейчас пустой (только `package.json: {}` и `CLAUDE.md` с описанием FSD). Нужно поднять полноценный SPA-фронтенд по требованиям из `prompts/front.md`:

- React + TypeScript + Mantine + Vite, порт 8080.
- Все обращения только через API-контракт `api/generated/openapi.yaml` (singleton-владелец без авторизации, гость без аккаунта, токен отмены брони).
- Прикрытые мокапы — в `prompts/assets/*.png`.
- В режиме разработки бэкенд может отсутствовать — должен работать prism-мок поверх контракта; тот же фронт должен работать против реального бэкенда без изменений кода.

Скоупы из ответов на вопросы:

- API-клиент: `openapi-fetch` + типы из `openapi-typescript` (генерация в `src/shared/api/schema.ts`).
- Edit-event: только поля из контракта (title, description, duration, active). Никаких placeholder-вкладок.
- Публичный `/`: профиль владельца + список активных event types (cal.com style).
- Cancel-флоу: на странице успеха — копируемая ссылка `/booking/{id}/cancel?token=…`; отдельный SPA-маршрут вызывает `DELETE /public/bookings/{id}?cancelToken=…`.
- Админский сайдбар: только Event types / Bookings / Availability.
- Schedule TZ: локальная TZ браузера в UI ↔ HH:MM UTC в контракте.

## Архитектура

Один SPA на порту 8080. Внутри — два неавторизованных раздела по префиксам маршрутов:

- `/` — публичная часть (гость).
- `/admin/*` — админка владельца.

Стек:

- React 18 + TypeScript, Vite.
- Mantine 7 (`@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/dates`, `@mantine/notifications`).
- React Router 6.
- TanStack Query 5 (server state, инвалидация после мутаций).
- `openapi-fetch` + `openapi-typescript` (типы из контракта).
- `dayjs` + `dayjs/plugin/utc` + `dayjs/plugin/timezone` (Mantine dates через `DatesProvider`).
- Vitest + React Testing Library + jsdom для юнит-тестов.

API base URL — `VITE_API_BASE_URL`, по умолчанию `http://localhost:3000` (совпадает с `@server` в `api/main.tsp`). В Vite-dev-сервере добавить proxy `/api/v1` → `VITE_API_BASE_URL` чтобы избежать CORS.

## Маршруты

Публичные:

- `/` — профиль владельца (статичный заголовок «Roman» + аватар) и список активных event types (`GET /public/events`). Карточка ведёт на `/{slug}`.
- `/{slug}` — выбор слота. Календарь на 14 дней (`GET /public/events/{slug}` + `GET /public/events/{slug}/slots?date=YYYY-MM-DD` по выбранной дате). Соответствует `event-slots.png`.
- `/{slug}/book?start=ISO` — форма гостя (`slot-booking.png`). Отправляет `POST /public/events/{slug}/bookings`. После успеха редирект на `/booking/{id}/success?token=…` (token держим в state роутера; query — fallback на refresh).
- `/booking/:id/success` — `booking-success.png`. Показывает данные брони + копируемую ссылку отмены.
- `/booking/:id/cancel` — экран подтверждения, кнопка вызывает `DELETE /public/bookings/{id}?cancelToken=…`.

Админ (без авторизации):

- `/admin` → редирект на `/admin/event-types`.
- `/admin/event-types` — список (`events-list.png`). Тогглы active вызывают `PATCH /events/{slug}`. Кнопка «New» открывает модалку (`add-event.png`) → `POST /events`.
- `/admin/event-types/:slug` — редактор Basics (`edit-event.png`, только реально работающие поля). Удаление — `DELETE /events/{slug}` (с обработкой 409, если есть активные брони).
- `/admin/bookings` — список (`bookings-list.png`, вкладка Upcoming). `GET /bookings`. Меню «…» — отмена через `DELETE /bookings/{id}`. Контракт отдаёт только активные предстоящие → оставляем только вкладку Upcoming, остальные убираем.
- `/admin/availability` — `schedule.png`. `GET /schedule` → редактор недели → `PUT /schedule`. Все таймы в UI — в TZ из селектора (по умолчанию `Intl.DateTimeFormat().resolvedOptions().timeZone`), на отправку → UTC.

## Структура директорий (FSD, по `services/front/CLAUDE.md`)

```
services/front/
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  src/
    main.tsx
    app/
      App.tsx
      providers.tsx        # MantineProvider, QueryClientProvider, DatesProvider, BrowserRouter
      router.tsx           # все маршруты
    pages/
      public/
        owner-page/        # /
        event-page/        # /{slug}
        booking-page/      # /{slug}/book
        booking-success-page/
        booking-cancel-page/
      admin/
        event-types-page/      # список
        event-edit-page/       # /admin/event-types/:slug
        bookings-page/
        availability-page/
    widgets/
      admin-shell/         # сайдбар + outlet
      slot-picker/         # календарь + список слотов
      week-schedule-editor/
    features/
      event-types/
        toggle-active/
        create-event/      # модалка
        delete-event/
      bookings/
        cancel-booking-admin/
        cancel-booking-public/
      schedule/
        edit-week/
    entities/
      event/{api.ts,model.ts,index.ts}
      booking/{api.ts,model.ts,index.ts}
      slot/{api.ts,model.ts,index.ts}
      schedule/{api.ts,model.ts,index.ts}
    shared/
      api/
        schema.ts          # СГЕНЕРИРОВАН из openapi.yaml
        client.ts          # createClient<paths>({ baseUrl })
        index.ts
      lib/
        time/              # dayjs init, локальная↔UTC helpers
        clipboard/
      config/
        routes.ts
        env.ts             # VITE_API_BASE_URL и пр.
      ui/                  # тонкие обёртки только если потребуется
```

Зависимости направлены строго `app → pages → widgets → features → entities → shared` (как в `services/front/CLAUDE.md`). Каждый слайс публикует API через `index.ts`.

## Ключевые модули и контракты

**`shared/api/client.ts`** — экспорт `api = createClient<paths>({ baseUrl: env.API_BASE_URL })`. Все DAL-функции в `entities/*/api.ts` зовут `api.GET`/`api.POST` и возвращают `data`/кидают типизированную ошибку.

**`shared/lib/time`** — единственное место, где живут конвертации:

- `localBlocksToUtc(blocks, tz)` / `utcBlocksToLocal(blocks, tz)` для расписания.
- `formatSlot(iso, tz)` для отображения слотов.
- `toDateParam(date, tz)` → `YYYY-MM-DD` для query `?date=`.

**`widgets/slot-picker`** — принимает `slug`, дёргает `getEvent` + `getSlots(slug, date)`. Внутри Mantine `Calendar` + список таймов.

**`widgets/week-schedule-editor`** — управляемый компонент, держит локальное состояние недели (`Record<weekday, {enabled, blocks}>`); коммит — `onSave(localWeek)` → конвертация в UTC → `PUT /schedule`.

**`features/event-types/toggle-active`** — мутация `PATCH /events/{slug}` с optimistic update в `['events']` через TanStack Query.

**`features/bookings/cancel-booking-public`** — читает `id` и `cancelToken` из URL, кнопка → `DELETE /public/bookings/{id}?cancelToken=…`. Обрабатывает 403/404 как «ссылка уже использована или брони нет».

## Кодогенерация

В `services/front/package.json` — скрипт `gen:api`:

```
openapi-typescript ../../api/generated/openapi.yaml -o src/shared/api/schema.ts
```

Запускать вручную при изменении контракта; добавим в `make api-front` и в `dev-front` как pre-step (сравнить mtime, перегенерить при изменении).

## Конфигурация Mantine

В `app/providers.tsx`:

- `MantineProvider` (без кастомной темы на старте).
- `DatesProvider` с `locale: 'ru'` и `timezone` по умолчанию из браузера.
- `Notifications` для тостов после мутаций.

## Тесты

Только юнит-тесты на старте (e2e уже под отдельную папку `/e2e`):

- `shared/lib/time` — конвертации между UTC и локальной TZ.
- `entities/*/api.ts` — мокаем `fetch`, проверяем что вызывается правильный путь/метод.
- `features/*` — поведение мутаций (RTL + MSW или замокать `api`-объект).
- `widgets/week-schedule-editor` — добавление/удаление блоков, валидация overlap.

Запуск: `make test-u-front` (vitest run); `make test-u` агрегирует.

## Makefile

Дополнить корневой `Makefile` (сейчас есть только `dc`/`dcr`):

```
dev-front:
	npm --workspace=services/front run dev

dev-front-mock:
	npx -y -p '@stoplight/prism-cli' prism mock api/generated/openapi.yaml -p 3000 & \
	npm --workspace=services/front run dev; \
	kill %1

dev: dev-front-mock   # пока бэка нет; когда появится — переопределим на параллельный run

test-u-front:
	npm --workspace=services/front run test

test-u:
	$(MAKE) test-u-front

api-front:
	npm --workspace=services/front run gen:api
```

(`test`, `test-i`, `test-e` уже упоминаются в корневом `CLAUDE.md` — оставим заглушки/no-op для front, e2e живут в `/e2e`).

## Критичные файлы

Создать:

- `services/front/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`.
- `src/app/{App,providers,router}.tsx`.
- Все страницы под `src/pages/{public,admin}/*`.
- Виджеты `src/widgets/{admin-shell,slot-picker,week-schedule-editor}`.
- Фичи `src/features/{event-types,bookings,schedule}/*`.
- Entities `src/entities/{event,booking,slot,schedule}/*`.
- Shared: `src/shared/{api,lib/time,lib/clipboard,config}/*`.
- `src/shared/api/schema.ts` (codegen, коммитим в репо).

Изменить:

- `Makefile` (см. выше).

Не трогаем: `api/`, `services/back/`, `e2e/`, `config/`.

## Верификация

1. `make api-front` — типы из контракта генерируются без ошибок.
2. `make dev-front-mock`:
   - prism слушает на `:3000`, отвечает по контракту;
   - vite раздаёт SPA на `:8080`.
3. Публичный flow:
   - `http://localhost:8080/` — список активных событий.
   - Клик по карточке → `/{slug}`, виден календарь с 14 днями вперёд, при выборе даты — слоты.
   - Выбор слота → форма → submit → success-страница, видна копируемая cancel-ссылка.
   - Открыть скопированную ссылку в новой вкладке → подтвердить отмену → 204, успех.
4. Админ flow:
   - `/admin/event-types` — список из мока, тоггл active срабатывает.
   - «New» → модалка → создание видно в списке.
   - Edit → сохранение Basics.
   - `/admin/bookings` — список предстоящих, отмена убирает запись.
   - `/admin/availability` — изменение блоков сохраняется (проверить, что в payload отправляются HH:MM UTC).
5. `make test-u-front` — все юнит-тесты проходят.
6. Перезапуск против реального бэка (когда он будет): задать `VITE_API_BASE_URL=http://localhost:3000`, повторить шаги 3–4.
