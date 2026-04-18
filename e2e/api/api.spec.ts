/**
 * API Integration тесты
 * @see /workspace/docs/superpowers/specs/2026-04-11-booking-api-design.md
 */

import { expect, test } from '../fixtures/test-fixtures';
import type { BookingCreatedResponse, Event } from '../fixtures/types';
import {
  adminCredentials,
  fullWeeklySchedule,
  generateUniqueSlug,
  getTestDate,
  newEventData,
  sampleGuests,
} from '../fixtures/test-data';
import { createApiClient } from '../helpers/api-client';

test.describe('API Integration Tests', () => {
  let createdEvents: Event[] = [];
  let createdBookings: BookingCreatedResponse[] = [];
  let apiClient: ReturnType<typeof createApiClient>;
  let publicApiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    publicApiClient = createApiClient(request);
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

  test.describe('Public Events API', () => {
    test('должен возвращать только активные события', async () => {
      const activeEvent = await apiClient.createEvent({
        ...newEventData,
        slug: generateUniqueSlug('public-active'),
        active: true,
      });
      createdEvents.push(activeEvent);

      const inactiveEvent = await apiClient.createEvent({
        ...newEventData,
        title: 'Inactive',
        slug: generateUniqueSlug('public-inactive'),
        active: false,
      });
      createdEvents.push(inactiveEvent);

      const publicEvents = await publicApiClient.listPublicEvents();

      const foundActive = publicEvents.find(e => e.slug === activeEvent.slug);
      const foundInactive = publicEvents.find(e => e.slug === inactiveEvent.slug);

      expect(foundActive).toBeDefined();
      expect(foundInactive).toBeUndefined();
    });

    test('должен возвращать детали события по slug', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        slug: generateUniqueSlug('public-detail'),
      });
      createdEvents.push(event);

      const publicEvent = await publicApiClient.getPublicEvent(event.slug);

      expect(publicEvent.id).toBe(event.id);
      expect(publicEvent.title).toBe(event.title);
      expect(publicEvent.slug).toBe(event.slug);
    });

    test('должен возвращать 404 для неактивного события', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        slug: generateUniqueSlug('public-inactive-404'),
        active: false,
      });
      createdEvents.push(event);

      await expect(
        publicApiClient.getPublicEvent(event.slug)
      ).rejects.toThrow();
    });
  });

  test.describe('Slots API', () => {
    test('должен возвращать слоты для доступной даты', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('slots-test'),
      });
      createdEvents.push(event);

      const tomorrow = getTestDate(1);
      const slotsResponse = await publicApiClient.getSlots(event.slug, tomorrow);

      expect(slotsResponse).toBeDefined();
      expect(slotsResponse.date).toBe(tomorrow);
      expect(slotsResponse.eventSlug).toBe(event.slug);
      expect(slotsResponse.duration).toBe(event.duration);
      expect(Array.isArray(slotsResponse.slots)).toBe(true);
      expect(slotsResponse.slots.length).toBeGreaterThan(0);

      // Проверяем структуру слота
      const firstSlot = slotsResponse.slots[0]!;
      expect(firstSlot.startTime).toBeDefined();
      expect(firstSlot.endTime).toBeDefined();
    });

    test('должен возвращать пустые слоты для выходного дня', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('slots-weekend'),
      });
      createdEvents.push(event);

      // Устанавливаем расписание без субботы
      await apiClient.updateSchedule({
        weekdays: {
          ...fullWeeklySchedule.weekdays,
          saturday: { enabled: false, blocks: [] },
        },
      });

      // Получаем следующую субботу
      const date = new Date();
      const day = date.getDay();
      const diff = 6 - day;
      date.setDate(date.getDate() + diff);
      const saturday = date.toISOString().split('T')[0];

      const slotsResponse = await publicApiClient.getSlots(event.slug, saturday!);

      expect(slotsResponse.slots).toHaveLength(0);
    });

    test('должен возвращать 400 для даты вне 14-дневного окна', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('slots-range'),
      });
      createdEvents.push(event);

      const farFuture = getTestDate(15);

      await expect(
        publicApiClient.getSlots(event.slug, farFuture)
      ).rejects.toThrow();
    });

    test('должен возвращать 400 для прошедшей даты', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('slots-past'),
      });
      createdEvents.push(event);

      const yesterday = getTestDate(-1);

      await expect(
        publicApiClient.getSlots(event.slug, yesterday)
      ).rejects.toThrow();
    });

    test('должен исключать занятые слоты', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('slots-occupied'),
      });
      createdEvents.push(event);

      const tomorrow = getTestDate(1);
      
      // Создаём бронирование на 9:00
      const booking = await apiClient.createBooking(event.slug, {
        startTime: `${tomorrow}T09:00:00Z`,
        guest: sampleGuests[0]!,
      });
      createdBookings.push(booking);

      // Получаем слоты
      const slotsResponse = await publicApiClient.getSlots(event.slug, tomorrow);

      // Проверяем, что 9:00 нет в списке
      const slot9am = slotsResponse.slots.find(
        s => s.startTime === `${tomorrow}T09:00:00Z`
      );
      expect(slot9am).toBeUndefined();
    });
  });

  test.describe('Bookings API', () => {
    test('должен создавать бронирование на доступный слот', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('booking-create'),
      });
      createdEvents.push(event);

      const tomorrow = getTestDate(1);
      const booking = await apiClient.createBooking(event.slug, {
        startTime: `${tomorrow}T09:00:00Z`,
        guest: sampleGuests[0]!,
      });
      createdBookings.push(booking);

      expect(booking).toBeDefined();
      expect(booking.id).toBeDefined();
      expect(booking.eventId).toBe(event.id);
      expect(booking.startTime).toBe(`${tomorrow}T09:00:00Z`);
      expect(booking.status).toBe('active');
      expect(booking.cancelToken).toBeDefined();
      expect(booking.guest.name).toBe(sampleGuests[0]!.name);
      expect(booking.guest.email).toBe(sampleGuests[0]!.email);
    });

    test('должен возвращать 409 при бронировании занятого слота', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('booking-conflict'),
      });
      createdEvents.push(event);

      const tomorrow = getTestDate(1);
      
      // Создаём первое бронирование
      const booking1 = await apiClient.createBooking(event.slug, {
        startTime: `${tomorrow}T09:00:00Z`,
        guest: sampleGuests[0]!,
      });
      createdBookings.push(booking1);

      // Пытаемся создать второе на то же время
      await expect(
        apiClient.createBooking(event.slug, {
          startTime: `${tomorrow}T09:00:00Z`,
          guest: sampleGuests[1]!,
        })
      ).rejects.toThrow();
    });

    test('должен возвращать 400 для невалидного времени', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('booking-invalid-time'),
      });
      createdEvents.push(event);

      const tomorrow = getTestDate(1);

      // Пытаемся забронировать время, не совпадающее с границей слота (например, 09:05)
      await expect(
        apiClient.createBooking(event.slug, {
          startTime: `${tomorrow}T09:05:00Z`,
          guest: sampleGuests[0]!,
        })
      ).rejects.toThrow();
    });

    test('должен позволять гостю отменить бронирование с токеном', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('booking-guest-cancel'),
      });
      createdEvents.push(event);

      const tomorrow = getTestDate(1);
      const booking = await apiClient.createBooking(event.slug, {
        startTime: `${tomorrow}T09:00:00Z`,
        guest: sampleGuests[0]!,
      });
      createdBookings.push(booking);

      // Отменяем как гость
      await apiClient.cancelBookingAsGuest(booking.id, booking.cancelToken);

      // Проверяем, что бронирование отменено (не появляется в списке)
      const bookings = await apiClient.listBookings();
      const cancelledBooking = bookings.find(b => b.id === booking.id);
      expect(cancelledBooking).toBeUndefined();
    });

    test('должен возвращать 403 при отмене с неверным токеном', async () => {
      const event = await apiClient.createEvent({
        ...newEventData,
        duration: 30,
        slug: generateUniqueSlug('booking-invalid-token'),
      });
      createdEvents.push(event);

      const tomorrow = getTestDate(1);
      const booking = await apiClient.createBooking(event.slug, {
        startTime: `${tomorrow}T09:00:00Z`,
        guest: sampleGuests[0]!,
      });
      createdBookings.push(booking);

      // Пытаемся отменить с неверным токеном
      await expect(
        apiClient.cancelBookingAsGuest(booking.id, 'invalid-token')
      ).rejects.toThrow();
    });

    test('должен возвращать 404 при отмене несуществующего бронирования', async () => {
      await expect(
        apiClient.cancelBookingAsGuest('non-existent-id', 'some-token')
      ).rejects.toThrow();
    });
  });

  test.describe('Error Handling', () => {
    test('должен возвращать правильную структуру ошибки', async () => {
      try {
        await apiClient.getEvent('non-existent-event-12345');
        // Если не выбросило ошибку, тест падает
        expect(false).toBe(true);
      } catch (error: any) {
        // Проверяем, что ошибка содержит информацию о статусе
        expect(error.message).toContain('404');
      }
    });
  });
});
