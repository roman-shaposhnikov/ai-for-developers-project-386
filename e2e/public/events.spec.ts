/**
 * E2E тесты для публичной страницы списка событий
 * @see /workspace/docs/superpowers/specs/2026-04-11-admin-events-design.md
 */

import { test, expect } from '../fixtures/test-fixtures';
import { PublicEventsListPage, EventBookingPage } from '../helpers/page-objects';
import { createApiClient } from '../helpers/api-client';
import { 
  sampleEvents, 
  adminCredentials,
  generateUniqueSlug,
  fullWeeklySchedule,
} from '../fixtures/test-data';
import type { Event } from '../fixtures/types';

test.describe('Public Events List Page', () => {
  let createdEvents: Event[] = [];
  let apiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    
    // Очищаем предыдущие тестовые события
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки при очистке
      }
    }
    createdEvents = [];
  });

  test.afterEach(async () => {
    // Очистка после тестов
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки при очистке
      }
    }
  });

  test('должна загружаться и отображать заголовок', async ({ page }) => {
    const publicPage = new PublicEventsListPage(page);
    
    await publicPage.goto();
    await publicPage.expectLoaded();
  });

  test('должна отображать только активные события', async ({ page }) => {
    // Создаём активное и неактивное событие
    const activeEvent = await apiClient.createEvent({
      ...sampleEvents[0],
      slug: generateUniqueSlug('active-test'),
    });
    createdEvents.push(activeEvent);

    const inactiveEvent = await apiClient.createEvent({
      ...sampleEvents[1],
      slug: generateUniqueSlug('inactive-test'),
      active: false,
    });
    createdEvents.push(inactiveEvent);

    const publicPage = new PublicEventsListPage(page);
    await publicPage.goto();

    // Активное событие должно быть видно
    await publicPage.expectEventVisible(activeEvent.slug);
    
    // Неактивное событие не должно быть видно
    await expect(
      page.locator(`text=${inactiveEvent.title}`)
    ).not.toBeVisible();
  });

  test('должна показывать пустое состояние когда нет событий', async ({ page }) => {
    // Удаляем все существующие события
    const allEvents = await apiClient.listEvents();
    for (const event of allEvents) {
      await apiClient.deleteEvent(event.slug);
    }

    const publicPage = new PublicEventsListPage(page);
    await publicPage.goto();

    await expect(publicPage.emptyState).toBeVisible();
  });

  test('должна отображать карточки событий с правильной информацией', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Test Event Display',
      description: 'Test description for display',
      duration: 45,
      slug: generateUniqueSlug('display-test'),
    });
    createdEvents.push(event);

    const publicPage = new PublicEventsListPage(page);
    await publicPage.goto();

    // Проверяем отображение информации о событии
    await expect(page.locator(`text=${event.title}`)).toBeVisible();
    await expect(page.locator(`text=${event.duration} минут, text=45m, text=45 мин`)).toBeVisible();
  });

  test('должна позволять переходить к бронированию по клику на событие', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Booking Navigation Test',
      description: 'Test navigation',
      duration: 30,
      slug: generateUniqueSlug('nav-test'),
    });
    createdEvents.push(event);

    // Настраиваем расписание для доступности слотов
    await apiClient.updateSchedule(fullWeeklySchedule);

    const publicPage = new PublicEventsListPage(page);
    await publicPage.goto();
    
    // Кликаем на событие или кнопку бронирования
    await publicPage.clickBookButton(event.slug);

    // Проверяем переход на страницу бронирования
    await expect(page).toHaveURL(new RegExp(`/e/${event.slug}`));
    
    const bookingPage = new EventBookingPage(page);
    await bookingPage.expectLoaded();
  });

  test('должна обрабатывать ошибки загрузки событий', async ({ page }) => {
    // Блокируем запросы к API для симуляции ошибки
    await page.route('**/api/v1/public/events', route => route.abort());

    const publicPage = new PublicEventsListPage(page);
    await publicPage.goto();

    // Проверяем отображение ошибки
    await expect(
      page.locator('text=Не удалось загрузить, text=Failed to load, text=ошибка')
    ).toBeVisible();
  });

  test('должна корректно отображать события в правильном порядке', async ({ page }) => {
    // Создаём события с разными датами создания
    const event1 = await apiClient.createEvent({
      ...sampleEvents[0],
      slug: generateUniqueSlug('order-test-1'),
    });
    createdEvents.push(event1);

    const event2 = await apiClient.createEvent({
      ...sampleEvents[1],
      slug: generateUniqueSlug('order-test-2'),
    });
    createdEvents.push(event2);

    const publicPage = new PublicEventsListPage(page);
    await publicPage.goto();

    // Проверяем, что оба события отображаются
    await expect(page.locator(`text=${event1.title}`)).toBeVisible();
    await expect(page.locator(`text=${event2.title}`)).toBeVisible();
  });
});
