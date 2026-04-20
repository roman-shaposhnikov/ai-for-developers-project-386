import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Event Create Page (/admin/events/new)
 */
export class EventCreatePage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly durationInput: Locator;
  readonly descriptionInput: Locator;
  readonly activeToggle: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator('input[name="title"], input[placeholder*="название" i]').first();
    this.slugInput = page.locator('input[name="slug"]');
    this.durationInput = page.locator('input[name="duration"], input[type="number"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.activeToggle = page.locator('input[type="checkbox"], [role="switch"]').first();
    this.submitButton = page.locator('button[type="submit"], button:has-text("Сохранить"), button:has-text("Создать")');
    this.cancelButton = page.locator('a:has-text("Отмена"), button:has-text("Отмена")');
    this.errorMessages = page.locator('.mantine-TextInput-error, .error, [role="alert"]');
  }

  async goto() {
    await this.page.goto('/admin/events/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillSlug(slug: string) {
    await this.slugInput.fill(slug);
  }

  async fillDuration(duration: number) {
    await this.durationInput.fill(String(duration));
  }

  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async toggleActive(active: boolean) {
    const isChecked = await this.activeToggle.isChecked().catch(() => false);
    if (isChecked !== active) {
      await this.activeToggle.click();
    }
  }

  async fillForm(data: {
    title: string;
    slug?: string;
    duration: number;
    description?: string;
    active?: boolean;
  }) {
    await this.fillTitle(data.title);
    if (data.slug) {
      await this.fillSlug(data.slug);
    }
    await this.fillDuration(data.duration);
    if (data.description) {
      await this.fillDescription(data.description);
    }
    if (data.active !== undefined) {
      await this.toggleActive(data.active);
    }
  }

  async submit() {
    await this.submitButton.click();
    await this.page.waitForURL('/admin/events');
  }

  async submitAndExpectError() {
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancel() {
    await this.cancelButton.click();
    await this.page.waitForURL('/admin/events');
  }

  async getErrorMessages(): Promise<string[]> {
    return this.errorMessages.allTextContents();
  }

  async hasErrors(): Promise<boolean> {
    const count = await this.errorMessages.count();
    return count > 0;
  }

  async getSlugValue(): Promise<string | null> {
    return this.slugInput.inputValue();
  }

  async isSlugReadOnly(): Promise<boolean> {
    const readonly = await this.slugInput.getAttribute('readonly');
    const disabled = await this.slugInput.isDisabled().catch(() => false);
    return readonly !== null || disabled;
  }
}
