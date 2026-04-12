/**
 * E2E тесты для страницы бронирования и выбора слотов
 * @see /workspace/docs/superpowers/specs/2026-04-11-admin-events-design.md
 */

import { test, expect } from '../fixtures/test-fixtures';
import { EventBookingPage, BookingFormPage, PublicEventsListPage } from '../helpers/page-objects';
import { createApiClient } from '../helpers/api-client';
import { 
  adminCredentials,
  generateUniqueSlug,
  getTestDate,
  fullWeeklySchedule,
  sampleGuests,
  defaultWeeklySchedule,
} from '../fixtures/test-data';
import type { Event, BookingCreatedResponse } from '../fixtures/types';

test.describe('Event Booking Page', () => {
  let createdEvents: Event[] = [];
  let createdBookings: BookingCreatedResponse[] = [];
  let apiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    createdEvents = [];
    createdBookings = [];
    
    // Восстанавливаем дефолтное расписание
    await apiClient.updateSchedule(fullWeeklySchedule);
  });

  test.afterEach(async () => {
    // Отменяем созданные бронирования
    for (const booking of createdBookings) {
      try {
        await apiClient.cancelBookingAsGuest(booking.id, booking.cancelToken);
      } catch {
        // Игнорируем ошибки при очистке
      }
    }
    
    // Удаляем созданные события
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки при очистке
      }
    }
  });

  test('должна загружаться и отображать календарь', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Calendar Test Event',
      description: 'Test event for calendar',
      duration: 30,
      slug: generateUniqueSlug('calendar-test'),
    });
    createdEvents.push(event);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);
    
    await bookingPage.expectLoaded();
    await expect(bookingPage.calendar).toBeVisible();
  });

  test('должна отображать доступные слоты при выборе даты', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Slots Test Event',
      description: 'Test event for slots',
      duration: 30,
      slug: generateUniqueSlug('slots-test'),
    });
    createdEvents.push(event);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);

    // Выбираем завтрашнюю дату
    const tomorrow = getTestDate(1);
    await bookingPage.selectDate(tomorrow);

    // Проверяем, что слоты отображаются
    await expect(bookingPage.timeSlots.first()).toBeVisible();
    
    // Проверяем, что есть хотя бы один слот
    const slots = await bookingPage.getAvailableSlots();
    expect(slots.length).toBeGreaterThan(0);
  });

  test('должна отображать сообщение когда нет доступных слотов', async ({ page }) => {
    // Создаём событие с выходным днём (суббота)
    const event = await apiClient.createEvent({
      title: 'No Slots Test',
      description: 'Test for no slots',
      duration: 30,
      slug: generateUniqueSlug('no-slots-test'),
    });
    createdEvents.push(event);

    // Устанавливаем расписание без выходных
    const weekendSchedule = {
      weekdays: {
        ...fullWeeklySchedule.weekdays,
        saturday: { enabled: false, blocks: [] },
        sunday: { enabled: false, blocks: [] },
      },
    };
    await apiClient.updateSchedule(weekendSchedule);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);

    // Получаем следующую субботу
    const date = new Date();
    const day = date.getDay();
    const diff = 6 - day;
    date.setDate(date.getDate() + diff);
    const saturday = date.toISOString().split('T')[0];

    await bookingPage.selectDate(saturday);

    // Проверяем сообщение об отсутствии слотов
    await bookingPage.expectNoSlotsAvailable();
  });

  test('должна позволять выбрать слот и перейти к форме бронирования', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Slot Selection Test',
      description: 'Test slot selection',
      duration: 30,
      slug: generateUniqueSlug('slot-select-test'),
    });
    createdEvents.push(event);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);

    const tomorrow = getTestDate(1);
    await bookingPage.selectDate(tomorrow);
    await bookingPage.selectTimeSlot('09:00');

    // Проверяем переход на форму бронирования
    await expect(page).toHaveURL(new RegExp(`/e/${event.slug}/book`));
    
    const formPage = new BookingFormPage(page);
    await formPage.expectLoaded();
  });

  test('должна блокировать выбор прошедших дат', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Past Date Test',
      description: 'Test past date blocking',
      duration: 30,
      slug: generateUniqueSlug('past-date-test'),
    });
    createdEvents.push(event);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);

    // Проверяем, что вчерашняя дата недоступна
    const yesterday = getTestDate(-1);
    const yesterdayCell = page.locator(`[data-date="${yesterday}"]`);
    
    // Вчерашняя дата должна быть disabled
    await expect(yesterdayCell).toHaveAttribute(/disabled|aria-disabled/, /.*/);
  });

  test('должна блокировать выбор дат вне 14-дневного окна', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Future Date Test',
      description: 'Test future date blocking',
      duration: 30,
      slug: generateUniqueSlug('future-date-test'),
    });
    createdEvents.push(event);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);

    // Проверяем, что дата через 15 дней недоступна
    const farFuture = getTestDate(15);
    const futureCell = page.locator(`[data-date="${farFuture}"]`);
    
    // Дата вне окна должна быть disabled
    await expect(futureCell).toHaveAttribute(/disabled|aria-disabled/, /.*/);
  });

  test('должна отображать информацию о событии', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Event Info Display Test',
      description: 'Detailed description of the event',
      duration: 60,
      slug: generateUniqueSlug('info-test'),
    });
    createdEvents.push(event);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);

    // Проверяем отображение информации о событии
    await expect(page.locator(`text=${event.title}`)).toBeVisible();
    await expect(page.locator(`text=${event.description}`)).toBeVisible();
    await expect(page.locator(`text=${event.duration}`)).toBeVisible();
  });

  test('должна обновлять слоты при смене даты', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Date Change Test',
      description: 'Test date change',
      duration: 30,
      slug: generateUniqueSlug('date-change-test'),
    });
    createdEvents.push(event);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);

    const tomorrow = getTestDate(1);
    const dayAfter = getTestDate(2);

    // Выбираем первую дату
    await bookingPage.selectDate(tomorrow);
    await expect(bookingPage.timeSlots.first()).toBeVisible();

    // Выбираем вторую дату
    await bookingPage.selectDate(dayAfter);
    await expect(bookingPage.timeSlots.first()).toBeVisible();
  });

  test('должна обрабатывать ошибку загрузки слотов', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Slots Error Test',
      description: 'Test slots error',
      duration: 30,
      slug: generateUniqueSlug('slots-error-test'),
    });
    createdEvents.push(event);

    // Блокируем запросы к slots endpoint
    await page.route('**/api/v1/public/events/*/slots**', route => route.abort());

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);

    const tomorrow = getTestDate(1);
    await bookingPage.selectDate(tomorrow);

    // Проверяем отображение ошибки
    await expect(
      page.locator('text=Не удалось загрузить, text=Failed to load, text=ошибка')
    ).toBeVisible();
  });

  test('должна отображать занятые слоты как недоступные', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Booked Slot Test',
      description: 'Test booked slot display',
      duration: 30,
      slug: generateUniqueSlug('booked-slot-test'),
    });
    createdEvents.push(event);

    // Создаём бронирование на завтра в 9:00
    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0],
    });
    createdBookings.push(booking);

    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);
    await bookingPage.selectDate(tomorrow);

    // Проверяем, что 9:00 отмечен как недоступный
    const slot9am = page.locator('[data-time="09:00"], button:has-text("09:00")');
    await expect(slot9am).toHaveAttribute(/disabled|aria-disabled/, /.*/);
  });
});
