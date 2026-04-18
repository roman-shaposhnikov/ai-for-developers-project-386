/**
 * End-to-End integration tests for complete user flows
 */

import { test, expect } from '../fixtures/test-fixtures';
import { 
  BookingFormPage, 
  BookingSuccessPage,
  EventBookingPage, 
  EventCreatePage,
  PublicEventsListPage, 
} from '../helpers/page-objects';
import { createApiClient } from '../helpers/api-client';
import { 
  adminCredentials,
  generateUniqueSlug,
  getTestDate,
  fullWeeklySchedule,
} from '../fixtures/test-data';
import type { Event, BookingCreatedResponse } from '../fixtures/types';

test.describe('Complete User Flows', () => {
  let createdEvents: Event[] = [];
  let createdBookings: BookingCreatedResponse[] = [];
  let apiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    createdEvents = [];
    createdBookings = [];
    await apiClient.updateSchedule(fullWeeklySchedule);
  });

  test.afterEach(async () => {
    for (const booking of createdBookings) {
      try {
        await apiClient.cancelBookingAsGuest(booking.id, booking.cancelToken);
      } catch {
        // Ignore errors
      }
    }
    
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Ignore errors
      }
    }
  });

  test('полный flow: создание события админом и бронирование гостем', async ({ page }) => {
    // === АДМИН: Создание события ===
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    const createPage = new EventCreatePage(page);
    await createPage.goto();

    const eventSlug = generateUniqueSlug('integration-test');
    await createPage.fillForm({
      title: 'Integration Test Event',
      slug: eventSlug,
      duration: 30,
      description: 'Event created for integration testing',
      active: true,
    });
    await createPage.submit();

    // Проверяем создание события
    await expect(page).toHaveURL(/\/admin\/events/);
    
    const event = await apiClient.getEvent(eventSlug);
    createdEvents.push(event);
    expect(event.title).toBe('Integration Test Event');

    // === ГОСТЬ: Просмотр и бронирование ===
    // Убираем заголовки авторизации для гостевых запросов
    await page.setExtraHTTPHeaders({});

    const publicPage = new PublicEventsListPage(page);
    await publicPage.goto();
    await publicPage.expectEventVisible(eventSlug);

    // Переходим к бронированию
    await publicPage.clickBookButton(eventSlug);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.expectLoaded();

    // Выбираем дату и время
    const tomorrow = getTestDate(1);
    await bookingPage.selectDate(tomorrow);
    await bookingPage.selectTimeSlot('09:00');

    // Заполняем форму бронирования
    const formPage = new BookingFormPage(page);
    await formPage.expectLoaded();
    await formPage.fillGuestInfo({
      name: 'Integration Test Guest',
      email: 'integration@test.com',
      notes: 'Testing the full flow',
    });
    await formPage.submit();

    // Проверяем подтверждение
    const successPage = new BookingSuccessPage(page);
    await successPage.expectLoaded();
    await successPage.expectBookingDetailsVisible('Integration Test Guest', event.title);
  });

  test('полный flow: админ управляет бронированиями', async ({ page }) => {
    // Создаём событие и бронирование через API
    const event = await apiClient.createEvent({
      title: 'Admin Management Test',
      description: 'Testing admin booking management',
      duration: 30,
      slug: generateUniqueSlug('admin-manage'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: {
        name: 'Guest to Manage',
        email: 'manage@test.com',
      },
    });
    createdBookings.push(booking);

    // === АДМИН: Просмотр бронирований ===
    await page.setExtraHTTPHeaders({
      'Authorization': `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString('base64')}`,
    });

    // Открываем страницу бронирований (предполагается существование такой страницы)
    await page.goto('/admin/bookings');
    
    // Проверяем, что бронирование отображается
    await expect(page.locator(`text=${booking.guest.name}`)).toBeVisible();
    await expect(page.locator(`text=${event.title}`)).toBeVisible();

    // === АДМИН: Отмена бронирования ===
    const cancelButton = page.locator(`[data-booking-id="${booking.id}"] button:has-text("Cancel")`);
    if (await cancelButton.isVisible().catch(() => false)) {
      page.on('dialog', dialog => dialog.accept());
      await cancelButton.click();
      
      // Проверяем, что бронирование отменено
      await expect(page.locator(`text=${booking.guest.name}`)).not.toBeVisible();
    }
  });

  test('полный flow: гость отменяет своё бронирование', async ({ page }) => {
    // Создаём событие и бронирование через API
    const event = await apiClient.createEvent({
      title: 'Guest Cancellation Test',
      description: 'Testing guest cancellation flow',
      duration: 30,
      slug: generateUniqueSlug('guest-cancel'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: {
        name: 'Self-Cancelling Guest',
        email: 'selfcancel@test.com',
      },
    });
    createdBookings.push(booking);

    // === ГОСТЬ: Открываем страницу подтверждения ===
    await page.goto(`/bookings/${booking.id}/success?token=${booking.cancelToken}`);

    const successPage = new BookingSuccessPage(page);
    await successPage.expectLoaded();

    // Отменяем бронирование
    page.on('dialog', dialog => dialog.accept());
    await successPage.cancelBooking();

    // Проверяем подтверждение отмены
    await successPage.expectCancellationSuccess();

    // Убираем из списка для очистки (уже отменено)
    createdBookings = createdBookings.filter(b => b.id !== booking.id);
  });

  test('полный flow: проверка конфликтов бронирований', async ({ page }) => {
    // Создаём событие
    const event = await apiClient.createEvent({
      title: 'Conflict Test Event',
      description: 'Testing booking conflicts',
      duration: 30,
      slug: generateUniqueSlug('conflict-test'),
    });
    createdEvents.push(event);

    // Создаём первое бронирование
    const tomorrow = getTestDate(1);
    const booking1 = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: {
        name: 'First Booker',
        email: 'first@test.com',
      },
    });
    createdBookings.push(booking1);

    // === ГОСТЬ: Пытаемся забронировать то же время ===
    const publicPage = new PublicEventsListPage(page);
    await publicPage.goto();
    await publicPage.clickBookButton(event.slug);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.selectDate(tomorrow);

    // Проверяем, что слот 09:00 недоступен
    const slot9am = page.locator('[data-time="09:00"]');
    await expect(slot9am).toHaveAttribute('disabled');

    // Пытаемся забронировать через прямой переход (обход UI)
    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, `${tomorrow}T09:00:00Z`);
    await formPage.fillGuestInfo({
      name: 'Second Booker',
      email: 'second@test.com',
    });
    await formPage.submit();

    // Проверяем сообщение о конфликте
    await expect(
      page.locator('text=забронировали, text=уже занят, text=недоступен')
    ).toBeVisible();
  });
});
