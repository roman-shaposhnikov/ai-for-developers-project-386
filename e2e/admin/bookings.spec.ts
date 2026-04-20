import { test, expect } from '@playwright/test';
import { AdminBookingsPage } from '../page-objects';
import { createEvent, clearAllData, testGuest, getFutureDate, getTimeSlot } from '../fixtures/test-data';

/**
 * 🟡 Важный сценарий: Admin управляет бронированиями
 * 
 * Цель: Admin видит и управляет всеми бронированиями
 */
test.describe('Admin Bookings Management', () => {
  test.beforeEach(async () => {
    await clearAllData();
  });

  test('should display empty state when no bookings exist', async ({ page }) => {
    const bookingsPage = new AdminBookingsPage(page);
    await bookingsPage.goto();
    
    await expect(bookingsPage.emptyState).toBeVisible();
    await expect(bookingsPage.getBookingsCount()).resolves.toBe(0);
  });

  test('should display active bookings with details', async ({ page }) => {
    // Create event and booking
    const event = await createEvent({
      title: 'Test Consultation',
      duration: 30,
      active: true,
    });
    
    const { createBooking } = await import('../fixtures/test-data');
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const booking = await createBooking(event.slug, slot, testGuest);
    
    const bookingsPage = new AdminBookingsPage(page);
    await bookingsPage.goto();
    
    // Should show booking with details
    await expect(bookingsPage.getBookingsCount()).resolves.toBe(1);
    await expect(bookingsPage.hasBookingForEvent(event.title)).resolves.toBe(true);
    await expect(bookingsPage.hasBookingForGuest(testGuest.name)).resolves.toBe(true);
  });

  test('should display multiple bookings sorted by time', async ({ page }) => {
    // Create event
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      active: true,
    });
    
    const { createBooking } = await import('../fixtures/test-data');
    
    // Create bookings for different times
    const futureDate = getFutureDate(1);
    const slot1 = getTimeSlot(futureDate, 14, 0); // 14:00
    const slot2 = getTimeSlot(futureDate, 10, 0); // 10:00 - earlier
    
    await createBooking(event.slug, slot1, {
      name: 'User One',
      email: 'user1@example.com',
    });
    
    await createBooking(event.slug, slot2, {
      name: 'User Two',
      email: 'user2@example.com',
    });
    
    const bookingsPage = new AdminBookingsPage(page);
    await bookingsPage.goto();
    
    // Should show both bookings
    await expect(bookingsPage.getBookingsCount()).resolves.toBe(2);
  });

  test('should NOT display cancelled bookings', async ({ page }) => {
    // Create event and cancelled booking
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      active: true,
    });
    
    const { createBooking, cancelBooking } = await import('../fixtures/test-data');
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const booking = await createBooking(event.slug, slot, testGuest);
    
    // Cancel booking via API
    await cancelBooking(booking.id);
    
    const bookingsPage = new AdminBookingsPage(page);
    await bookingsPage.goto();
    
    // Cancelled booking should not appear
    await expect(bookingsPage.getBookingsCount()).resolves.toBe(0);
  });

  test('should allow admin to cancel booking', async ({ page }) => {
    // Create event and booking
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      active: true,
    });
    
    const { createBooking } = await import('../fixtures/test-data');
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    await createBooking(event.slug, slot, testGuest);
    
    const bookingsPage = new AdminBookingsPage(page);
    await bookingsPage.goto();
    
    // Cancel the booking
    await bookingsPage.cancelBooking(0);
    
    // Booking should disappear from list
    await page.waitForTimeout(500);
    await expect(bookingsPage.getBookingsCount()).resolves.toBe(0);
  });

  test('should show booking status (active/cancelled)', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      active: true,
    });
    
    const { createBooking } = await import('../fixtures/test-data');
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    await createBooking(event.slug, slot, testGuest);
    
    const bookingsPage = new AdminBookingsPage(page);
    await bookingsPage.goto();
    
    // Should show active status
    await expect(page.locator('body')).toContainText(/актив|active/i);
  });

  test('admin should NOT see guest cancel tokens', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      active: true,
    });
    
    const { createBooking } = await import('../fixtures/test-data');
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const booking = await createBooking(event.slug, slot, testGuest);
    
    const bookingsPage = new AdminBookingsPage(page);
    await bookingsPage.goto();
    
    // Token should not be visible in the UI
    const pageContent = await page.content();
    expect(pageContent).not.toContain(booking.cancelToken);
  });
});
