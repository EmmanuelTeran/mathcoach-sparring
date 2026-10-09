import { test, expect } from '@playwright/test';

test.describe('Smoke Test - Frontend & Health', () => {
  test('frontend loads properly and shows header', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DevCoach/i);
    await expect(page.locator('h1')).toContainText(/DevCoach Sparring/i);
  });
});
