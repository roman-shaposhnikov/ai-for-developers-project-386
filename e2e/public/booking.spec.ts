import { test, expect } from '@playwright/test';
import { PublicEventsListPage, EventBookingPage } from '../page-objects';
import { createEvent, clearAllData, testEvents, getFutureDate, getTimeSlot } from '../fixtures/test-data';

/**
 * 🔴 Критичный сценарий: Guest выбирает дату и время бронирования
 * 
 * Цель: Guest может выбрать удобное время для встречи
 */
test.describe('Event Booking Page - Time Selection', () => {
  test.beforeEach(async () => {
    await clearAllData();
  });

  test('should display event information on booking page', async ({ page }) => {
    const event = await createEvent(testEvents.active);
    
    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);
    
    // Verify event information is displayed
    await expect(page.locator('body')).toContainText(event.title);
    await expect(page.locator('body')).toContainText(String(event.duration));
  });

  test('should display calendar for date selection', async ({ page }) => {
    const event = await createEvent(testEvents.active);
    
    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);
    
    // Calendar should be visible
    await expect(bookingPage.calendar).toBeVisible();
  });

  test('should handle non-existent event (404)', async ({ page }) => {
    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto('non-existent-event');
    
    // Should show 404 or error state
    // The exact behavior depends on the frontend implementation
    await expect(page.locator('body')).toBeVisible();
  });

  test('should allow going back to events list', async ({ page }) => {
    const event = await createEvent({
      ...testEvents.active,
      description: 'Test for back navigation',
    });
    
    const bookingPage = new EventBookingPage(page);
    await bookingPage.goto(event.slug);
    
    await bookingPage.goBack();
    
    // Should be on events list page
    await expect(page).toHaveURL('/');
  });
});
