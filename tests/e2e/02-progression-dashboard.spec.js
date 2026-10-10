import { test, expect } from '@playwright/test';

test.describe('Flujos E2E de Progresión y Panel de Control (MATH-US-15)', () => {
  test('Flujo 2: Captura por archivo -> Evaluación exitosa -> Promoción a dificultad 2 reflejada en el Panel', async ({ page }) => {
    // 1. Acceder al Panel
    await page.goto('/');
    const tabDashboard = page.locator('#tab-dashboard');
    await tabDashboard.click();
    await expect(page.locator('#dashboard-view')).toBeVisible();

    // 2. Identificar la primera pista en la matriz de temas (columna Técnica)
    const firstTechniqueCell = page.locator('[id^="matrix-cell-"][id$="-technique"]').first();
    await expect(firstTechniqueCell).toBeVisible();

    // Hacer clic en la pista para iniciar sesión de práctica
    await firstTechniqueCell.click();

    // 3. Verificar que RoundSession carga en modo de práctica
    await expect(page.locator('#round-session-container')).toBeVisible({ timeout: 10000 });
    const roundHeader = page.locator('#round-header');
    await expect(roundHeader).toContainText(/Técnica/i);
    await expect(roundHeader).toContainText(/Dificultad 1/i);

    // 4. Finalizar modo de resolución y pasar a captura
    const btnFinish = page.locator('#btn-finish-round');
    await expect(btnFinish).toBeVisible();
    await btnFinish.click();

    // 5. Cargar imagen de libreta por archivo
    const fileInput = page.locator('#camera-fallback-file-input');
    await fileInput.setInputFiles({
      name: 'solucion-completa.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      ),
    });

    await expect(page.locator('#photo-capture-gallery img')).toHaveCount(1);

    // 6. Enviar a evaluar (aprovecha la evaluación real del backend en modo offline/mock donde score=4 -> passRate=1.0 -> promoted=true -> newDifficulty=2)
    const btnSubmit = page.locator('#btn-submit-round');
    await expect(btnSubmit).toBeEnabled();
    await btnSubmit.click();

    // 7. Validar pantalla RoundResults
    await expect(page.locator('#round-results')).toBeVisible({ timeout: 15000 });
    const progressionBanner = page.locator('#round-progression');
    await expect(progressionBanner).toBeVisible();
    await expect(progressionBanner).toContainText(/Subes a dificultad 2/i);

    // 8. Regresar al Panel
    const btnReturnToDashboard = page.locator('button:has-text("Volver al Panel")');
    await expect(btnReturnToDashboard).toBeVisible();
    await btnReturnToDashboard.click();

    // 9. En el Dashboard, comprobar que la matriz refleja Dificultad 2
    await expect(page.locator('#dashboard-view')).toBeVisible({ timeout: 10000 });
    
    // El primer renglón de la técnica debe tener ahora el segmento de dificultad 2 activo (bg-amber-400)
    await expect(firstTechniqueCell.locator('.bg-amber-400')).toBeVisible();
  });
});
