import { test, expect } from '@playwright/test';
import { BookingFormPage, BookingSuccessPage } from '../page-objects';
import { createEvent, createBooking, clearAllData, testGuest, getFutureDate, getTimeSlot } from '../fixtures/test-data';

/**
 * 🔴 Критичный сценарий: Guest заполняет форму бронирования и отменяет бронирование
 * 
 * Цель: Guest может оставить свои данные и управлять бронированием
 */
test.describe('Booking Form Page', () => {
  test.beforeEach(async () => {
    await clearAllData();
  });

  test('should display booking form with event information', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      description: 'Test description',
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const bookingFormPage = new BookingFormPage(page);
    await bookingFormPage.goto(event.slug, slot);
    
    // Verify form fields are visible
    await expect(bookingFormPage.nameInput).toBeVisible();
    await expect(bookingFormPage.emailInput).toBeVisible();
    await expect(bookingFormPage.notesInput).toBeVisible();
    await expect(bookingFormPage.submitButton).toBeVisible();
    
    // Verify event information is shown
    await expect(page.locator('body')).toContainText(event.title);
  });

  test('should show validation error for empty name', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      description: 'Test description',
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const bookingFormPage = new BookingFormPage(page);
    await bookingFormPage.goto(event.slug, slot);
    
    // Try to submit with empty name
    await bookingFormPage.fillEmail(testGuest.email);
    await bookingFormPage.submitAndExpectError();
    
    // Should show error
    const hasErrors = await bookingFormPage.hasErrors();
    expect(hasErrors).toBe(true);
  });


    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const bookingFormPage = new BookingFormPage(page);
    await bookingFormPage.goto(event.slug, slot);
    
    // Fill form with invalid email
    await bookingFormPage.fillForm({
      name: testGuest.name,
      email: 'invalid-email',
    });
    await bookingFormPage.submitAndExpectError();
    
    // Should show error
    const hasErrors = await bookingFormPage.hasErrors();
    expect(hasErrors).toBe(true);
  });

  test('should successfully create booking with valid data', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      description: 'Test description',
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const bookingFormPage = new BookingFormPage(page);
    await bookingFormPage.goto(event.slug, slot);
    
    // Fill form with valid data
    await bookingFormPage.fillForm({
      name: testGuest.name,
      email: testGuest.email,
      notes: testGuest.notes,
    });
    
    await bookingFormPage.submit();
    
    // Should redirect to success page
    await expect(page).toHaveURL(/.*\/success.*/);
    
    // Success message should be visible
    const successPage = new BookingSuccessPage(page);
    await expect(successPage.successMessage).toBeVisible();
  });

  test('notes field should be optional', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      description: 'Test description',
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    const bookingFormPage = new BookingFormPage(page);
    await bookingFormPage.goto(event.slug, slot);
    
    // Fill form without notes
    await bookingFormPage.fillForm({
      name: testGuest.name,
      email: testGuest.email,
    });
    
    await bookingFormPage.submit();
    
    // Should succeed
    await expect(page).toHaveURL(/.*\/success.*/);
  });

  test('should show conflict error when slot is already booked', async ({ page, request }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      description: 'Test description',
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    // Book the slot first via API
    await createBooking(event.slug, slot, {
      name: 'First User',
      email: 'first@example.com',
    });
    
    // Try to book the same slot via UI
    const bookingFormPage = new BookingFormPage(page);
    await bookingFormPage.goto(event.slug, slot);
    
    await bookingFormPage.fillForm({
      name: testGuest.name,
      email: testGuest.email,
    });
    
    await bookingFormPage.submitAndExpectError();
    
    // Should show error (either as form error or via notification)
    await expect(page.locator('body')).toContainText(/занят|конфликт|conflict/i);
  });
});

test.describe('Booking Success Page - Cancellation', () => {
  test.beforeEach(async () => {
    await clearAllData();
  });

  test('should display booking details on success page', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      description: 'Test description',
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    // Create booking via API
    const booking = await createBooking(event.slug, slot, testGuest);
    
    const successPage = new BookingSuccessPage(page);
    await successPage.goto(booking.id, booking.cancelToken);
    
    // Verify booking details are shown
    await expect(successPage.successMessage).toBeVisible();
    await expect(page.locator('body')).toContainText(event.title);
    await expect(page.locator('body')).toContainText(testGuest.name);
    await expect(page.locator('body')).toContainText(testGuest.email);
  });


    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    // Create booking via API
    const booking = await createBooking(event.slug, slot, testGuest);
    
    const successPage = new BookingSuccessPage(page);
    await successPage.goto(booking.id, booking.cancelToken);
    
    // Cancel the booking
    await successPage.cancelBooking();
    
    // Should show cancelled state
    const isCancelled = await successPage.isCancelledMessageVisible().catch(() => {
      // Alternative: check if cancel button is gone
      return successPage.isCancelButtonVisible().then(v => !v);
    });
    expect(isCancelled).toBe(true);
  });

  test('should show error for invalid cancel token', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      description: 'Test description',
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    // Create booking via API
    const booking = await createBooking(event.slug, slot, testGuest);
    
    // Try to access with invalid token
    const successPage = new BookingSuccessPage(page);
    await successPage.goto(booking.id, 'invalid-token');
    
    // Should show error
    await expect(page.locator('body')).toContainText(/неверн|ошибк|invalid|error/i);
  });

  test('should allow navigating back to home after booking', async ({ page }) => {
    const event = await createEvent({
      title: 'Test Event',
      duration: 30,
      description: 'Test description',
    });
    
    const futureDate = getFutureDate(1);
    const slot = getTimeSlot(futureDate, 10, 0);
    
    // Create booking via API
    const booking = await createBooking(event.slug, slot, testGuest);
    
    const successPage = new BookingSuccessPage(page);
    await successPage.goto(booking.id, booking.cancelToken);
    
    await successPage.goToHome();
    
    // Should be on home page
    await expect(page).toHaveURL('/');
  });

});
