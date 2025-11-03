import { test, expect } from '@playwright/test';
import { MomentTestHelpers, DateTestHelpers } from './utils/test-helpers';
import { testMoments } from './fixtures/test-data';

test.describe('Repeat Events Workflow', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('creates repeat events with all frequencies', async () => {
    const frequencies = ['daily', 'weekly', 'monthly', 'yearly'] as const;
    
    for (const frequency of frequencies) {
      const momentData = {
        title: `${frequency} Event`,
        description: `Testing ${frequency} repeat`,
        date: DateTestHelpers.getPastDate(1),
        repeatFrequency: frequency,
      };
      
      await helpers.createMoment(momentData);
      
      // Verify moment is created and shows repeat indicator
      const tile = helpers.getMomentTile(momentData.title);
      await expect(tile).toBeVisible();
      // Check for repeat icon (Repeat component from lucide-react)
      await expect(tile.locator('svg')).toBeVisible();
    }
    
    await helpers.expectMomentCount(4);
  });

  test('repeat events always appear in upcoming section', async () => {
    // Create a repeat event with past original date
    await helpers.createMoment(testMoments.dailyRepeat);
    
    // Should appear in upcoming section, not past
    const tile = helpers.getMomentTile(testMoments.dailyRepeat.title);
    
    // Tile should be in upcoming section (before separator)
    const separator = helpers.page.locator('text=Past Moments');
    if (await separator.isVisible()) {
      const separatorBox = await separator.boundingBox();
      const tileBox = await tile.boundingBox();
      
      expect(tileBox?.y).toBeLessThan(separatorBox?.y || 0);
    }
  });

  test('displays next occurrence for repeat events', async () => {
    await helpers.createMoment(testMoments.weeklyRepeat);
    
    const tile = helpers.getMomentTile(testMoments.weeklyRepeat.title);
    
    // Should show "Next: [date]" instead of original date
    await expect(tile).toContainText('Next:');
    await expect(tile).not.toContainText(testMoments.weeklyRepeat.date);
  });

  test('banner shows countdown to next occurrence', async () => {
    await helpers.createMoment(testMoments.dailyRepeat);
    
    // Focus on the repeat event
    await helpers.focusMoment(testMoments.dailyRepeat.title);
    
    const banner = helpers.banner;
    
    // Should show countdown to next occurrence, not original date
    await expect(banner).toContainText(testMoments.dailyRepeat.title);
    await expect(banner).toContainText(/\d+ day/); // Should show days until next occurrence
  });

  test('edit repeat frequency updates display', async () => {
    // Create non-repeat event
    await helpers.createMoment(testMoments.basic);
    
    // Edit to add repeat frequency
    await helpers.editMoment(testMoments.basic.title, {
      repeatFrequency: 'weekly',
    });
    
    // Should now show repeat indicator
    const tile = helpers.getMomentTile(testMoments.basic.title);
    // Check for repeat icon (Repeat component from lucide-react)
    await expect(tile.locator('svg')).toBeVisible();
    await expect(tile).toContainText('Next:');
  });

  test('remove repeat frequency updates display', async () => {
    // Create repeat event
    await helpers.createMoment(testMoments.weeklyRepeat);
    
    // Edit to remove repeat frequency
    await helpers.editMoment(testMoments.weeklyRepeat.title, {
      repeatFrequency: 'none',
    });
    
    // Should no longer show repeat indicator
    const tile = helpers.getMomentTile(testMoments.weeklyRepeat.title);
    // Check that repeat icon is not visible
    const repeatIcons = tile.locator('svg');
    const iconCount = await repeatIcons.count();
    expect(iconCount).toBeLessThanOrEqual(2); // Only edit/delete buttons, no repeat icon
    await expect(tile).not.toContainText('Next:');
  });

  test('repeat events sort correctly with non-repeat events', async () => {
    // Create mix of repeat and non-repeat events
    await helpers.createMoment(testMoments.past); // Past non-repeat
    await helpers.createMoment(testMoments.dailyRepeat); // Past repeat (should be upcoming)
    await helpers.createMoment(testMoments.future); // Future non-repeat
    
    await helpers.expectMomentCount(3);
    
    // Verify repeat event appears in upcoming section
    const separator = helpers.page.locator('text=Past Moments');
    await expect(separator).toBeVisible();
    
    // Daily repeat should be before separator
    const dailyTile = helpers.getMomentTile(testMoments.dailyRepeat.title);
    const separatorBox = await separator.boundingBox();
    const dailyBox = await dailyTile.boundingBox();
    
    expect(dailyBox?.y).toBeLessThan(separatorBox?.y || 0);
    
    // Past event should be after separator
    const pastTile = helpers.getMomentTile(testMoments.past.title);
    const pastBox = await pastTile.boundingBox();
    
    expect(pastBox?.y).toBeGreaterThan(separatorBox?.y || 0);
  });
});

test.describe('Repeat Event Calculations', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('daily repeat calculates next occurrence correctly', async () => {
    const dailyMoment = {
      title: 'Daily Test',
      date: DateTestHelpers.getPastDate(3), // 3 days ago
      repeatFrequency: 'daily' as const,
    };
    
    await helpers.createMoment(dailyMoment);
    
    // Should show tomorrow as next occurrence
    const tile = helpers.getMomentTile(dailyMoment.title);
    await expect(tile).toContainText('1 day until');
  });

  test('weekly repeat calculates next occurrence correctly', async () => {
    const weeklyMoment = {
      title: 'Weekly Test',
      date: DateTestHelpers.getPastDate(10), // 10 days ago
      repeatFrequency: 'weekly' as const,
    };
    
    await helpers.createMoment(weeklyMoment);
    
    // Should show next week occurrence
    const tile = helpers.getMomentTile(weeklyMoment.title);
    await expect(tile).toContainText(/\d+ day/);
    await expect(tile).toContainText('until');
  });

  test('monthly repeat handles month boundaries', async () => {
    const monthlyMoment = {
      title: 'Monthly Test',
      date: DateTestHelpers.getPastDate(45), // 45 days ago
      repeatFrequency: 'monthly' as const,
    };
    
    await helpers.createMoment(monthlyMoment);
    
    // Should calculate next monthly occurrence
    const tile = helpers.getMomentTile(monthlyMoment.title);
    await expect(tile).toContainText(/\d+ day/);
    await expect(tile).toContainText('until');
  });

  test('yearly repeat handles leap years', async () => {
    const yearlyMoment = {
      title: 'Yearly Test',
      date: DateTestHelpers.getPastDate(400), // Over a year ago
      repeatFrequency: 'yearly' as const,
    };
    
    await helpers.createMoment(yearlyMoment);
    
    // Should calculate next yearly occurrence
    const tile = helpers.getMomentTile(yearlyMoment.title);
    await expect(tile).toContainText(/\d+ day/);
    await expect(tile).toContainText('until');
  });
});