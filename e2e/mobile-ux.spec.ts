import { test, expect } from '@playwright/test';
import { MomentTestHelpers, DateTestHelpers } from './utils/test-helpers';
import { testMoments, responsiveBreakpoints } from './fixtures/test-data';

test.describe('Mobile UX Tests', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.setMobileViewport();
    await helpers.goto();
  });

  test('floating action button works on mobile', async () => {
    // Floating button should be visible on mobile
    const floatingButton = helpers.floatingAddButton;
    await expect(floatingButton).toBeVisible();
    
    // Should be positioned at bottom-right
    const buttonBox = await floatingButton.boundingBox();
    const viewportSize = helpers.page.viewportSize();
    
    expect(buttonBox?.x).toBeGreaterThan((viewportSize?.width || 0) * 0.8);
    expect(buttonBox?.y).toBeGreaterThan((viewportSize?.height || 0) * 0.8);
    
    // Should open modal when clicked
    await floatingButton.click();
    await expect(helpers.modal).toBeVisible();
  });

  test('touch interactions work properly', async () => {
    await helpers.createMoment(testMoments.basic);
    
    const tile = helpers.getMomentTile(testMoments.basic.title);
    
    // Tap to focus (should work without hover)
    await tile.tap();
    await helpers.expectBannerContent(testMoments.basic.title);
    
    // Action buttons should be visible without hover on mobile
    const editButton = tile.locator('[data-testid="edit-button"]');
    const deleteButton = tile.locator('[data-testid="delete-button"]');
    
    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();
  });

  test('modal is mobile-friendly', async () => {
    await helpers.openAddModal();
    
    const modal = helpers.modal;
    const modalBox = await modal.boundingBox();
    const viewportSize = helpers.page.viewportSize();
    
    // Modal should fit within viewport with proper margins
    expect(modalBox?.width).toBeLessThan((viewportSize?.width || 0) * 0.95);
    expect(modalBox?.height).toBeLessThan((viewportSize?.height || 0) * 0.9);
    
    // Form elements should be touch-friendly
    const titleInput = helpers.titleInput;
    const inputBox = await titleInput.boundingBox();
    
    // Touch target should be at least 44px high
    expect(inputBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('responsive grid shows correct columns on mobile', async () => {
    // Create multiple moments to test grid
    const moments = [
      testMoments.basic,
      testMoments.future,
      testMoments.past,
      testMoments.today,
    ];
    
    for (const moment of moments) {
      await helpers.createMoment(moment);
    }
    
    // Should show 2 columns on mobile
    const gridContainer = helpers.page.locator('[data-testid="moment-grid"]');
    await expect(gridContainer).toHaveClass(/grid-cols-2/);
    
    // Tiles should be properly sized for mobile
    const tiles = helpers.momentTiles;
    const firstTileBox = await tiles.first().boundingBox();
    const viewportWidth = helpers.page.viewportSize()?.width || 0;
    
    // Each tile should be roughly half the viewport width (minus gaps and padding)
    expect(firstTileBox?.width).toBeLessThan(viewportWidth * 0.5);
    expect(firstTileBox?.width).toBeGreaterThan(viewportWidth * 0.4);
  });

  test('mobile navigation and scrolling', async () => {
    // Create many moments to test scrolling
    const manyMoments = Array.from({ length: 10 }, (_, i) => ({
      title: `Moment ${i + 1}`,
      date: DateTestHelpers.getFutureDate(i + 1),
    }));
    
    for (const moment of manyMoments) {
      await helpers.createMoment(moment);
    }
    
    // Should be able to scroll to see all moments
    const lastTile = helpers.getMomentTile('Moment 10');
    
    // Scroll to bottom
    await lastTile.scrollIntoViewIfNeeded();
    await expect(lastTile).toBeVisible();
    
    // Floating button should still be visible after scrolling
    await expect(helpers.floatingAddButton).toBeVisible();
  });

  test('mobile keyboard behavior', async () => {
    await helpers.openAddModal();
    
    // Focus on title input
    await helpers.titleInput.focus();
    
    // Type on mobile keyboard
    await helpers.titleInput.fill('Mobile Test');
    
    // Tab to next field
    await helpers.page.keyboard.press('Tab');
    
    // Should focus on description field
    await expect(helpers.descriptionInput).toBeFocused();
    
    // Tab to date field
    await helpers.page.keyboard.press('Tab');
    await expect(helpers.dateInput).toBeFocused();
  });

  test('mobile form validation display', async () => {
    await helpers.openAddModal();
    
    // Try to submit empty form
    await helpers.saveButton.click();
    
    // Error messages should be visible and properly positioned
    const errorMessage = helpers.page.locator('text=Title is required');
    await expect(errorMessage).toBeVisible();
    
    // Error should not overflow viewport
    const errorBox = await errorMessage.boundingBox();
    const viewportWidth = helpers.page.viewportSize()?.width || 0;
    
    expect(errorBox?.x).toBeGreaterThanOrEqual(0);
    expect((errorBox?.x || 0) + (errorBox?.width || 0)).toBeLessThanOrEqual(viewportWidth);
  });
});

test.describe('Responsive Layout Tests', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  responsiveBreakpoints.forEach(({ name, width, height, expectedColumns }) => {
    test(`${name} layout shows ${expectedColumns} columns`, async () => {
      await helpers.page.setViewportSize({ width, height });
      
      // Create enough moments to test grid layout
      const moments = Array.from({ length: expectedColumns * 2 }, (_, i) => ({
        title: `Moment ${i + 1}`,
        date: DateTestHelpers.getFutureDate(i + 1),
      }));
      
      for (const moment of moments) {
        await helpers.createMoment(moment);
      }
      
      // Check grid class based on breakpoint
      const gridContainer = helpers.page.locator('[data-testid="moment-grid"]');
      
      if (name === 'mobile') {
        await expect(gridContainer).toHaveClass(/grid-cols-2/);
      } else if (name === 'tablet') {
        await expect(gridContainer).toHaveClass(/sm:grid-cols-3/);
      } else if (name === 'desktop') {
        await expect(gridContainer).toHaveClass(/lg:grid-cols-5/);
      } else if (name === 'large desktop') {
        await expect(gridContainer).toHaveClass(/xl:grid-cols-6/);
      }
    });
  });

  test('layout transitions smoothly between breakpoints', async () => {
    // Create test moments
    const moments = [testMoments.basic, testMoments.future, testMoments.past];
    for (const moment of moments) {
      await helpers.createMoment(moment);
    }
    
    // Start at mobile
    await helpers.setMobileViewport();
    await helpers.page.waitForTimeout(300);
    
    // Transition to tablet
    await helpers.setTabletViewport();
    await helpers.page.waitForTimeout(300);
    
    // All moments should still be visible
    await helpers.expectMomentCount(3);
    
    // Transition to desktop
    await helpers.setDesktopViewport();
    await helpers.page.waitForTimeout(300);
    
    // All moments should still be visible
    await helpers.expectMomentCount(3);
  });

  test('banner adapts to different screen sizes', async () => {
    await helpers.createMoment(testMoments.today);
    
    const banner = helpers.banner;
    
    // Test mobile banner
    await helpers.setMobileViewport();
    await helpers.page.waitForTimeout(300);
    
    if (await banner.isVisible()) {
      const mobileBox = await banner.boundingBox();
      const mobileViewport = helpers.page.viewportSize();
      
      expect(mobileBox?.width).toBeLessThanOrEqual(mobileViewport?.width || 0);
    }
    
    // Test desktop banner
    await helpers.setDesktopViewport();
    await helpers.page.waitForTimeout(300);
    
    if (await banner.isVisible()) {
      const desktopBox = await banner.boundingBox();
      const desktopViewport = helpers.page.viewportSize();
      
      expect(desktopBox?.width).toBeLessThanOrEqual(desktopViewport?.width || 0);
    }
  });
});