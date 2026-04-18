/**
 * E2E тесты для admin панели управления событиями
 * @see /workspace/docs/superpowers/specs/2026-04-11-admin-events-design.md
 */

import { expect, test } from '../fixtures/test-fixtures';
import type { Event } from '../fixtures/types';
import {
  adminCredentials,
  fullWeeklySchedule,
  generateUniqueSlug,
  sampleEvents,
} from '../fixtures/test-data';
import { createApiClient } from '../helpers/api-client';
import { AdminEventsListPage, EventCreatePage, EventEditPage } from '../helpers/page-objects';

test.describe('Admin Events List Page', () => {
  let createdEvents: Event[] = [];
  let apiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    createdEvents = [];
  });

  test.afterEach(async () => {
    // Очистка созданных событий
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки при очистке
      }
    }
  });

  test('должна требовать аутентификации', async ({ page }) => {
    await page.goto('/admin/events');
    
    // Проверяем, что показан диалог авторизации или редирект
    await expect(
      page.locator('text=Authentication, text=Authorization, input[type="password"]')
    ).toBeVisible();
  });

  test('должна загружаться после авторизации', async ({ page }) => {
    // Настраиваем авторизацию через HTTP Basic Auth
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const adminPage = new AdminEventsListPage(page);
    await adminPage.goto();
    await adminPage.expectLoaded();
  });

  test('должна отображать список всех событий включая неактивные', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    // Создаём активное и неактивное событие
    const activeEvent = await apiClient.createEvent({
      ...sampleEvents[0]!,
      slug: generateUniqueSlug('admin-active'),
    });
    createdEvents.push(activeEvent);

    const inactiveEvent = await apiClient.createEvent({
      ...sampleEvents[1]!,
      slug: generateUniqueSlug('admin-inactive'),
      active: false,
    });
    createdEvents.push(inactiveEvent);

    const adminPage = new AdminEventsListPage(page);
    await adminPage.goto();

    // Оба события должны быть видны в админке
    await adminPage.expectEventVisible(activeEvent.slug);
    await adminPage.expectEventVisible(inactiveEvent.slug);
  });

  test('должна позволять переходить к созданию нового события', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const adminPage = new AdminEventsListPage(page);
    await adminPage.goto();
    await adminPage.clickNewEvent();

    // Проверяем переход на страницу создания
    await expect(page).toHaveURL(/\/admin\/events\/new/);
  });

  test('должна позволять переходить к редактированию события', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const event = await apiClient.createEvent({
      ...sampleEvents[0]!,
      slug: generateUniqueSlug('admin-edit-nav'),
    });
    createdEvents.push(event);

    const adminPage = new AdminEventsListPage(page);
    await adminPage.goto();
    await adminPage.clickEditEvent(event.slug);

    // Проверяем переход на страницу редактирования
    await expect(page).toHaveURL(new RegExp(`/admin/events/${event.slug}/edit`));
  });

  test('должна показывать пустое состояние когда нет событий', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    // Удаляем все события
    const allEvents = await apiClient.listEvents();
    for (const event of allEvents) {
      await apiClient.deleteEvent(event.slug);
    }

    const adminPage = new AdminEventsListPage(page);
    await adminPage.goto();

    await expect(adminPage.emptyState).toBeVisible();
  });

  test('должна сортировать события по дате создания (новые сначала)', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    // Создаём события последовательно
    const event1 = await apiClient.createEvent({
      title: 'First Event',
      description: 'First',
      duration: 30,
      slug: generateUniqueSlug('admin-order-1'),
    });
    createdEvents.push(event1);

    await page.waitForTimeout(100); // Небольшая задержка

    const event2 = await apiClient.createEvent({
      title: 'Second Event',
      description: 'Second',
      duration: 30,
      slug: generateUniqueSlug('admin-order-2'),
    });
    createdEvents.push(event2);

    const adminPage = new AdminEventsListPage(page);
    await adminPage.goto();

    // Проверяем, что оба события отображаются
    await adminPage.expectEventVisible(event1.slug);
    await adminPage.expectEventVisible(event2.slug);
  });
});

test.describe('Event Create Page', () => {
  let createdEvents: Event[] = [];
  let apiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    createdEvents = [];
  });

  test.afterEach(async () => {
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки
      }
    }
  });

  test('должна загружаться с правильными полями', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();
    await createPage.expectLoaded();

    // Проверяем наличие всех полей
    await expect(createPage.titleInput).toBeVisible();
    await expect(createPage.slugInput).toBeVisible();
    await expect(createPage.durationInput).toBeVisible();
    await expect(createPage.descriptionInput).toBeVisible();
  });

  test('должна позволять создать событие с валидными данными', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    const uniqueSlug = generateUniqueSlug('create-test');
    await createPage.fillForm({
      title: 'New Test Event',
      slug: uniqueSlug,
      duration: 45,
      description: 'Test event description',
      active: true,
    });

    await createPage.submit();

    // Проверяем редирект на список событий
    await expect(page).toHaveURL(/\/admin\/events/);
    
    // Проверяем, что событие создано
    const events = await apiClient.listEvents();
    const createdEvent = events.find(e => e.slug === uniqueSlug);
    expect(createdEvent).toBeDefined();
    if (createdEvent) {
      createdEvents.push(createdEvent);
    }
  });

  test('должна валидировать обязательные поля', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    // Пытаемся отправить пустую форму
    await createPage.submit();

    // Проверяем ошибки валидации
    await expect(page.locator('text=обязательно, text=required')).toBeVisible();
  });

  test('должна валидировать slug формат', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    await createPage.fillForm({
      title: 'Invalid Slug Test',
      slug: '123-invalid-slug',
      duration: 30,
      description: 'Test description',
    });

    await createPage.submit();

    // Проверяем ошибку валидации slug
    await expect(page.locator('text=slug, text=неверный формат')).toBeVisible();
  });

  test('должна показывать ошибку при дублировании slug', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    // Создаём событие с определенным slug
    const existingSlug = generateUniqueSlug('duplicate-test');
    const existingEvent = await apiClient.createEvent({
      title: 'Existing Event',
      description: 'Existing',
      duration: 30,
      slug: existingSlug,
    });
    createdEvents.push(existingEvent);

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    await createPage.fillForm({
      title: 'Duplicate Slug Event',
      slug: existingSlug,
      duration: 30,
      description: 'Test description',
    });

    await createPage.submit();

    // Проверяем ошибку дублирования
    await createPage.expectSlugValidationError();
  });

  test('должна авто-генерировать slug из title', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    // Заполняем только title
    await createPage.titleInput.fill('My New Event Title');
    
    // Уходим из поля (blur)
    await createPage.descriptionInput.focus();

    // Проверяем, что slug сгенерирован
    const slugValue = await createPage.slugInput.inputValue();
    expect(slugValue).toBe('my-new-event-title');
  });

  test('должна авто-генерировать slug с транслитерацией кириллицы', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    // Заполняем title на русском
    await createPage.titleInput.fill('Встреча на 30 минут');
    await createPage.descriptionInput.focus();

    // Проверяем транслитерацию
    const slugValue = await createPage.slugInput.inputValue();
    expect(slugValue).toBe('vstrecha-na-30-minut');
  });

  test('должна позволять отменить создание', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    await createPage.fillForm({
      title: 'Cancelled Event',
      slug: generateUniqueSlug('cancelled'),
      duration: 30,
      description: 'This will be cancelled',
    });

    await createPage.cancel();

    // Проверяем возврат на список
    await expect(page).toHaveURL(/\/admin\/events/);
  });

  test('должна валидировать длительность события', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    await createPage.fillForm({
      title: 'Invalid Duration Test',
      slug: generateUniqueSlug('invalid-duration'),
      duration: 3, // Слишком маленькая длительность
      description: 'Test description',
    });

    await createPage.submit();

    // Проверяем ошибку валидации
    await expect(page.locator('text=5, text=480, text=длительность')).toBeVisible();
  });
});

test.describe('Event Edit Page', () => {
  let createdEvents: Event[] = [];
  let apiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    createdEvents = [];
  });

  test.afterEach(async () => {
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки
      }
    }
  });

  test('должна загружаться с данными события', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const event = await apiClient.createEvent({
      title: 'Edit Page Load Test',
      description: 'Test loading edit page',
      duration: 30,
      slug: generateUniqueSlug('edit-load-test'),
    });
    createdEvents.push(event);

    const editPage = new EventEditPage(page);
    await editPage.goto(event.slug);
    await editPage.expectLoaded();

    // Проверяем, что поля заполнены данными события
    const titleValue = await editPage.titleInput.inputValue();
    expect(titleValue).toBe(event.title);

    const slugValue = await editPage.slugInput.inputValue();
    expect(slugValue).toBe(event.slug);
  });

  test('должна блокировать редактирование slug', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const event = await apiClient.createEvent({
      title: 'Immutable Slug Test',
      description: 'Test immutable slug',
      duration: 30,
      slug: generateUniqueSlug('immutable-slug'),
    });
    createdEvents.push(event);

    const editPage = new EventEditPage(page);
    await editPage.goto(event.slug);
    await editPage.expectSlugDisabled();
  });

  test('должна позволять обновить title', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const event = await apiClient.createEvent({
      title: 'Original Title',
      description: 'Test update',
      duration: 30,
      slug: generateUniqueSlug('update-title-test'),
    });
    createdEvents.push(event);

    const editPage = new EventEditPage(page);
    await editPage.goto(event.slug);
    
    await editPage.updateTitle('Updated Title');
    await editPage.save();

    // Проверяем обновление через API
    const updatedEvent = await apiClient.getEvent(event.slug);
    expect(updatedEvent.title).toBe('Updated Title');
  });

  test('должна позволять обновить длительность', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const event = await apiClient.createEvent({
      title: 'Duration Update Test',
      description: 'Test duration update',
      duration: 30,
      slug: generateUniqueSlug('update-duration-test'),
    });
    createdEvents.push(event);

    const editPage = new EventEditPage(page);
    await editPage.goto(event.slug);
    
    await editPage.updateDuration(60);
    await editPage.save();

    const updatedEvent = await apiClient.getEvent(event.slug);
    expect(updatedEvent.duration).toBe(60);
  });

  test('должна позволять переключать статус active/inactive', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const event = await apiClient.createEvent({
      title: 'Active Toggle Test',
      description: 'Test active toggle',
      duration: 30,
      slug: generateUniqueSlug('active-toggle-test'),
      active: true,
    });
    createdEvents.push(event);

    const editPage = new EventEditPage(page);
    await editPage.goto(event.slug);
    
    await editPage.toggleActive();
    await editPage.save();

    const updatedEvent = await apiClient.getEvent(event.slug);
    expect(updatedEvent.active).toBe(false);
  });

  test('должна позволять удалить событие без бронирований', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const event = await apiClient.createEvent({
      title: 'Delete Test',
      description: 'Test deletion',
      duration: 30,
      slug: generateUniqueSlug('delete-test'),
    });
    createdEvents.push(event);

    const editPage = new EventEditPage(page);
    await editPage.goto(event.slug);
    
    // Обрабатываем диалог подтверждения
    page.on('dialog', dialog => dialog.accept());
    
    await editPage.delete();

    // Проверяем редирект на список
    await expect(page).toHaveURL(/\/admin\/events/);

    // Проверяем, что событие удалено
    const events = await apiClient.listEvents();
    const deletedEvent = events.find(e => e.slug === event.slug);
    expect(deletedEvent).toBeUndefined();
    
    // Удаляем из списка для очистки
    createdEvents = createdEvents.filter(e => e.slug !== event.slug);
  });

  test('должна блокировать удаление события с активными бронированиями', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const event = await apiClient.createEvent({
      title: 'Protected Delete Test',
      description: 'Test protected deletion',
      duration: 30,
      slug: generateUniqueSlug('protected-delete'),
    });
    createdEvents.push(event);

    // Настраиваем расписание и создаём бронирование
    await apiClient.updateSchedule(fullWeeklySchedule);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${dateStr}T09:00:00Z`,
      guest: {
        name: 'Test Guest',
        email: 'test@example.com',
      },
    });

    const editPage = new EventEditPage(page);
    await editPage.goto(event.slug);
    
    // Обрабатываем диалог подтверждения
    page.on('dialog', dialog => dialog.accept());
    
    await editPage.delete();

    // Проверяем сообщение о блокировке
    await editPage.expectDeleteBlockedError();

    // Очищаем бронирование
    await apiClient.cancelBookingAsGuest(booking.id, booking.cancelToken);
  });

  test('должна показывать 404 для несуществующего события', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const editPage = new EventEditPage(page);
    await editPage.goto('non-existent-slug-12345');

    // Проверяем 404 страницу
    await expect(page.locator('text=404, text=Not Found, text=не найдено')).toBeVisible();
  });
});
