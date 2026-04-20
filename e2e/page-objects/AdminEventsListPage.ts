import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Admin Events List Page (/admin/events)
 */
export class AdminEventsListPage {
  readonly page: Page;
  readonly events: Locator;
  readonly createEventButton: Locator;
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  readonly emptyState: Locator;
  readonly sidebar: Locator;
  readonly navEvents: Locator;
  readonly navBookings: Locator;
  readonly navSchedule: Locator;

  constructor(page: Page) {
    this.page = page;
    this.events = page.locator('[data-testid="admin-event"], [data-testid="event-item"]');
    this.createEventButton = page.locator('a:has-text("Новое событие"), button:has-text("Новое событие"), a[href*="/new"]');
    this.editButtons = page.locator('a:has-text("Редактировать"), button:has-text("Редактировать")');
    this.deleteButtons = page.locator('button:has-text("Удалить")');
    this.emptyState = page.locator('[data-testid="empty-state"], text=Нет событий');
    this.sidebar = page.locator('[data-testid="sidebar"], nav');
    this.navEvents = page.locator('a[href="/admin/events"], nav a:has-text("События")');
    this.navBookings = page.locator('a[href="/admin/bookings"], nav a:has-text("Бронирования")');
    this.navSchedule = page.locator('a[href="/admin/schedule"], nav a:has-text("Расписание")');
  }

  async goto() {
    await this.page.goto('/admin/events');
    await this.page.waitForLoadState('networkidle');
  }

  async getEventsCount(): Promise<number> {
    return this.events.count();
  }

  async clickCreateEvent() {
    await this.createEventButton.click();
    await this.page.waitForURL('/admin/events/new');
  }

  async clickEditEvent(index: number = 0) {
    await this.editButtons.nth(index).click();
    await this.page.waitForURL(/.*\/edit/);
  }

  async clickEditEventByTitle(title: string) {
    const eventCard = this.page.locator(`[data-testid="admin-event"]:has-text("${title}")`);
    const editButton = eventCard.locator('a:has-text("Редактировать"), button:has-text("Редактировать")');
    await editButton.click();
    await this.page.waitForURL(/.*\/edit/);
  }

  async clickDeleteEvent(index: number = 0) {
    await this.deleteButtons.nth(index).click();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async getEventTitles(): Promise<string[]> {
    return this.events.allTextContents();
  }

  async hasEventWithTitle(title: string): Promise<boolean> {
    const count = await this.page.locator(`[data-testid="admin-event"]:has-text("${title}")`).count();
    return count > 0;
  }

  async gotoBookings() {
    await this.navBookings.click();
    await this.page.waitForURL('/admin/bookings');
  }

  async gotoSchedule() {
    await this.navSchedule.click();
    await this.page.waitForURL('/admin/schedule');
  }
}
