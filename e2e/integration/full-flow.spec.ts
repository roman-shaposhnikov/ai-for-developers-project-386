import { test, expect } from '@playwright/test';
import {
  PublicEventsListPage,
  EventBookingPage,
  BookingFormPage,
  BookingSuccessPage,
  AdminEventsListPage,
  EventCreatePage,
  AdminBookingsPage,
} from '../page-objects';
import { clearAllData, testGuest, getFutureDate, getTimeSlot } from '../fixtures/test-data';

/**
 * 🔴 Критичный сценарий: Полный flow - создание → бронирование
 * 
 * Проверяет интеграцию всех компонентов:
 * Admin создаёт событие → Guest видит и бронирует → Admin видит бронирование
 */
test.describe('Full Integration Flow', () => {
  test.beforeEach(async () => {
    await clearAllData();
  });

  test('complete flow: admin creates event → guest books it → admin sees booking', async ({ page }) => {
    // ==========================================
    // PART 1: Admin creates a new event
    // ==========================================
    const adminEventsPage = new AdminEventsListPage(page);
    await adminEventsPage.goto();
    
    // Navigate to create page
    await adminEventsPage.clickCreateEvent();
    
    const createPage = new EventCreatePage(page);
    await createPage.fillForm({
      title: 'Integration Test Event',
      slug: 'integration-test-event',
      duration: 30,
      description: 'Event created for integration testing',
      active: true,
    });
    
    await createPage.submit();
    
    // Verify event is in admin list
    await expect(adminEventsPage.hasEventWithTitle('Integration Test Event')).resolves.toBe(true);
    
    // ==========================================
    // PART 2: Guest sees the event on public page
    // ==========================================
    const publicEventsPage = new PublicEventsListPage(page);
    await publicEventsPage.goto();
    
    // Event should be visible to guests
    await expect(publicEventsPage.hasEventWithTitle('Integration Test Event')).resolves.toBe(true);
    
    // ==========================================
    // PART 3: Guest clicks event and goes to booking page
    // ==========================================
    await publicEventsPage.clickEventByTitle('Integration Test Event');
    
    const bookingPage = new EventBookingPage(page);
    await expect(page).toHaveURL(/.*\/e\/integration-test-event/);
    
    // ==========================================
    // PART 4: Guest selects date and time
    // ==========================================
    await bookingPage.selectFutureDate(1);
    await page.waitForTimeout(1000);
    
    // Verify slots are available
    const slotsCount = await bookingPage.getAvailableSlotsCount();
    expect(slotsCount).toBeGreaterThan(0);
    
    // Select first slot
    await bookingPage.selectTimeSlot(0);
    await bookingPage.clickBook();
    
    // ==========================================
    // PART 5: Guest fills booking form
    // ==========================================
    const bookingFormPage = new BookingFormPage(page);
    await expect(page).toHaveURL(/.*\/book.*/);
    
    await bookingFormPage.fillForm({
      name: testGuest.name,
      email: testGuest.email,
      notes: testGuest.notes,
    });
    
    await bookingFormPage.submit();
    
    // ==========================================
    // PART 6: Guest sees success page with booking details
    // ==========================================
    const successPage = new BookingSuccessPage(page);
    await expect(page).toHaveURL(/.*\/success.*/);
    await expect(successPage.successMessage).toBeVisible();
    await expect(page.locator('body')).toContainText(testGuest.name);
    await expect(page.locator('body')).toContainText('Integration Test Event');
    
    // ==========================================
    // PART 7: Admin sees the new booking
    // ==========================================
    const adminBookingsPage = new AdminBookingsPage(page);
    await adminBookingsPage.goto();
    
    // Booking should be visible
    await expect(adminBookingsPage.getBookingsCount()).resolves.toBe(1);
    await expect(adminBookingsPage.hasBookingForEvent('Integration Test Event')).resolves.toBe(true);
    await expect(adminBookingsPage.hasBookingForGuest(testGuest.name)).resolves.toBe(true);
  });

  test('conflict scenario: two guests try to book same slot', async ({ browser }) => {
    // ==========================================
    // Setup: Create event via API
    // ==========================================
    const { createEvent } = await import('../fixtures/test-data');
    const event = await createEvent({
      title: 'Conflict Test Event',
      duration: 30,
      active: true,
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    // ==========================================
    // Guest 1 books the slot
    // ==========================================
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    const bookingPage1 = new EventBookingPage(page1);
    await bookingPage1.goto(event.slug);
    await bookingPage1.selectFutureDate(1);
    await page1.waitForTimeout(1000);
    await bookingPage1.selectTimeSlotByTime('10:00');
    await bookingPage1.clickBook();
    
    const bookingFormPage1 = new BookingFormPage(page1);
    await bookingFormPage1.fillForm({
      name: 'Guest One',
      email: 'guest1@example.com',
    });
    await bookingFormPage1.submit();
    
    // Guest 1 should succeed
    await expect(page1).toHaveURL(/.*\/success.*/);
    
    // ==========================================
    // Guest 2 tries to book same slot
    // ==========================================
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    const bookingPage2 = new EventBookingPage(page2);
    await bookingPage2.goto(event.slug);
    await bookingPage2.selectFutureDate(1);
    await page2.waitForTimeout(1000);
    
    // The slot should now be unavailable
    // Either disabled or shows conflict on submit
    const slotUnavailable = await page2.locator('button:has-text("10:00")').evaluate((el) => {
      return el.hasAttribute('disabled') || 
             el.classList.contains('disabled') || 
             el.getAttribute('aria-disabled') === 'true';
    }).catch(() => false);
    
    // If not disabled in UI, try to book and expect error
    if (!slotUnavailable) {
      await bookingPage2.selectTimeSlotByTime('10:00');
      await bookingPage2.clickBook();
      
      const bookingFormPage2 = new BookingFormPage(page2);
      await bookingFormPage2.fillForm({
        name: 'Guest Two',
        email: 'guest2@example.com',
      });
      await bookingFormPage2.submitAndExpectError();
      
      // Should show conflict error
      await expect(page2.locator('body')).toContainText(/занят|конфликт|conflict/i);
    }
    
    await context1.close();
    await context2.close();
  });

  test('cancellation flow: guest cancels → slot becomes available → another guest books', async ({ page }) => {
    const { createEvent, createBooking } = await import('../fixtures/test-data');
    
    // ==========================================
    // Setup: Create event and booking
    // ==========================================
    const event = await createEvent({
      title: 'Cancellation Test Event',
      duration: 30,
      active: true,
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const booking = await createBooking(event.slug, slot, testGuest);
    
    // ==========================================
    // Guest cancels their booking
    // ==========================================
    const successPage = new BookingSuccessPage(page);
    await successPage.goto(booking.id, booking.cancelToken);
    
    await successPage.cancelBooking();
    
    // Verify cancellation
    const isCancelled = await successPage.isCancelledMessageVisible().catch(() => {
      return successPage.isCancelButtonVisible().then(v => !v);
    });
    expect(isCancelled).toBe(true);
    
    // ==========================================
    // Verify slot is now available
    // ==========================================
    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);
    await bookingPage.selectFutureDate(1);
    await page.waitForTimeout(1000);
    
    // 10:00 slot should be available again
    const slotAvailable = await page.locator('button:has-text("10:00")').isVisible();
    expect(slotAvailable).toBe(true);
    
    // ==========================================
    // Another guest can book the freed slot
    // ==========================================
    const newBooking = await createBooking(event.slug, slot, {
      name: 'Second Guest',
      email: 'second@example.com',
    });
    
    expect(newBooking).toBeDefined();
    expect(newBooking.id).not.toBe(booking.id);
  });

  test('inactive event is not visible to guests but visible to admin', async ({ page }) => {
    const { createEvent } = await import('../fixtures/test-data');
    
    // ==========================================
    // Create inactive event
    // ==========================================
    const event = await createEvent({
      title: 'Inactive Test Event',
      duration: 30,
      active: false,
    });
    
    // ==========================================
    // Admin should see the inactive event
    // ==========================================
    const adminEventsPage = new AdminEventsListPage(page);
    await adminEventsPage.goto();
    
    await expect(adminEventsPage.hasEventWithTitle('Inactive Test Event')).resolves.toBe(true);
    
    // ==========================================
    // Guest should NOT see the inactive event
    // ==========================================
    const publicEventsPage = new PublicEventsListPage(page);
    await publicEventsPage.goto();
    
    await expect(publicEventsPage.hasEventWithTitle('Inactive Test Event')).resolves.toBe(false);
    await expect(publicEventsPage.emptyState).toBeVisible();
    
    // ==========================================
    // Direct URL access should return 404
    // ==========================================
    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);
    
    await expect(page.locator('body')).toContainText(/404|не найден|not found/i);
  });
});
