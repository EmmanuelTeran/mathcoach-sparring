import { test, expect } from '@playwright/test';

test.describe('Math Vision Uploader - Active Recall E2E Flow', () => {
  test('renderiza la interfaz de Math Vision, muestra el estado inicial y permite fallback de archivo', async ({ page }) => {
    // Interceptar la petición de evaluación para garantizar determinismo en E2E
    await page.route('**/api/rounds/*/evaluate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          score: 5,
          feedback_paso_a_paso: 'Paso 1: Factorización perfecta por factor común. Paso 2: Cancelación válida.',
          hint: 'Excelente desarrollo matemático.',
          srs: {
            repetition: 1,
            interval: 1,
            efactor: 2.5,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        }),
      });
    });

    // 1. Navegar a la app
    await page.goto('/');

    // 2. Verificar que el tab de Math Vision está visible y activo por defecto
    const tabMathVision = page.locator('#tab-math-vision');
    await expect(tabMathVision).toBeVisible();

    // 3. Verificar el contenedor del uploader y el enunciado visible
    const container = page.locator('#math-vision-uploader-container');
    await expect(container).toBeVisible();
    await expect(page.locator('#problem-statement')).toBeVisible();
    await expect(page.locator('#problem-statement')).toContainText('Simplifica la siguiente fracción algebraica');

    // 4. Verificar botón de activar cámara único
    const activateBtn = page.locator('#btn-activate-camera');
    await expect(activateBtn).toBeVisible();
    await expect(activateBtn).toHaveCount(1);

    // 5. Verificar disponibilidad del botón de fallback para subida manual
    const manualBtn = page.locator('#btn-manual-upload');
    await expect(manualBtn).toBeVisible();

    // 6. Verificar que el input de archivo está disponible en el DOM
    const fileInput = page.locator('#camera-fallback-file-input');
    await expect(fileInput).toBeAttached();
  });
});
