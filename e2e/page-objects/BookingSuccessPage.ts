import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Booking Success Page (/bookings/:id/success?token=...)
 */
export class BookingSuccessPage {
  readonly page: Page;
  readonly successMessage: Locator;
  readonly bookingDetails: Locator;
  readonly cancelButton: Locator;
  readonly copyLinkButton: Locator;
  readonly backToHomeButton: Locator;
  readonly cancelledMessage: Locator;
  readonly confirmDialog: Locator;
  readonly confirmCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.successMessage = page.locator('[data-testid="success-message"], h1:has-text("Успешно"), h1:has-text("Подтверждено")');
    this.bookingDetails = page.locator('[data-testid="booking-details"], .booking-details');
    this.cancelButton = page.locator('button:has-text("Отменить"), button:has-text("Отмена")');
    this.copyLinkButton = page.locator('button:has-text("Скопировать"), button:has-text("ссылку")');
    this.backToHomeButton = page.locator('a:has-text("На главную"), button:has-text("На главную")');
    this.cancelledMessage = page.locator('text=Отменено, text=отменено');
    this.confirmDialog = page.locator('[role="dialog"], .modal, [data-testid="confirm-dialog"]');
    this.confirmCancelButton = page.locator('[role="dialog"] button:has-text("Отменить"), [role="dialog"] button:has-text("Да")');
  }

  async goto(bookingId: string, token: string) {
    await this.page.goto(`/bookings/${bookingId}/success?token=${token}`);
    await this.page.waitForLoadState('networkidle');
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    return this.successMessage.isVisible();
  }

  async getBookingDetails(): Promise<string | null> {
    return this.bookingDetails.textContent();
  }

  async cancelBooking() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
    
    // Confirm cancellation if dialog appears
    const dialogVisible = await this.confirmDialog.isVisible().catch(() => false);
    if (dialogVisible) {
      await this.confirmCancelButton.click();
    }
    
    await this.page.waitForTimeout(500);
  }

  async copyManagementLink(): Promise<string> {
    // Click copy button and return clipboard content
    await this.copyLinkButton.click();
    await this.page.waitForTimeout(300);
    
    // Get the current URL (the management link)
    return this.page.url();
  }

  async goToHome() {
    await this.backToHomeButton.click();
    await this.page.waitForURL('/');
  }

  async isCancelledMessageVisible(): Promise<boolean> {
    return this.cancelledMessage.isVisible();
  }

  async isCancelButtonVisible(): Promise<boolean> {
    return this.cancelButton.isVisible().catch(() => false);
  }
}
