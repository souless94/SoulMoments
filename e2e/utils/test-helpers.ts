import { Page, Locator, expect } from '@playwright/test';

/**
 * Test utilities and helper functions for E2E tests
 */

export class MomentTestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  // Element selectors
  get addButton() {
    return this.page.locator('button').filter({ hasText: '' }).last(); // Floating button with Plus icon
  }

  get floatingAddButton() {
    return this.page.locator('button[aria-label="Add new moment"]');
  }

  get modal() {
    return this.page.getByRole('dialog');
  }

  get titleInput() {
    return this.page.locator('#title');
  }

  get descriptionInput() {
    return this.page.locator('#description');
  }

  get dateInput() {
    return this.page.locator('#date');
  }

  get repeatSelect() {
    return this.page.getByRole('combobox');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: /save moment/i });
  }

  get cancelButton() {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  get momentTiles() {
    return this.page.locator('[role="button"]').filter({ hasText: /\d{4}/ }); // Cards with dates
  }

  get banner() {
    return this.page.locator('.bg-gradient-to-r'); // Banner with gradient background
  }

  get toast() {
    return this.page.locator('[data-sonner-toast]');
  }

  // Action helpers
  async openAddModal() {
    // Click the floating add button
    await this.floatingAddButton.click();
    await expect(this.modal).toBeVisible();
  }

  async fillMomentForm(data: {
    title: string;
    description?: string;
    date: string;
    repeatFrequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  }) {
    await this.titleInput.fill(data.title);
    
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    
    await this.dateInput.fill(data.date);
    
    if (data.repeatFrequency && data.repeatFrequency !== 'none') {
      await this.repeatSelect.click();
      await this.page.getByRole('option', { name: new RegExp(data.repeatFrequency, 'i') }).click();
    }
  }

  async createMoment(data: {
    title: string;
    description?: string;
    date: string;
    repeatFrequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  }) {
    await this.openAddModal();
    await this.fillMomentForm(data);
    await this.saveButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async editMoment(momentTitle: string, newData: Partial<{
    title: string;
    description: string;
    date: string;
    repeatFrequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  }>) {
    const tile = this.getMomentTile(momentTitle);
    // Click the edit button (bottom right of tile)
    await tile.locator('button').filter({ hasText: '' }).nth(1).click(); // Second button is edit
    await expect(this.modal).toBeVisible();
    
    if (newData.title) {
      await this.titleInput.clear();
      await this.titleInput.fill(newData.title);
    }
    if (newData.description !== undefined) {
      await this.descriptionInput.clear();
      await this.descriptionInput.fill(newData.description);
    }
    if (newData.date) {
      await this.dateInput.fill(newData.date);
    }
    if (newData.repeatFrequency) {
      await this.repeatSelect.click();
      await this.page.getByRole('option', { name: new RegExp(newData.repeatFrequency, 'i') }).click();
    }
    
    await this.saveButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async deleteMoment(momentTitle: string, confirmUndo = false) {
    const tile = this.getMomentTile(momentTitle);
    // Click the delete button (top right of tile, first button)
    await tile.locator('button').first().click();
    
    // Wait for toast to appear
    await expect(this.toast).toBeVisible();
    
    if (confirmUndo) {
      await this.page.getByRole('button', { name: /undo/i }).click();
    }
  }

  async focusMoment(momentTitle: string) {
    const tile = this.getMomentTile(momentTitle);
    await tile.click();
    // Verify banner shows focused moment
    await expect(this.banner).toContainText(momentTitle);
  }

  getMomentTile(title: string): Locator {
    return this.page.locator('[role="button"]').filter({ hasText: title }).first();
  }

  async waitForMomentToAppear(title: string) {
    await expect(this.getMomentTile(title)).toBeVisible();
  }

  async waitForMomentToDisappear(title: string) {
    await expect(this.getMomentTile(title)).not.toBeVisible();
  }

  // Viewport helpers
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  // Offline helpers
  async goOffline() {
    await this.page.context().setOffline(true);
  }

  async goOnline() {
    await this.page.context().setOffline(false);
  }

  // Validation helpers
  async expectMomentCount(count: number) {
    await expect(this.momentTiles).toHaveCount(count);
  }

  async expectMomentExists(title: string) {
    await expect(this.getMomentTile(title)).toBeVisible();
  }

  async expectMomentNotExists(title: string) {
    await expect(this.getMomentTile(title)).not.toBeVisible();
  }

  async expectToastMessage(message: string) {
    await expect(this.toast).toContainText(message);
  }

  async expectBannerContent(content: string) {
    if (await this.banner.isVisible()) {
      await expect(this.banner).toContainText(content);
    }
  }

  // Form validation helpers
  async expectFormError(fieldName: string, errorMessage: string) {
    const errorElement = this.page.locator(`text=${errorMessage}`);
    await expect(errorElement).toBeVisible();
  }

  async expectFormValid() {
    await expect(this.saveButton).toBeEnabled();
  }

  async expectFormInvalid() {
    await expect(this.saveButton).toBeDisabled();
  }

  // Page access helpers
  getPage() {
    return this.page;
  }

  async getViewportSize() {
    return this.page.viewportSize();
  }

  async waitForTimeout(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }
}

/**
 * PWA-specific test helpers
 */
export class PWATestHelpers {
  constructor(private page: Page) {}

  async expectServiceWorkerRegistered() {
    const swRegistration = await this.page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });
    expect(swRegistration).toBeTruthy();
  }

  async expectManifestLoaded() {
    const manifest = await this.page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });
    expect(manifest).toBeTruthy();
  }

  async expectOfflineCapable() {
    // Check if app works when offline
    await this.page.context().setOffline(true);
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    
    // Should still be able to navigate and see content
    const body = await this.page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    await this.page.context().setOffline(false);
  }

  async expectInstallPrompt() {
    // Check for PWA install prompt capability
    const beforeInstallPrompt = await this.page.evaluate(() => {
      return 'onbeforeinstallprompt' in window;
    });
    expect(beforeInstallPrompt).toBe(true);
  }
}

/**
 * Date and time helpers for consistent testing
 */
export class DateTestHelpers {
  static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  static getFutureDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  static getPastDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  static formatDisplayDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}