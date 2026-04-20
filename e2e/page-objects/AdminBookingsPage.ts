import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Admin Bookings List Page (/admin/bookings)
 */
export class AdminBookingsPage {
  readonly page: Page;
  readonly bookings: Locator;
  readonly cancelButtons: Locator;
  readonly emptyState: Locator;
  readonly sidebar: Locator;
  readonly confirmDialog: Locator;
  readonly confirmCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bookings = page.locator('[data-testid="booking-item"], [data-testid="admin-booking"]');
    this.cancelButtons = page.locator('button:has-text("Отменить")');
    this.emptyState = page.locator('[data-testid="empty-state"], text=Нет бронирований');
    this.sidebar = page.locator('[data-testid="sidebar"], nav');
    this.confirmDialog = page.locator('[role="dialog"], .modal, [data-testid="confirm-dialog"]');
    this.confirmCancelButton = page.locator('[role="dialog"] button:has-text("Отменить"), [role="dialog"] button:has-text("Да")');
  }

  async goto() {
    await this.page.goto('/admin/bookings');
    await this.page.waitForLoadState('networkidle');
  }

  async getBookingsCount(): Promise<number> {
    return this.bookings.count();
  }

  async cancelBooking(index: number = 0) {
    await this.cancelButtons.nth(index).click();
    await this.page.waitForTimeout(300);
    
    // Confirm cancellation if dialog appears
    const dialogVisible = await this.confirmDialog.isVisible().catch(() => false);
    if (dialogVisible) {
      await this.confirmCancelButton.click();
    }
    
    await this.page.waitForTimeout(500);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async getBookingDetails(): Promise<string[]> {
    return this.bookings.allTextContents();
  }

  async hasBookingForEvent(eventTitle: string): Promise<boolean> {
    const count = await this.page.locator(`[data-testid="booking-item"]:has-text("${eventTitle}")`).count();
    return count > 0;
  }

  async hasBookingForGuest(guestName: string): Promise<boolean> {
    const count = await this.page.locator(`[data-testid="booking-item"]:has-text("${guestName}")`).count();
    return count > 0;
  }
}
