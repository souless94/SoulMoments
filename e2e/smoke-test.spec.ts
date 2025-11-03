import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('app loads without errors', async ({ page }) => {
    // Go to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the main header is visible
    await expect(page.getByRole('heading', { name: 'Life Moments Tracker' })).toBeVisible();
    
    // Check if there are no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit to catch any errors
    await page.waitForTimeout(2000);
    
    // Should have no critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('service-worker')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});