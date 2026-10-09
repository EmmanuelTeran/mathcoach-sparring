import { test, expect } from '@playwright/test';

test.describe('Hard Skills Module - Active Recall E2E Flow', () => {
  test('permite seleccionar un tema, generar un reto técnico, enviar solución y ver evaluación completa', async ({ page }) => {
    // Interceptar llamadas a la API para asegurar determinismo completo en E2E
    await page.route('**/api/topics/due**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '674c11112222333344445555',
            title: 'Node.js Event Loop & Concurrency',
            category: 'hard_skill',
            type: 'theory',
            level: 'junior',
            srsStage: 0,
            intervalDays: 0,
          },
          {
            _id: '674c11112222333344445556',
            title: 'React Concurrent Mode & Fiber',
            category: 'hard_skill',
            type: 'practice',
            level: 'mid',
            srsStage: 1,
            intervalDays: 1,
          },
        ]),
      });
    });

    await page.route('**/api/practice/hard-skill/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          topicId: '674c11112222333344445555',
          title: 'Node.js Event Loop & Concurrency',
          type: 'theory',
          category: 'hard_skill',
          challenge:
            'Explica en qué fase de libuv se procesa process.nextTick vs setImmediate y qué trade-off de latencia de red ocurre si se encola recursivamente.',
        }),
      });
    });

    await page.route('**/api/practice/hard-skill/evaluate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          score: 5,
          feedback:
            'Explicación impecable. Has detallado con precisión que process.nextTick corre inmediatamente después de la operación actual antes de pasar a la siguiente fase de libuv.',
          missingTradeoffs: ['Manejo de Garbage Collection bajo buffers masivos'],
          strengths: ['Diferenciación exacta de fases libuv', 'Comprensión de I/O starvation'],
          nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          srsStage: 1,
          intervalDays: 1,
          sessionLogId: '674c99998888777766665555',
        }),
      });
    });

    // 1. Navegar a la app
    await page.goto('/');

    // 2. Cambiar a la pestaña de Hard Skills (o verificarla)
    const tabHardSkills = page.locator('#tab-hard-skills');
    await expect(tabHardSkills).toBeVisible();
    await tabHardSkills.click();

    // 3. Verificar que el módulo de Hard Skills está presente
    const section = page.locator('#hard-skills-section');
    await expect(section).toBeVisible();
    await expect(page.locator('#topic-selector')).toBeVisible();

    // 3. Hacer clic en "Cargar tema prioritario"
    const btnLoadPriority = page.locator('#btn-load-priority');
    await expect(btnLoadPriority).toBeVisible();
    await btnLoadPriority.click();

    // 4. Comprobar que aparece el visor del desafío
    const challengeCard = page.locator('#challenge-card');
    await expect(challengeCard).toBeVisible({ timeout: 10000 });
    // Verificar que el texto del desafío contiene algo (no forzamos texto de IA específico)
    await expect(page.locator('#challenge-text')).toContainText('process.nextTick');

    // 5. Redactar solución en el textarea
    const solutionInput = page.locator('#user-solution-input');
    await expect(solutionInput).toBeVisible();
    await solutionInput.fill(
      'process.nextTick no forma parte de libuv técnicamente sino de Node core y se drena al finalizar la operación actual antes de avanzar de fase. Si se invoca recursivamente produce I/O starvation bloqueando la fase poll.'
    );

    // 6. Hacer clic en "Evaluar Solución"
    const btnEvaluate = page.locator('#btn-evaluate-solution');
    await expect(btnEvaluate).toBeEnabled();
    await btnEvaluate.click();

    // 7. Validar la aparición del panel de resultados
    const resultsPanel = page.locator('#evaluation-results-panel');
    await expect(resultsPanel).toBeVisible();

    // Validar badge de score (Score 5/5)
    await expect(page.locator('#score-badge-container')).toContainText('Score 5/5');

    // Validar texto de feedback
    await expect(page.locator('#evaluation-feedback-text')).toContainText('Explicación impecable');

    // Validar listas de fortalezas y puntos ciegos
    await expect(page.locator('#evaluation-strengths-list')).toContainText('Diferenciación exacta de fases libuv');
    await expect(page.locator('#evaluation-missing-tradeoffs-list')).toContainText('Manejo de Garbage Collection');

    // Validar próximo repaso SRS
    await expect(page.locator('#next-review-date')).toBeVisible();
  });
});
