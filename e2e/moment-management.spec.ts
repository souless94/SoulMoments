import { test, expect } from '@playwright/test';
import { MomentTestHelpers } from './utils/test-helpers';
import { testMoments } from './fixtures/test-data';

test.describe('Moment Management Workflow', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('manages multiple moments with proper sorting', async () => {
    // Create moments in different time periods
    await helpers.createMoment(testMoments.past);
    await helpers.createMoment(testMoments.today);
    await helpers.createMoment(testMoments.future);

    // Verify all moments are visible
    await helpers.expectMomentCount(3);
    
    // Verify sorting: today and future first, then past
    const tiles = helpers.momentTiles;
    const firstTile = tiles.first();
    
    // Today or future moment should be first
    await expect(firstTile).not.toContainText(testMoments.past.title);
    
    // Past moment should be after separator
    const separator = helpers.page.locator('text=Past Moments');
    await expect(separator).toBeVisible();
  });

  test('banner shows key moment information', async () => {
    await helpers.createMoment(testMoments.today);
    await helpers.createMoment(testMoments.future);
    await helpers.createMoment(testMoments.past);

    const banner = helpers.banner;
    
    // Should show today's moment
    await expect(banner).toContainText(testMoments.today.title);
    
    // Should show upcoming count
    await expect(banner).toContainText('upcoming');
    
    // Should show past count
    await expect(banner).toContainText('past');
  });

  test('focus functionality changes banner display', async () => {
    await helpers.createMoment(testMoments.basic);
    await helpers.createMoment(testMoments.future);

    // Focus on specific moment
    await helpers.focusMoment(testMoments.basic.title);
    
    // Banner should highlight focused moment
    const banner = helpers.banner;
    await expect(banner).toContainText(testMoments.basic.title);
    
    // Focus on different moment
    await helpers.focusMoment(testMoments.future.title);
    await expect(banner).toContainText(testMoments.future.title);
  });

  test('handles empty state gracefully', async () => {
    // Should show empty state when no moments exist
    await helpers.expectMomentCount(0);
    
    // Banner should be hidden or show empty state
    const banner = helpers.banner;
    if (await banner.isVisible()) {
      await expect(banner).toContainText('No moments');
    }
  });

  test('bulk operations and state management', async () => {
    // Create multiple moments
    const moments = [testMoments.basic, testMoments.future, testMoments.past];
    
    for (const moment of moments) {
      await helpers.createMoment(moment);
    }
    
    await helpers.expectMomentCount(3);
    
    // Delete all moments one by one
    for (const moment of moments) {
      await helpers.deleteMoment(moment.title);
      await helpers.page.waitForTimeout(6000); // Let toast expire
    }
    
    await helpers.expectMomentCount(0);
  });

  test('moment interactions do not conflict', async () => {
    await helpers.createMoment(testMoments.basic);
    
    const tile = helpers.getMomentTile(testMoments.basic.title);
    
    // Hover to show action buttons
    await tile.hover();
    
    // Verify both edit and delete buttons are visible
    await expect(tile.locator('button').nth(0)).toBeVisible(); // Delete button
    await expect(tile.locator('button').nth(1)).toBeVisible(); // Edit button
    
    // Click tile (should focus, not trigger edit)
    await tile.click();
    await helpers.expectBannerContent(testMoments.basic.title);
    
    // Modal should not be open
    await expect(helpers.modal).not.toBeVisible();
    
    // Now click edit button specifically
    await tile.hover();
    await tile.locator('button').nth(1).click(); // Edit button
    await expect(helpers.modal).toBeVisible();
  });
});

test.describe('Grid Layout and Responsive Behavior', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('responsive grid adapts to screen size', async () => {
    // Create enough moments to test grid layout
    const moments = [
      testMoments.basic,
      testMoments.future,
      testMoments.past,
      testMoments.today,
    ];
    
    for (const moment of moments) {
      await helpers.createMoment(moment);
    }

    // Test mobile layout
    await helpers.setMobileViewport();
    await helpers.page.waitForTimeout(500); // Allow layout to adjust
    
    // Should show 2 columns on mobile
    const gridContainer = helpers.page.locator('.grid').first();
    await expect(gridContainer).toHaveClass(/grid-cols-2/);

    // Test tablet layout
    await helpers.setTabletViewport();
    await helpers.page.waitForTimeout(500);
    
    // Should show 3 columns on tablet
    await expect(gridContainer).toHaveClass(/sm:grid-cols-3/);

    // Test desktop layout
    await helpers.setDesktopViewport();
    await helpers.page.waitForTimeout(500);
    
    // Should show more columns on desktop
    await expect(gridContainer).toHaveClass(/lg:grid-cols-5/);
  });

  test('tiles maintain proper spacing and sizing', async () => {
    await helpers.createMoment(testMoments.basic);
    
    const tile = helpers.getMomentTile(testMoments.basic.title);
    
    // Verify minimum height
    const boundingBox = await tile.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(80); // min-h-[80px]
    
    // Verify tile has proper spacing
    await expect(tile).toHaveCSS('margin', /\d+px/);
  });

  test('past moments separator appears correctly', async () => {
    // Create only future moments - no separator should appear
    await helpers.createMoment(testMoments.future);
    await helpers.createMoment(testMoments.today);
    
    const separator = helpers.page.locator('text=Past Moments');
    await expect(separator).not.toBeVisible();
    
    // Add a past moment - separator should appear
    await helpers.createMoment(testMoments.past);
    await expect(separator).toBeVisible();
  });
});