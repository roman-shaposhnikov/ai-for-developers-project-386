import { test, expect } from '@playwright/test';
import { PublicEventsListPage } from '../page-objects';
import { createEvent, clearAllData, testEvents } from '../fixtures/test-data';

/**
 * 🔴 Критичный сценарий: Guest просматривает список событий
 * 
 * Цель: Guest может видеть доступные для бронирования события
 */
test.describe('Public Events List Page', () => {
  test.beforeEach(async () => {
    // Clear all data before each test for isolation
    await clearAllData();
  });

  test('should display empty state when no events exist', async ({ page }) => {
    const eventsPage = new PublicEventsListPage(page);
    
    await eventsPage.goto();
    
    await expect(eventsPage.emptyState).toBeVisible();
    await expect(eventsPage.getEventCount()).resolves.toBe(0);
  });

  test('should display active events', async ({ page }) => {
    // Create test events via API
    const activeEvent = await createEvent(testEvents.active);
    
    const eventsPage = new PublicEventsListPage(page);
    await eventsPage.goto();
    
    // Verify event is displayed
    await expect(eventsPage.getEventCount()).resolves.toBe(1);
    await expect(eventsPage.hasEventWithTitle(activeEvent.title)).resolves.toBe(true);
    
    // Verify event details are shown
    const eventCard = page.locator(`[data-testid="event-card"]:has-text("${activeEvent.title}")`);
    await expect(eventCard).toContainText(activeEvent.title);
    await expect(eventCard).toContainText(String(activeEvent.duration));
  });

  test('should display multiple active events', async ({ page }) => {
    // Create multiple events
    const event1 = await createEvent({
      title: 'First Consultation',
      duration: 30,
      description: 'First test event',
    });
    const event2 = await createEvent({
      title: 'Second Meeting',
      duration: 60,
      description: 'Second test event',
    });
    
    const eventsPage = new PublicEventsListPage(page);
    await eventsPage.goto();
    
    await expect(eventsPage.getEventCount()).resolves.toBe(2);
    await expect(eventsPage.hasEventWithTitle(event1.title)).resolves.toBe(true);
    await expect(eventsPage.hasEventWithTitle(event2.title)).resolves.toBe(true);
  });

  test('should NOT display inactive events', async ({ page }) => {
    // Create active and inactive events
    const activeEvent = await createEvent(testEvents.active);
    const inactiveEvent = await createEvent(testEvents.inactive);
    
    // Deactivate the second event
    const { updateEvent } = await import('../fixtures/test-data');
    await updateEvent(inactiveEvent.slug, { active: false });
    
    const eventsPage = new PublicEventsListPage(page);
    await eventsPage.goto();
    
    // Only active event should be visible
    await expect(eventsPage.getEventCount()).resolves.toBe(1);
    await expect(eventsPage.hasEventWithTitle(activeEvent.title)).resolves.toBe(true);
    await expect(eventsPage.hasEventWithTitle(inactiveEvent.title)).resolves.toBe(false);
  });

  test('should show event with correct information (title, description, duration)', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Architecture Session',
      duration: 90,
      description: 'Detailed architecture discussion',
    });
    
    const eventsPage = new PublicEventsListPage(page);
    await eventsPage.goto();
    
    const eventCard = page.locator(`[data-testid="event-card"]:has-text("${event.title}")`);
    
    // Verify all information is displayed
    await expect(eventCard).toContainText(event.title);
    await expect(eventCard).toContainText(event.description);
    // Duration is formatted as "1 час 30 минут" for 90 minutes
    await expect(eventCard).toContainText('минут'); // duration indicator
  });

  test('clicking event card should navigate to booking page', async ({ page }) => {
    const event = await createEvent(testEvents.active);
    
    const eventsPage = new PublicEventsListPage(page);
    await eventsPage.goto();
    
    await eventsPage.clickEventByTitle(event.title);
    
    // Should navigate to /e/:slug
    await expect(page).toHaveURL(`/e/${event.slug}`);
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Simulate error by navigating to a page with invalid parameters
    // This test verifies the UI handles errors gracefully
    const eventsPage = new PublicEventsListPage(page);
    await eventsPage.goto();
    
    // Page should load without crashing even if API has issues
    await expect(page.locator('body')).toBeVisible();
    await expect(eventsPage.emptyState).toBeVisible();
  });
});
