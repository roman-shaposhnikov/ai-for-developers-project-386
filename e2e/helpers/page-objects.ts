/**
 * Page Object Models для E2E тестов
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

// ─── Public Pages ───

export class PublicEventsListPage {
  readonly page: Page;
  readonly eventCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eventCards = page.locator('[data-testid="event-card"], .event-card');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state');
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectLoaded() {
    await expect(this.page).toHaveTitle(/Запись на звонок|Book a Call|События/);
  }

  getEventCardBySlug(slug: string): Locator {
    return this.page.locator(`[data-testid="event-card-${slug}"], [data-slug="${slug}"]`);
  }

  async clickEventCard(slug: string) {
    const card = this.getEventCardBySlug(slug);
    await card.click();
  }

  async clickBookButton(slug: string) {
    const card = this.getEventCardBySlug(slug);
    const button = card.locator('button:has-text("Выбрать время"), button:has-text("Book")');
    await button.click();
  }

  async expectEventVisible(slug: string) {
    const card = this.getEventCardBySlug(slug);
    await expect(card).toBeVisible();
  }
}

export class EventBookingPage {
  readonly page: Page;
  readonly calendar: Locator;
  readonly timeSlots: Locator;
  readonly selectedDateDisplay: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.calendar = page.locator('[data-testid="calendar"], .calendar');
    this.timeSlots = page.locator('[data-testid="time-slot"], .time-slot');
    this.selectedDateDisplay = page.locator('[data-testid="selected-date"], .selected-date');
    this.backLink = page.locator('a:has-text("Назад"), a:has-text("Back")');
  }

  async goto(slug: string) {
    await this.page.goto(`/e/${slug}`);
  }

  async expectLoaded() {
    await expect(this.calendar).toBeVisible();
  }

  async selectDate(dateStr: string) {
    // dateStr в формате YYYY-MM-DD
    const dateCell = this.page.locator(`[data-date="${dateStr}"], [data-testid="date-${dateStr}"]`);
    await dateCell.click();
  }

  async selectTimeSlot(time: string) {
    // time в формате HH:MM
    const slot = this.page.locator(`[data-time="${time}"], button:has-text("${time}")`).first();
    await slot.click();
  }

  async getAvailableSlots(): Promise<Locator[]> {
    return this.timeSlots.all();
  }

  async expectNoSlotsAvailable() {
    await expect(this.page.locator('text=нет свободного времени, text=no available slots')).toBeVisible();
  }
}

export class BookingFormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly notesInput: Locator;
  readonly submitButton: Locator;
  readonly backLink: Locator;
  readonly selectedTimeCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"], input[placeholder*="имя" i], input[placeholder*="name" i]').first();
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first();
    this.notesInput = page.locator('textarea[name="notes"], textarea');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Подтвердить"), button:has-text("Confirm")');
    this.backLink = page.locator('a:has-text("Назад"), a:has-text("Back")');
    this.selectedTimeCard = page.locator('[data-testid="selected-time"], .selected-time');
  }

  async goto(slug: string, slot: string) {
    await this.page.goto(`/e/${slug}/book?slot=${encodeURIComponent(slot)}`);
  }

  async expectLoaded() {
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
  }

  async fillGuestInfo(guest: { name: string; email: string; notes?: string }) {
    await this.nameInput.fill(guest.name);
    await this.emailInput.fill(guest.email);
    if (guest.notes && await this.notesInput.isVisible()) {
      await this.notesInput.fill(guest.notes);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectValidationError(_field: 'name' | 'email', message?: string) {
    const errorSelector = message 
      ? `text=${message}` 
      : '[data-testid="error"], .error, .mantine-InputWrapper-error';
    await expect(this.page.locator(errorSelector).first()).toBeVisible();
  }
}

export class BookingSuccessPage {
  readonly page: Page;
  readonly confirmationCard: Locator;
  readonly cancelButton: Locator;
  readonly copyLinkButton: Locator;
  readonly bookAgainButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.confirmationCard = page.locator('[data-testid="booking-confirmation"], .booking-confirmation');
    this.cancelButton = page.locator('button:has-text("Отменить"), button:has-text("Cancel")');
    this.copyLinkButton = page.locator('button:has-text("Копировать"), button:has-text("Copy")');
    this.bookAgainButton = page.locator('button:has-text("Забронировать"), button:has-text("Book again")');
  }

  async expectLoaded() {
    await expect(this.confirmationCard).toBeVisible();
    await expect(this.page.locator('text=подтверждено, text=confirmed')).toBeVisible();
  }

  async expectBookingDetailsVisible(guestName: string, eventTitle?: string) {
    await expect(this.page.locator(`text=${guestName}`)).toBeVisible();
    if (eventTitle) {
      await expect(this.page.locator(`text=${eventTitle}`)).toBeVisible();
    }
  }

  async cancelBooking() {
    await this.cancelButton.click();
  }

  async expectCancellationSuccess() {
    await expect(this.page.locator('text=отменено, text=cancelled')).toBeVisible();
  }
}

// ─── Admin Pages ───

export class AdminEventsListPage {
  readonly page: Page;
  readonly eventsList: Locator;
  readonly newEventButton: Locator;
  readonly eventCards: Locator;
  readonly sidebar: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eventsList = page.locator('[data-testid="events-list"], .events-list');
    this.newEventButton = page.locator('a:has-text("New"), a:has-text("Создать"), button:has-text("New")');
    this.eventCards = page.locator('[data-testid="event-card-admin"], .event-card');
    this.sidebar = page.locator('[data-testid="sidebar"], aside');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state, text=Нет событий, text=No events');
  }

  async goto() {
    await this.page.goto('/admin/events');
  }

  async expectLoaded() {
    await expect(this.page).toHaveTitle(/Event types|Типы событий|Admin/);
    await expect(this.sidebar).toBeVisible();
  }

  getEventCardBySlug(slug: string): Locator {
    return this.page.locator(`[data-testid="event-${slug}"], [data-slug="${slug}"]`);
  }

  async clickNewEvent() {
    await this.newEventButton.click();
  }

  async clickEditEvent(slug: string) {
    const card = this.getEventCardBySlug(slug);
    const editButton = card.locator('button[title="Edit"], button:has-text("Edit"), button:has-text("Редактировать")');
    await editButton.click();
  }

  async toggleEventActive(slug: string) {
    const card = this.getEventCardBySlug(slug);
    const toggle = card.locator('input[type="checkbox"], [role="switch"], .mantine-Switch-input');
    await toggle.click();
  }

  async clickDeleteEvent(slug: string) {
    const card = this.getEventCardBySlug(slug);
    const menuButton = card.locator('button[title="Menu"], button:has-text("⋯"), [data-testid="menu-button"]');
    await menuButton.click();
    const deleteButton = this.page.locator('text=Delete, text=Удалить');
    await deleteButton.click();
  }

  async expectEventVisible(slug: string) {
    await expect(this.getEventCardBySlug(slug)).toBeVisible();
  }

  async expectEventNotVisible(slug: string) {
    await expect(this.getEventCardBySlug(slug)).not.toBeVisible();
  }
}

export class EventCreatePage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly durationInput: Locator;
  readonly descriptionInput: Locator;
  readonly activeSwitch: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator('input[name="title"], input[placeholder*="Title"]').first();
    this.slugInput = page.locator('input[name="slug"], input[placeholder*="slug" i]').first();
    this.durationInput = page.locator('input[name="duration"], input[type="number"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.activeSwitch = page.locator('input[name="active"], [role="switch"]').first();
    this.submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Создать")');
    this.cancelButton = page.locator('a:has-text("Cancel"), a:has-text("Отмена"), button:has-text("Cancel")');
  }

  async goto() {
    await this.page.goto('/admin/events/new');
  }

  async expectLoaded() {
    await expect(this.titleInput).toBeVisible();
    await expect(this.slugInput).toBeVisible();
  }

  async fillForm(data: {
    title: string;
    slug: string;
    duration: number;
    description: string;
    active?: boolean;
  }) {
    await this.titleInput.fill(data.title);
    await this.slugInput.fill(data.slug);
    await this.durationInput.fill(data.duration.toString());
    await this.descriptionInput.fill(data.description);
    if (data.active !== undefined && await this.activeSwitch.isVisible()) {
      const isChecked = await this.activeSwitch.isChecked();
      if (isChecked !== data.active) {
        await this.activeSwitch.click();
      }
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async expectSlugValidationError() {
    await expect(this.page.locator('text=уже существует, text=already taken, text=SLUG_TAKEN')).toBeVisible();
  }
}

export class EventEditPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly durationInput: Locator;
  readonly descriptionInput: Locator;
  readonly activeSwitch: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator('input[name="title"]').first();
    this.slugInput = page.locator('input[name="slug"]').first();
    this.durationInput = page.locator('input[name="duration"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.activeSwitch = page.locator('input[name="active"], [role="switch"]').first();
    this.saveButton = page.locator('button:has-text("Save"), button:has-text("Сохранить")');
    this.deleteButton = page.locator('button:has-text("Delete"), button:has-text("Удалить")');
    this.cancelButton = page.locator('a:has-text("Cancel"), button:has-text("Cancel")');
  }

  async goto(slug: string) {
    await this.page.goto(`/admin/events/${slug}/edit`);
  }

  async expectLoaded() {
    await expect(this.titleInput).toBeVisible();
  }

  async expectSlugDisabled() {
    await expect(this.slugInput).toBeDisabled();
  }

  async updateTitle(title: string) {
    await this.titleInput.clear();
    await this.titleInput.fill(title);
  }

  async updateDuration(duration: number) {
    await this.durationInput.clear();
    await this.durationInput.fill(duration.toString());
  }

  async toggleActive() {
    await this.activeSwitch.click();
  }

  async save() {
    await this.saveButton.click();
  }

  async delete() {
    await this.deleteButton.click();
    // Handle browser confirm dialog
    this.page.on('dialog', dialog => dialog.accept());
  }

  async expectDeleteBlockedError() {
    await expect(this.page.locator('text=active bookings, text=активные бронирования')).toBeVisible();
  }
}
