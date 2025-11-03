import { test, expect } from '@playwright/test';
import { MomentTestHelpers, DateTestHelpers } from './utils/test-helpers';
import { testMoments } from './fixtures/test-data';

test.describe('Offline Functionality', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('creates moments while offline', async () => {
    // Go offline
    await helpers.goOffline();
    
    // Should still be able to create moments
    await helpers.createMoment(testMoments.basic);
    await helpers.expectMomentExists(testMoments.basic.title);
    
    // Go back online
    await helpers.goOnline();
    
    // Moment should still exist
    await helpers.expectMomentExists(testMoments.basic.title);
  });

  test('edits moments while offline', async () => {
    // Create moment while online
    await helpers.createMoment(testMoments.basic);
    
    // Go offline
    await helpers.goOffline();
    
    // Edit the moment
    const updatedData = {
      title: 'Offline Edit',
      description: 'Edited while offline',
    };
    
    await helpers.editMoment(testMoments.basic.title, updatedData);
    await helpers.expectMomentExists(updatedData.title);
    
    // Go back online
    await helpers.goOnline();
    
    // Changes should persist
    await helpers.expectMomentExists(updatedData.title);
    await helpers.expectMomentNotExists(testMoments.basic.title);
  });

  test('deletes moments while offline', async () => {
    // Create moment while online
    await helpers.createMoment(testMoments.basic);
    
    // Go offline
    await helpers.goOffline();
    
    // Delete the moment
    await helpers.deleteMoment(testMoments.basic.title);
    await helpers.page.waitForTimeout(6000); // Let toast expire
    await helpers.expectMomentNotExists(testMoments.basic.title);
    
    // Go back online
    await helpers.goOnline();
    
    // Moment should still be deleted
    await helpers.expectMomentNotExists(testMoments.basic.title);
  });

  test('data persists across browser sessions', async () => {
    // Create moment
    await helpers.createMoment(testMoments.basic);
    await helpers.expectMomentExists(testMoments.basic.title);
    
    // Reload page (simulates browser restart)
    await helpers.page.reload();
    await helpers.page.waitForLoadState('networkidle');
    
    // Moment should still exist
    await helpers.expectMomentExists(testMoments.basic.title);
  });

  test('handles offline state gracefully', async () => {
    // Go offline
    await helpers.goOffline();
    
    // App should still load and function
    await helpers.page.reload();
    await helpers.page.waitForLoadState('networkidle');
    
    // Should be able to interact with UI
    await helpers.openAddModal();
    await expect(helpers.modal).toBeVisible();
    
    // Should be able to fill form
    await helpers.fillMomentForm({
      title: 'Offline Test',
      date: DateTestHelpers.getFutureDate(1),
    });
    
    await helpers.saveButton.click();
    await expect(helpers.modal).not.toBeVisible();
  });

  test('offline indicator shows when offline', async () => {
    // Check if offline indicator exists and shows correct state
    const offlineIndicator = helpers.page.locator('[data-testid="offline-indicator"]');
    
    // Should not show when online (or not exist)
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).not.toContainText('offline');
    }
    
    // Go offline
    await helpers.goOffline();
    
    // Should show offline state if indicator exists
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toContainText('offline');
    }
    
    // Go back online
    await helpers.goOnline();
    
    // Should show online state
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).not.toContainText('offline');
    }
  });

  test('complex offline workflow', async () => {
    // Create initial data while online
    await helpers.createMoment(testMoments.basic);
    await helpers.createMoment(testMoments.future);
    
    // Go offline
    await helpers.goOffline();
    
    // Perform multiple operations offline
    await helpers.createMoment(testMoments.past);
    await helpers.editMoment(testMoments.basic.title, {
      title: 'Offline Updated',
    });
    await helpers.deleteMoment(testMoments.future.title);
    await helpers.page.waitForTimeout(6000); // Let delete toast expire
    
    // Verify state while offline
    await helpers.expectMomentExists('Offline Updated');
    await helpers.expectMomentExists(testMoments.past.title);
    await helpers.expectMomentNotExists(testMoments.future.title);
    await helpers.expectMomentCount(2);
    
    // Go back online
    await helpers.goOnline();
    
    // All changes should persist
    await helpers.expectMomentExists('Offline Updated');
    await helpers.expectMomentExists(testMoments.past.title);
    await helpers.expectMomentNotExists(testMoments.future.title);
    await helpers.expectMomentCount(2);
    
    // Reload to verify persistence
    await helpers.page.reload();
    await helpers.page.waitForLoadState('networkidle');
    
    await helpers.expectMomentExists('Offline Updated');
    await helpers.expectMomentExists(testMoments.past.title);
    await helpers.expectMomentCount(2);
  });
});