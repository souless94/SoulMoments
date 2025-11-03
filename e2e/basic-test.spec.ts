import { test, expect } from '@playwright/test';

test.describe('Basic App Test', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the app header is visible
    const header = page.getByRole('heading', { name: 'Life Moments Tracker' });
    await expect(header).toBeVisible();
    
    // Check if the floating add button is visible
    const addButton = page.locator('button[aria-label="Add new moment"]');
    await expect(addButton).toBeVisible();
    
    // Check if we can open the modal
    await addButton.click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    // Check if form fields are present using IDs
    const titleInput = page.locator('#title');
    const dateInput = page.locator('#date');
    const saveButton = page.getByRole('button', { name: /save moment/i });
    
    await expect(titleInput).toBeVisible();
    await expect(dateInput).toBeVisible();
    await expect(saveButton).toBeVisible();
    
    // Try to create a simple moment
    await titleInput.fill('Test Moment');
    await dateInput.fill('2024-12-25');
    await saveButton.click();
    
    // Modal should close
    await expect(modal).not.toBeVisible();
    
    // Wait a bit for the moment to be created
    await page.waitForTimeout(1000);
    
    // Check if the moment appears in the card (button with the title)
    const momentCard = page.getByRole('button', { name: /Test Moment/ });
    await expect(momentCard).toBeVisible();
  });
});