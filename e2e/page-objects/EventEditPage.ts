import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Event Edit Page (/admin/events/:slug/edit)
 */
export class EventEditPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly durationInput: Locator;
  readonly descriptionInput: Locator;
  readonly activeToggle: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessages: Locator;
  readonly confirmDialog: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator('input[name="title"], input[placeholder*="название" i]').first();
    this.slugInput = page.locator('input[name="slug"]');
    this.durationInput = page.locator('input[name="duration"], input[type="number"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.activeToggle = page.locator('input[type="checkbox"], [role="switch"]').first();
    this.saveButton = page.locator('button[type="submit"], button:has-text("Сохранить")');
    this.deleteButton = page.locator('button:has-text("Удалить")');
    this.cancelButton = page.locator('a:has-text("Отмена"), button:has-text("Отмена")');
    this.errorMessages = page.locator('.mantine-TextInput-error, .error, [role="alert"]');
    this.confirmDialog = page.locator('[role="dialog"], .modal, [data-testid="confirm-dialog"]');
    this.confirmDeleteButton = page.locator('[role="dialog"] button:has-text("Удалить"), [role="dialog"] button:has-text("Да")');
  }

  async goto(slug: string) {
    await this.page.goto(`/admin/events/${slug}/edit`);
    await this.page.waitForLoadState('networkidle');
  }

  async fillTitle(title: string) {
    await this.titleInput.clear();
    await this.titleInput.fill(title);
  }

  async fillDuration(duration: number) {
    await this.durationInput.clear();
    await this.durationInput.fill(String(duration));
  }

  async fillDescription(description: string) {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(description);
  }

  async toggleActive(active: boolean) {
    const isChecked = await this.activeToggle.isChecked().catch(() => false);
    if (isChecked !== active) {
      await this.activeToggle.click();
    }
  }

  async updateField(field: 'title' | 'duration' | 'description' | 'active', value: string | number | boolean) {
    switch (field) {
      case 'title':
        await this.fillTitle(String(value));
        break;
      case 'duration':
        await this.fillDuration(Number(value));
        break;
      case 'description':
        await this.fillDescription(String(value));
        break;
      case 'active':
        await this.toggleActive(Boolean(value));
        break;
    }
  }

  async save() {
    await this.saveButton.click();
    await this.page.waitForURL('/admin/events');
  }

  async saveAndExpectError() {
    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async deleteEvent() {
    await this.deleteButton.click();
    await this.page.waitForTimeout(300);
    
    // Confirm deletion if dialog appears
    const dialogVisible = await this.confirmDialog.isVisible().catch(() => false);
    if (dialogVisible) {
      await this.confirmDeleteButton.click();
    }
    
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

  async getTitleValue(): Promise<string | null> {
    return this.titleInput.inputValue();
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
