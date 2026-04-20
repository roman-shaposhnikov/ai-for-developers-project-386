import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Public Events List Page (/)
 */
export class PublicEventsListPage {
  readonly page: Page;
  readonly eventCards: Locator;
  readonly emptyState: Locator;
  readonly adminButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eventCards = page.locator('[data-testid="event-card"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.adminButton = page.locator('a[href="/admin/events"], a:has-text("Админ-панель")');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async getEventCount(): Promise<number> {
    return this.eventCards.count();
  }

  async clickEventCard(index: number = 0) {
    await this.eventCards.nth(index).click();
  }

  async clickEventByTitle(title: string) {
    await this.page.locator(`[data-testid="event-card"]:has-text("${title}") [data-testid="select-time-button"]`).click();
  }

  async getEventCardTitles(): Promise<string[]> {
    return this.eventCards.allTextContents();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async isErrorVisible(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async hasEventWithTitle(title: string): Promise<boolean> {
    const count = await this.page.locator(`[data-testid="event-card"] [data-testid="event-title"]:has-text("${title}")`).count();
    return count > 0;
  }

  async gotoAdmin() {
    await this.adminButton.click();
    await this.page.waitForURL('/admin/events');
  }
}
