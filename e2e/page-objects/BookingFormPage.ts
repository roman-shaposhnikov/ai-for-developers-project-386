import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Booking Form Page (/e/:slug/book?slot=...)
 */
export class BookingFormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly notesInput: Locator;
  readonly submitButton: Locator;
  readonly backButton: Locator;
  readonly errorMessages: Locator;
  readonly eventTitle: Locator;
  readonly selectedTime: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('[data-testid="name-input"]');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.notesInput = page.locator('[data-testid="notes-input"]');
    this.submitButton = page.locator('[data-testid="submit-booking"]');
    this.backButton = page.locator('a:has-text("Назад"), button:has-text("Назад")');
    this.errorMessages = page.locator('.mantine-TextInput-error, .error, [role="alert"]');
    this.eventTitle = page.locator('[data-testid="event-title"], h1');
    this.selectedTime = page.locator('[data-testid="selected-time"], .selected-time');
  }

  async goto(slug: string, slot?: string) {
    const url = slot ? `/e/${slug}/book?slot=${encodeURIComponent(slot)}` : `/e/${slug}/book`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillNotes(notes: string) {
    await this.notesInput.fill(notes);
  }

  async fillForm(data: { name: string; email: string; notes?: string }) {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    if (data.notes) {
      await this.fillNotes(data.notes);
    }
  }

  async submit() {
    await this.submitButton.click();
    await this.page.waitForURL(/.*\/success.*/);
  }

  async submitAndExpectError() {
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async goBack() {
    await this.backButton.click();
  }

  async getErrorMessages(): Promise<string[]> {
    return this.errorMessages.allTextContents();
  }

  async hasErrors(): Promise<boolean> {
    const count = await this.errorMessages.count();
    return count > 0;
  }

  async getEventTitle(): Promise<string | null> {
    return this.eventTitle.textContent();
  }

  async getSelectedTime(): Promise<string | null> {
    return this.selectedTime.textContent();
  }
}
