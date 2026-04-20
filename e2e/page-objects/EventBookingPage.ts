import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Event Booking Page (/e/:slug)
 * Calendar and time slot selection
 */
export class EventBookingPage {
  readonly page: Page;
  readonly eventTitle: Locator;
  readonly eventDescription: Locator;
  readonly calendar: Locator;
  readonly timeSlots: Locator;
  readonly noSlotsMessage: Locator;
  readonly bookButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eventTitle = page.locator('[data-testid="event-title"], h1');
    this.eventDescription = page.locator('[data-testid="event-description"]');
    this.calendar = page.locator('[data-testid="calendar"], .mantine-DatePicker-calendar');
    this.timeSlots = page.locator('[data-testid="time-slot"], button:has-text(":")');
    this.noSlotsMessage = page.locator('[data-testid="no-slots"], text=Нет доступного времени');
    this.bookButton = page.locator('button:has-text("Записаться"), button:has-text("Продолжить")');
    this.backButton = page.locator('a:has-text("Назад"), button:has-text("Назад")');
  }

  async goto(slug: string) {
    await this.page.goto(`/e/${slug}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getEventTitle(): Promise<string | null> {
    return this.eventTitle.textContent();
  }

  async selectDate(date: string) {
    // date format: YYYY-MM-DD
    const dateCell = this.page.locator(`button[aria-label*="${date}"], td:has-text("${parseInt(date.split('-')[2])}")`).first();
    await dateCell.click();
    await this.page.waitForTimeout(500); // Wait for slots to load
  }

  async selectToday() {
    const today = new Date().getDate();
    const todayCell = this.page.locator(`td:has-text("${today}")`).first();
    await todayCell.click();
    await this.page.waitForTimeout(500);
  }

  async selectFutureDate(daysFromNow: number = 1) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const day = date.getDate();
    
    // Try to navigate to next month if needed
    const monthName = date.toLocaleString('ru-RU', { month: 'long' });
    const currentMonth = await this.page.locator('.mantine-DatePicker-month').textContent();
    
    if (currentMonth && !currentMonth.toLowerCase().includes(monthName.toLowerCase())) {
      // Click next month button
      await this.page.locator('button[aria-label="Next month"]').click();
      await this.page.waitForTimeout(300);
    }
    
    const dateCell = this.page.locator(`td:has-text("${day}")`).first();
    await dateCell.click();
    await this.page.waitForTimeout(500);
  }

  async getAvailableSlotsCount(): Promise<number> {
    return this.timeSlots.count();
  }

  async selectTimeSlot(index: number = 0) {
    await this.timeSlots.nth(index).click();
  }

  async selectTimeSlotByTime(time: string) {
    // time format: "09:00"
    await this.page.locator(`button:has-text("${time}")`).click();
  }

  async clickBook() {
    await this.bookButton.click();
    await this.page.waitForURL(/.*\/book/);
  }

  async isNoSlotsMessageVisible(): Promise<boolean> {
    return this.noSlotsMessage.isVisible();
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL('/');
  }

  async isPastDateDisabled(date: string): Promise<boolean> {
    const dateCell = this.page.locator(`button[aria-label*="${date}"], td:has-text("${parseInt(date.split('-')[2])}")`).first();
    const isDisabled = await dateCell.evaluate((el) => 
      el.hasAttribute('disabled') || el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true'
    );
    return isDisabled;
  }
}
