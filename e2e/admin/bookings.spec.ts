/**
 * E2E тесты для управления бронированиями в админ панели
 * @see /workspace/docs/superpowers/specs/2026-04-11-admin-events-design.md
 */

import { test, expect } from '../fixtures/test-fixtures';
import { createApiClient } from '../helpers/api-client';
import { 
  adminCredentials,
  generateUniqueSlug,
  getTestDate,
  fullWeeklySchedule,
  sampleGuests,
} from '../fixtures/test-data';
import type { Event, BookingCreatedResponse } from '../fixtures/types';

test.describe('Admin Bookings Management', () => {
  let createdEvents: Event[] = [];
  let createdBookings: BookingCreatedResponse[] = [];
  let apiClient: ReturnType<typeof createApiClient>;

  test.beforeEach(async ({ request }) => {
    apiClient = createApiClient(request, adminCredentials);
    createdEvents = [];
    createdBookings = [];
    
    // Восстанавливаем полное расписание
    await apiClient.updateSchedule(fullWeeklySchedule);
  });

  test.afterEach(async () => {
    // Отменяем все бронирования
    for (const booking of createdBookings) {
      try {
        await apiClient.cancelBookingAsAdmin(booking.id);
      } catch {
        // Игнорируем ошибки
      }
    }
    
    // Удаляем события
    for (const event of createdEvents) {
      try {
        await apiClient.deleteEvent(event.slug);
      } catch {
        // Игнорируем ошибки
      }
    }
  });

  test('должна позволять получить список бронирований', async () => {
    const event = await apiClient.createEvent({
      title: 'List Bookings Test',
      description: 'Test listing bookings',
      duration: 30,
      slug: generateUniqueSlug('list-bookings'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    const bookings = await apiClient.listBookings();

    expect(bookings).toBeDefined();
    expect(Array.isArray(bookings)).toBe(true);
    
    const foundBooking = bookings.find(b => b.id === booking.id);
    expect(foundBooking).toBeDefined();
    expect(foundBooking?.guest.name).toBe(sampleGuests[0]!.name);
    expect(foundBooking?.event.title).toBe(event.title);
  });

  test('должна возвращать только активные предстоящие бронирования', async () => {
    const event = await apiClient.createEvent({
      title: 'Filter Bookings Test',
      description: 'Test filtering bookings',
      duration: 30,
      slug: generateUniqueSlug('filter-bookings'),
    });
    createdEvents.push(event);

    // Создаём активное бронирование на завтра
    const tomorrow = getTestDate(1);
    const activeBooking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(activeBooking);

    const bookings = await apiClient.listBookings();

    // Все возвращённые бронирования должны быть активными
    for (const booking of bookings) {
      expect(booking.status).toBe('active');
    }
  });

  test('должна сортировать бронирования по времени начала', async () => {
    const event = await apiClient.createEvent({
      title: 'Sort Bookings Test',
      description: 'Test sorting bookings',
      duration: 30,
      slug: generateUniqueSlug('sort-bookings'),
    });
    createdEvents.push(event);

    // Создаём бронирования на разное время
    const dayAfterTomorrow = getTestDate(2);
    const tomorrow = getTestDate(1);

    const booking2 = await apiClient.createBooking(event.slug, {
      startTime: `${dayAfterTomorrow}T09:00:00Z`,
      guest: sampleGuests[1]!,
    });
    createdBookings.push(booking2);

    const booking1 = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T10:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking1);

    const bookings = await apiClient.listBookings();

    // Находим наши бронирования в списке и проверяем порядок
    const index1 = bookings.findIndex(b => b.id === booking1.id);
    const index2 = bookings.findIndex(b => b.id === booking2.id);

    expect(index1).toBeLessThan(index2);
  });

  test('должна позволять получить детали бронирования', async () => {
    const event = await apiClient.createEvent({
      title: 'Get Booking Test',
      description: 'Test getting booking details',
      duration: 30,
      slug: generateUniqueSlug('get-booking'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    const bookingDetails = await apiClient.getBooking(booking.id);

    expect(bookingDetails).toBeDefined();
    expect(bookingDetails.id).toBe(booking.id);
    expect(bookingDetails.guest.name).toBe(sampleGuests[0]!.name);
    expect(bookingDetails.guest.email).toBe(sampleGuests[0]!.email);
    expect(bookingDetails.event.title).toBe(event.title);
    expect(bookingDetails.event.slug).toBe(event.slug);
    expect(bookingDetails.event.duration).toBe(event.duration);
  });

  test('должна возвращать 404 для несуществующего бронирования', async () => {
    await expect(
      apiClient.getBooking('non-existent-booking-id-12345')
    ).rejects.toThrow();
  });

  test('должна позволять отменить бронирование как админ', async () => {
    const event = await apiClient.createEvent({
      title: 'Admin Cancel Test',
      description: 'Test admin cancellation',
      duration: 30,
      slug: generateUniqueSlug('admin-cancel'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    // Отменяем бронирование как админ (без токена)
    await apiClient.cancelBookingAsAdmin(booking.id);

    // Проверяем, что бронирование отменено
    const bookings = await apiClient.listBookings();
    const cancelledBooking = bookings.find(b => b.id === booking.id);
    expect(cancelledBooking).toBeUndefined(); // Отменённые не показываются в списке
  });

  test('не должна возвращать cancelToken в списке бронирований', async () => {
    const event = await apiClient.createEvent({
      title: 'No Token Test',
      description: 'Test no token in list',
      duration: 30,
      slug: generateUniqueSlug('no-token'),
    });
    createdEvents.push(event);

    const tomorrow = getTestDate(1);
    const booking = await apiClient.createBooking(event.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking);

    const bookings = await apiClient.listBookings();
    const foundBooking = bookings.find(b => b.id === booking.id);

    expect(foundBooking).toBeDefined();
    expect(foundBooking).not.toHaveProperty('cancelToken');
  });

  test('должна показывать бронирования из разных событий', async () => {
    const event1 = await apiClient.createEvent({
      title: 'Event One',
      description: 'First event',
      duration: 30,
      slug: generateUniqueSlug('multi-event-1'),
    });
    createdEvents.push(event1);

    const event2 = await apiClient.createEvent({
      title: 'Event Two',
      description: 'Second event',
      duration: 60,
      slug: generateUniqueSlug('multi-event-2'),
    });
    createdEvents.push(event2);

    const tomorrow = getTestDate(1);
    
    const booking1 = await apiClient.createBooking(event1.slug, {
      startTime: `${tomorrow}T09:00:00Z`,
      guest: sampleGuests[0]!,
    });
    createdBookings.push(booking1);

    const booking2 = await apiClient.createBooking(event2.slug, {
      startTime: `${tomorrow}T14:00:00Z`,
      guest: sampleGuests[1]!,
    });
    createdBookings.push(booking2);

    const bookings = await apiClient.listBookings();

    const foundBooking1 = bookings.find(b => b.id === booking1.id);
    const foundBooking2 = bookings.find(b => b.id === booking2.id);

    expect(foundBooking1).toBeDefined();
    expect(foundBooking2).toBeDefined();
    expect(foundBooking1?.event.title).toBe(event1.title);
    expect(foundBooking2?.event.title).toBe(event2.title);
  });
});
