import { test, expect } from '@playwright/test';

test.describe('Smoke Test - MathCoach Sparring Frontend & Health', () => {
  test('la aplicación carga correctamente con título, encabezado e indicador de API', async ({ page }) => {
    await page.goto('/');

    // 1. Título y encabezado
    await expect(page).toHaveTitle(/MathCoach Sparring/i);
    await expect(page.locator('h1')).toContainText(/MathCoach Sparring/i);

    // 2. Selector de pestañas ("Entrenar" y "Panel")
    const tabTrain = page.locator('#tab-math-vision');
    const tabDashboard = page.locator('#tab-dashboard');
    await expect(tabTrain).toBeVisible();
    await expect(tabDashboard).toBeVisible();

    // 3. Indicador de estado de API en el header
    const apiStatus = page.locator('header').locator('text=API:');
    await expect(apiStatus).toBeVisible();
  });
});
