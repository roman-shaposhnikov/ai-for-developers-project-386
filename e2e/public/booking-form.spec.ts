/**
 * E2E тесты для формы бронирования и страницы подтверждения
 * @see /workspace/docs/superpowers/specs/2026-04-11-admin-events-design.md
 */

import { expect, test } from '../fixtures/test-fixtures';
import type { BookingCreatedResponse, Event } from '../fixtures/types';
import {
  adminCredentials,
  fullWeeklySchedule,
  generateUniqueSlug,
  getTestDate,
  invalidGuestData,
  sampleGuests,
} from '../fixtures/test-data';
import { createApiClient } from '../helpers/api-client';
import { BookingFormPage, BookingSuccessPage } from '../helpers/page-objects';

test.describe('Booking Form Page', () => {
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
        // Игнорируем ошибки
      }
    }
    
    // Удаляем созданные события
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки
      }
    }
  });

  test('должна загружаться с выбранным временем', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Form Load Test',
      description: 'Test form loading',
      duration: 30,
      slug: generateUniqueSlug('form-load-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const slotTime = `${tomorrow}T09:00:00Z`;

    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, slotTime);
    
    await formPage.expectLoaded();
    await expect(formPage.selectedTimeCard).toBeVisible();
  });

  test('должна позволять создать бронирование с валидными данными', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Successful Booking Test',
      description: 'Test successful booking',
      duration: 30,
      slug: generateUniqueSlug('success-booking-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const slotTime = `${tomorrow}T09:00:00Z`;

    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, slotTime);
    
    await formPage.fillGuestInfo(sampleGuests[0]!);
    await formPage.submit();

    // Проверяем переход на страницу подтверждения
    const successPage = new BookingSuccessPage(page);
    await successPage.expectLoaded();
    await successPage.expectBookingDetailsVisible(sampleGuests[0]!.name, event.title);
  });

  test('должна валидировать обязательные поля', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Validation Test',
      description: 'Test validation',
      duration: 30,
      slug: generateUniqueSlug('validation-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const slotTime = `${tomorrow}T09:00:00Z`;

    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, slotTime);
    
    // Пытаемся отправить пустую форму
    await formPage.submit();

    // Проверяем ошибки валидации
    await formPage.expectValidationError('name');
    await formPage.expectValidationError('email');
  });

  test('должна валидировать формат email', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Email Validation Test',
      description: 'Test email validation',
      duration: 30,
      slug: generateUniqueSlug('email-validation-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const slotTime = `${tomorrow}T09:00:00Z`;

    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, slotTime);
    
    await formPage.fillGuestInfo({
      name: 'Test User',
      email: invalidGuestData.invalidEmail.email,
    });
    await formPage.submit();

    // Проверяем ошибку валидации email
    await formPage.expectValidationError('email');
  });

  test('должна валидировать длину имени', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Name Length Test',
      description: 'Test name length validation',
      duration: 30,
      slug: generateUniqueSlug('name-length-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const slotTime = `${tomorrow}T09:00:00Z`;

    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, slotTime);
    
    await formPage.fillGuestInfo({
      name: invalidGuestData.tooLongName.name,
      email: 'test@example.com',
    });
    await formPage.submit();

    // Проверяем ошибку валидации
    await expect(page.locator('text=100, text=слишком длинное')).toBeVisible();
  });

  test('должна позволять добавлять заметки (опционально)', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Notes Test',
      description: 'Test with notes',
      duration: 30,
      slug: generateUniqueSlug('notes-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const slotTime = `${tomorrow}T09:00:00Z`;

    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, slotTime);
    
    const guestWithNotes = {
      ...sampleGuests[0]!,
      notes: 'Тестовые заметки для бронирования',
    };
    
    await formPage.fillGuestInfo(guestWithNotes);
    await formPage.submit();

    // Проверяем успешное создание
    const successPage = new BookingSuccessPage(page);
    await successPage.expectLoaded();
  });

  test('должна обрабатывать ошибку когда слот уже занят', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Conflict Test',
      description: 'Test slot conflict',
      duration: 30,
      slug: generateUniqueSlug('conflict-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const slotTime = `${tomorrow}T09:00:00Z`;

    // Создаём бронирование через API
    const booking = await apiClient.createBooking(event.slug, {
      startTime: slotTime,
      guest: sampleGuests[1]!,
    });
    createdBookings.push(booking);

    // Пытаемся создать ещё одно бронирование на то же время
    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, slotTime);
    
    await formPage.fillGuestInfo(sampleGuests[2]!);
    await formPage.submit();

    // Проверяем сообщение о конфликте
    await expect(
      page.locator('text=забронировали, text=уже забронировано, text=SLOT_UNAVAILABLE')
    ).toBeVisible();
  });

  test('должна позволять вернуться к выбору времени', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Back Navigation Test',
      description: 'Test back navigation',
      duration: 30,
      slug: generateUniqueSlug('back-nav-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const slotTime = `${tomorrow}T09:00:00Z`;

    const formPage = new BookingFormPage(page);
    await formPage.goto(event.slug, slotTime);
    
    await formPage.backLink.click();

    // Проверяем возврат на страницу выбора времени
    await expect(page).toHaveURL(new RegExp(`/e/${event.slug}`));
  });
});

test.describe('Booking Success Page', () => {
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
        // Игнорируем ошибки
      }
    }
    
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки
      }
    }
  });

  test('должна отображать детали бронирования', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Success Page Test',
      description: 'Test success page',
      duration: 30,
      slug: generateUniqueSlug('success-page-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    await page.goto(`/bookings/${booking.id}/success?token=${booking.cancelToken}`);

    const successPage = new BookingSuccessPage(page);
    await successPage.expectLoaded();
    await successPage.expectBookingDetailsVisible(sampleGuests[0]!.name, event.title);
  });

  test('должна позволять отменить бронирование', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Cancellation Test',
      description: 'Test cancellation',
      duration: 30,
      slug: generateUniqueSlug('cancellation-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    await page.goto(`/bookings/${booking.id}/success?token=${booking.cancelToken}`);

    const successPage = new BookingSuccessPage(page);
    await successPage.cancelBooking();

    // Подтверждаем отмену в диалоге
    page.on('dialog', dialog => dialog.accept());

    await successPage.expectCancellationSuccess();
  });

  test('должна позволять копировать ссылку управления', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Copy Link Test',
      description: 'Test copy link',
      duration: 30,
      slug: generateUniqueSlug('copy-link-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    await page.goto(`/bookings/${booking.id}/success?token=${booking.cancelToken}`);

    const successPage = new BookingSuccessPage(page);
    await successPage.copyLinkButton.click();

    // Проверяем, что показано уведомление об успешном копировании
    await expect(
      page.locator('text=скопирована, text=copied')
    ).toBeVisible();
  });

  test('должна показывать ошибку при неверном токене', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Invalid Token Test',
      description: 'Test invalid token',
      duration: 30,
      slug: generateUniqueSlug('invalid-token-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    // Пытаемся открыть с неверным токеном
    await page.goto(`/bookings/${booking.id}/success?token=invalid-token`);

    // Проверяем сообщение об ошибке
    await expect(
      page.locator('text=неверный токен, text=invalid token, text=ошибка')
    ).toBeVisible();
  });

  test('должна позволять забронировать снова после отмены', async ({ page }) => {
    const event = await apiClient.createEvent({
      title: 'Book Again Test',
      description: 'Test book again',
      duration: 30,
      slug: generateUniqueSlug('book-again-test'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    await page.goto(`/bookings/${booking.id}/success?token=${booking.cancelToken}`);

    const successPage = new BookingSuccessPage(page);
    
    // Отменяем бронирование
    await successPage.cancelBooking();
    page.on('dialog', dialog => dialog.accept());
    await successPage.expectCancellationSuccess();

    // Проверяем наличие кнопки для нового бронирования
    await expect(successPage.bookAgainButton).toBeVisible();
  });
});
