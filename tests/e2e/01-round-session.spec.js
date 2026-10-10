import { test, expect } from '@playwright/test';

test.describe('Flujos E2E de Sesión de Ronda y Resiliencia (MATH-US-15)', () => {
  test('Flujo 1: Panel -> Entrenar ahora -> Ronda Técnica con 3 a 10 ejercicios y fórmulas KaTeX', async ({ page }) => {
    // 1. Acceder al inicio y conmutar al Panel
    await page.goto('/');
    const tabDashboard = page.locator('#tab-dashboard');
    await tabDashboard.click();
    await expect(page.locator('#dashboard-view')).toBeVisible();

    // 2. Verificar tarjetas de resumen y botón Entrenar ahora
    await expect(page.locator('#card-due-technique')).toBeVisible();
    await expect(page.locator('#card-due-application')).toBeVisible();
    await expect(page.locator('#card-due-proof')).toBeVisible();

    const btnTrainNow = page.locator('#btn-train-now');
    await expect(btnTrainNow).toBeVisible();
    await btnTrainNow.click();

    // 3. Verifica transición a la sesión de ronda
    await expect(page.locator('#round-session-container')).toBeVisible({ timeout: 10000 });
    const roundHeader = page.locator('#round-header');
    await expect(roundHeader).toBeVisible();
    await expect(roundHeader).toContainText(/Técnica/i);
    await expect(roundHeader).toContainText(/~15 min/i);

    // 4. Verificar presencia de 3 a 10 ejercicios visibles
    const exerciseLocators = page.locator('[id^="round-exercise-"]');
    await expect(exerciseLocators.first()).toBeVisible();
    const count = await exerciseLocators.count();
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(10);

    // 5. Verificar renderizado matemático con KaTeX dentro de los enunciados
    const katexElements = page.locator('.katex');
    await expect(katexElements.first()).toBeVisible();
  });

  test('Flujo 3: Ronda de Demostración con exactamente 1 ejercicio formal', async ({ page }) => {
    // 1. Ir al Panel
    await page.goto('/');
    await page.locator('#tab-dashboard').click();
    await expect(page.locator('#dashboard-view')).toBeVisible();

    // 2. Seleccionar celda de Demostración en la matriz Tema x Categoría
    const proofCell = page.locator('[id^="matrix-cell-"][id$="-proof"]').first();
    await expect(proofCell).toBeVisible();
    await proofCell.click();

    // 3. Verificar que carga RoundSession con categoría Demostración
    await expect(page.locator('#round-session-container')).toBeVisible({ timeout: 10000 });
    const roundHeader = page.locator('#round-header');
    await expect(roundHeader).toContainText(/Demostración/i);

    // 4. Validar exactamente 1 ejercicio (presupuesto completo de ~15 min)
    const exerciseLocators = page.locator('[id^="round-exercise-"]');
    await expect(exerciseLocators.first()).toBeVisible();
    const totalExercises = await exerciseLocators.count();
    expect(totalExercises).toBe(1);
  });

  test('Flujo 4: Resiliencia 422 ante ejercicio faltante y reevaluación exitosa con foto adicional', async ({ page }) => {
    let evaluateAttempt = 0;

    // Interceptar la API de evaluación para simular 422 primero y 200 en reintento
    await page.route('**/api/rounds/*/evaluate', async (route) => {
      evaluateAttempt += 1;
      if (evaluateAttempt === 1) {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'exercises_not_found',
            missing: [2],
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            roundScore: 4.5,
            passRate: 1.0,
            promoted: false,
            previousDifficulty: 1,
            newDifficulty: 1,
            nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
            overall_feedback: 'Todos los ejercicios demostrados con rigor y resolución completa.',
            results: [
              {
                order: 1,
                score: 5,
                feedback_paso_a_paso: 'Excelente simplificación y justificación de dominio.',
                hint: 'Mantén esta notación limpia.',
              },
              {
                order: 2,
                score: 4,
                feedback_paso_a_paso: 'Buen desarrollo en la hoja adicional anexada.',
                hint: 'Recuerda comprobar las asíntotas.',
              },
            ],
          }),
        });
      }
    });

    // 1. Iniciar sesión de práctica en pestaña Entrenar
    await page.goto('/');
    await expect(page.locator('#round-session-container')).toBeVisible({ timeout: 10000 });

    // 2. Pasar a modo de captura
    const btnFinish = page.locator('#btn-finish-round');
    await expect(btnFinish).toBeVisible();
    await btnFinish.click();

    // 3. Subir 1 foto simulada mediante el input de archivo
    const fileInput = page.locator('#camera-fallback-file-input');
    await fileInput.setInputFiles({
      name: 'solucion-pagina-1.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      ),
    });

    // Validar miniatura en galería
    await expect(page.locator('#photo-capture-gallery img')).toHaveCount(1);

    // 4. Enviar a evaluar (detona respuesta 422)
    const btnSubmit = page.locator('#btn-submit-round');
    await expect(btnSubmit).toBeEnabled();
    await btnSubmit.click();

    // 5. Verificar estado RECOVERY_422 y contenedor de alerta
    const alertMissing = page.locator('#alert-missing-exercises');
    await expect(alertMissing).toBeVisible();
    await expect(alertMissing).toContainText(/#2/);

    // Validar que la foto previa se conserva en la galería (cero pérdida)
    await expect(page.locator('#photo-capture-gallery img')).toHaveCount(1);

    // 6. Anexar foto adicional para cubrir el ejercicio faltante
    await fileInput.setInputFiles({
      name: 'solucion-pagina-2.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      ),
    });

    // Ahora hay 2 fotos en la galería
    await expect(page.locator('#photo-capture-gallery img')).toHaveCount(2);

    // 7. Reenviar a evaluar (detona respuesta 200)
    await btnSubmit.click();

    // 8. Verificar llegada exitosa a RoundResults
    await expect(page.locator('#round-results')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#round-progression')).toBeVisible();
    await expect(page.locator('#round-exercise-result-1')).toBeVisible();
    await expect(page.locator('#round-exercise-result-2')).toBeVisible();
  });
});
