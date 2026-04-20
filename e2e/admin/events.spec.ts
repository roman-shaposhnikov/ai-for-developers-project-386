import { test, expect } from '@playwright/test';
import { AdminEventsListPage, EventCreatePage, EventEditPage } from '../page-objects';
import { createEvent, clearAllData, testEvents, getEvents } from '../fixtures/test-data';

/**
 * 🔴 Критичный сценарий: Admin создаёт, редактирует и удаляет события
 * 
 * Цель: Admin может управлять событиями (CRUD)
 */
test.describe('Admin Events Management', () => {
  test.beforeEach(async () => {
    await clearAllData();
  });

  test.describe('Admin Events List Page', () => {
    test('should display empty state when no events exist', async ({ page }) => {
      const adminPage = new AdminEventsListPage(page);
      await adminPage.goto();
      
      await expect(adminPage.emptyState).toBeVisible();
      await expect(adminPage.getEventsCount()).resolves.toBe(0);
    });

    test('should display all events including inactive', async ({ page }) => {
      // Create active and inactive events
      const activeEvent = await createEvent(testEvents.active);
      const inactiveEvent = await createEvent(testEvents.inactive);
      
      const adminPage = new AdminEventsListPage(page);
      await adminPage.goto();
      
      // Admin should see both events
      await expect(adminPage.getEventsCount()).resolves.toBe(2);
      await expect(adminPage.hasEventWithTitle(activeEvent.title)).resolves.toBe(true);
      await expect(adminPage.hasEventWithTitle(inactiveEvent.title)).resolves.toBe(true);
    });

    test('should have working navigation to bookings and schedule', async ({ page }) => {
      const adminPage = new AdminEventsListPage(page);
      await adminPage.goto();
      
      // Check navigation works
      await adminPage.gotoBookings();
      await expect(page).toHaveURL('/admin/bookings');
      
      await adminPage.goto();
      await adminPage.gotoSchedule();
      await expect(page).toHaveURL('/admin/schedule');
    });
  });

  test.describe('Event Creation', () => {
    test('should create event with valid data', async ({ page }) => {
      const adminPage = new AdminEventsListPage(page);
      await adminPage.goto();
      
      // Navigate to create page
      await adminPage.clickCreateEvent();
      
      const createPage = new EventCreatePage(page);
      await createPage.fillForm({
        title: 'New Test Event',
        slug: 'new-test-event',
        duration: 45,
        description: 'Test description',
        active: true,
      });
      
      await createPage.submit();
      
      // Should redirect back to list
      await expect(page).toHaveURL('/admin/events');
      
      // Event should be in the list
      await expect(adminPage.hasEventWithTitle('New Test Event')).resolves.toBe(true);
    });

    test('should auto-generate slug from title', async ({ page }) => {
      const createPage = new EventCreatePage(page);
      await createPage.goto();
      
      await createPage.fillTitle('My Test Event');
      
      // Slug should be auto-generated (implementation dependent)
      // This test assumes the UI auto-generates slug
      await page.waitForTimeout(500);
      
      const slugValue = await createPage.getSlugValue();
      expect(slugValue).toBeTruthy();
    });

    test('should show error for duplicate slug', async ({ page }) => {
      // Create first event
      await createEvent({
        title: 'First Event',
        duration: 30,
        slug: 'duplicate-slug',
      });
      
      // Try to create second event with same slug
      const createPage = new EventCreatePage(page);
      await createPage.goto();
      
      await createPage.fillForm({
        title: 'Second Event',
        slug: 'duplicate-slug',
        duration: 30,
      });
      
      await createPage.submitAndExpectError();
      
      // Should show error about duplicate
      const hasErrors = await createPage.hasErrors();
      expect(hasErrors).toBe(true);
    });

    test('should validate duration range (5-480 minutes)', async ({ page }) => {
      const createPage = new EventCreatePage(page);
      await createPage.goto();
      
      // Try invalid duration
      await createPage.fillForm({
        title: 'Invalid Duration Event',
        slug: 'invalid-duration',
        duration: 500, // Too long
      });
      
      await createPage.submitAndExpectError();
      
      // Should show validation error
      const hasErrors = await createPage.hasErrors();
      expect(hasErrors).toBe(true);
    });

    test('should allow cancelling event creation', async ({ page }) => {
      const createPage = new EventCreatePage(page);
      await createPage.goto();
      
      await createPage.fillTitle('Cancelled Event');
      await createPage.cancel();
      
      // Should return to list without creating
      await expect(page).toHaveURL('/admin/events');
      
      const adminPage = new AdminEventsListPage(page);
      await expect(adminPage.hasEventWithTitle('Cancelled Event')).resolves.toBe(false);
    });
  });

  test.describe('Event Editing', () => {
    test('should edit event title', async ({ page }) => {
      const event = await createEvent(testEvents.active);
      
      const adminPage = new AdminEventsListPage(page);
      await adminPage.goto();
      await adminPage.clickEditEventByTitle(event.title);
      
      const editPage = new EventEditPage(page);
      await editPage.updateField('title', 'Updated Event Title');
      await editPage.save();
      
      // Should redirect and show updated event
      await expect(page).toHaveURL('/admin/events');
      await expect(adminPage.hasEventWithTitle('Updated Event Title')).resolves.toBe(true);
      await expect(adminPage.hasEventWithTitle(event.title)).resolves.toBe(false);
    });

    test('should edit event duration', async ({ page }) => {
      const event = await createEvent(testEvents.active);
      
      const editPage = new EventEditPage(page);
      await editPage.goto(event.slug);
      
      await editPage.updateField('duration', 90);
      await editPage.save();
      
      // Verify update via API
      const events = await getEvents();
      const updatedEvent = events.find(e => e.slug === event.slug);
      expect(updatedEvent?.duration).toBe(90);
    });

    test('should not allow editing slug (disabled field)', async ({ page }) => {
      const event = await createEvent(testEvents.active);
      
      const editPage = new EventEditPage(page);
      await editPage.goto(event.slug);
      
      // Slug field should be read-only or disabled
      const isReadOnly = await editPage.isSlugReadOnly();
      expect(isReadOnly).toBe(true);
    });

    test('should toggle event active status', async ({ page }) => {
      const event = await createEvent({ ...testEvents.active, active: true });
      
      const editPage = new EventEditPage(page);
      await editPage.goto(event.slug);
      
      await editPage.updateField('active', false);
      await editPage.save();
      
      // Verify via API
      const events = await getEvents();
      const updatedEvent = events.find(e => e.slug === event.slug);
      expect(updatedEvent?.active).toBe(false);
    });

    test('should cancel editing without saving changes', async ({ page }) => {
      const event = await createEvent(testEvents.active);
      
      const editPage = new EventEditPage(page);
      await editPage.goto(event.slug);
      
      await editPage.updateField('title', 'Should Not Save');
      await editPage.cancel();
      
      // Should return to list without changes
      await expect(page).toHaveURL('/admin/events');
      
      const adminPage = new AdminEventsListPage(page);
      await expect(adminPage.hasEventWithTitle(event.title)).resolves.toBe(true);
      await expect(adminPage.hasEventWithTitle('Should Not Save')).resolves.toBe(false);
    });
  });

  test.describe('Event Deletion', () => {
    test('should delete event without bookings', async ({ page }) => {
      const event = await createEvent(testEvents.active);
      
      const adminPage = new AdminEventsListPage(page);
      await adminPage.goto();
      
      await adminPage.clickEditEventByTitle(event.title);
      
      const editPage = new EventEditPage(page);
      await editPage.deleteEvent();
      
      // Should return to list and event should be gone
      await expect(page).toHaveURL('/admin/events');
      await expect(adminPage.hasEventWithTitle(event.title)).resolves.toBe(false);
    });

    test('should prevent deleting event with active bookings', async ({ page }) => {
      // Create event and booking
      const event = await createEvent(testEvents.active);
      const { createBooking } = await import('../fixtures/test-data');
      const { getFutureDate, getTimeSlot } = await import('../fixtures/test-data');
      
      const futureDate = getFutureDate(1);
      const slot = getTimeSlot(futureDate, 10, 0);
      
      await createBooking(event.slug, slot, {
        name: 'Test User',
        email: 'test@example.com',
      });
      
      // Try to delete event
      const editPage = new EventEditPage(page);
      await editPage.goto(event.slug);
      await editPage.deleteEvent();
      
      // Should show error or remain on page
      await expect(page.locator('body')).toContainText(/нельзя удалить|cannot delete|booking/i);
    });
  });
});
