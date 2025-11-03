import { test, expect } from '@playwright/test';
import { MomentTestHelpers, DateTestHelpers } from './utils/test-helpers';
import { testMoments } from './fixtures/test-data';

test.describe('Moment Lifecycle', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('complete moment lifecycle: create → view → edit → delete → undo', async () => {
    // Create a moment
    await helpers.createMoment(testMoments.basic);
    await helpers.expectMomentExists(testMoments.basic.title);

    // View moment details by focusing
    await helpers.focusMoment(testMoments.basic.title);
    await helpers.expectBannerContent(testMoments.basic.title);

    // Edit the moment
    const updatedData = {
      title: 'Updated Test Moment',
      description: 'Updated description',
    };
    await helpers.editMoment(testMoments.basic.title, updatedData);
    await helpers.expectMomentExists(updatedData.title);
    await helpers.expectMomentNotExists(testMoments.basic.title);

    // Delete the moment and immediately undo
    await helpers.deleteMoment(updatedData.title, true);
    await helpers.expectMomentExists(updatedData.title);

    // Delete permanently (let toast expire)
    await helpers.deleteMoment(updatedData.title);
    await helpers.waitForTimeout(6000); // Wait for toast to expire
    await helpers.expectMomentNotExists(updatedData.title);
  });

  test('create moment with all fields', async () => {
    const momentData = {
      title: 'Complete Moment',
      description: 'A moment with all fields filled',
      date: DateTestHelpers.getFutureDate(5),
      repeatFrequency: 'weekly' as const,
    };

    await helpers.createMoment(momentData);
    await helpers.expectMomentExists(momentData.title);

    // Verify repeat indicator is shown - look specifically for the repeat icon
    const tile = helpers.getMomentTile(momentData.title);
    const repeatIcon = tile.locator('svg.lucide-repeat');
    await expect(repeatIcon).toBeVisible();
  });

  test('create moment with minimal data', async () => {
    const momentData = {
      title: 'Minimal Moment',
      date: DateTestHelpers.getFutureDate(1),
    };

    await helpers.createMoment(momentData);
    await helpers.expectMomentExists(momentData.title);
  });

  test('edit moment preserves existing data', async () => {
    await helpers.createMoment(testMoments.basic);
    
    // Edit only the title
    await helpers.editMoment(testMoments.basic.title, {
      title: 'New Title Only',
    });

    // Verify other fields are preserved by checking the tile still shows description
    const tile = helpers.getMomentTile('New Title Only');
    await expect(tile).toContainText(testMoments.basic.description!);
  });

  test('delete confirmation with undo functionality', async () => {
    await helpers.createMoment(testMoments.basic);
    
    // Delete and immediately undo
    await helpers.deleteMoment(testMoments.basic.title, true);
    await helpers.expectMomentExists(testMoments.basic.title);
    
    // Delete and let it expire
    await helpers.deleteMoment(testMoments.basic.title);
    await helpers.waitForTimeout(6000);
    await helpers.expectMomentNotExists(testMoments.basic.title);
  });
});

test.describe('Form Validation', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('prevents submission with empty title', async () => {
    await helpers.openAddModal();
    
    // Try to submit with empty title
    await helpers.titleInput.fill('');
    await helpers.dateInput.fill(DateTestHelpers.getFutureDate(1));
    
    // Form should be invalid (save button disabled)
    await helpers.expectFormInvalid();
    
    // Fill title and check form becomes valid
    await helpers.titleInput.fill('Valid Title');
    await helpers.expectFormValid();
  });

  test('prevents submission with invalid date', async () => {
    await helpers.openAddModal();
    await helpers.titleInput.fill('Test Moment');
    
    // Try to clear the date field (HTML5 date input validation)
    await helpers.dateInput.fill('');
    
    // Form should be invalid due to missing required date
    await helpers.expectFormInvalid();
    
    // Fill valid date and check form becomes valid
    await helpers.dateInput.fill(DateTestHelpers.getFutureDate(1));
    await helpers.expectFormValid();
  });

  test('validates title length limit', async () => {
    const longTitle = 'a'.repeat(101); // Exceeds 100 character limit
    
    await helpers.openAddModal();
    await helpers.titleInput.fill(longTitle);
    await helpers.dateInput.fill(DateTestHelpers.getFutureDate(1));
    
    // Wait a moment for validation to process
    await helpers.waitForTimeout(500);
    
    // Form should be invalid (save button disabled) due to title length
    await helpers.expectFormInvalid();
    
    // Fix the title and form should become valid
    await helpers.titleInput.fill('Valid Title');
    await helpers.waitForTimeout(500);
    await helpers.expectFormValid();
  });

  test('validates description length limit', async () => {
    const longDescription = 'a'.repeat(201); // Exceeds 200 character limit
    
    await helpers.openAddModal();
    await helpers.titleInput.fill('Test Moment');
    await helpers.descriptionInput.fill(longDescription);
    await helpers.dateInput.fill(DateTestHelpers.getFutureDate(1));
    
    // Wait a moment for validation to process
    await helpers.waitForTimeout(500);
    
    // Form should be invalid (save button disabled) due to description length
    await helpers.expectFormInvalid();
    
    // Fix the description and form should become valid
    await helpers.descriptionInput.fill('Valid description');
    await helpers.waitForTimeout(500);
    await helpers.expectFormValid();
  });
});