import { test, expect } from '@playwright/test';

test.describe('Dashboard & Coupling Flow E2E Tests', () => {
  test('carga métricas del dashboard, renderiza áreas críticas y permite navegar con "Entrenar Ahora"', async ({
    page,
  }) => {
    // Interceptar /api/dashboard/summary para un test determinista
    await page.route('**/api/dashboard/summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dueCount: 3,
          dueHardSkills: 2,
          dueSoftSkills: 1,
          criticalTopics: [
            {
              _id: '674c11112222333344440001',
              title: 'React Fiber Architecture',
              category: 'hard_skill',
              type: 'theory',
              lastScore: 1,
              srsStage: 0,
              nextReviewAt: new Date().toISOString(),
            },
            {
              _id: '674c11112222333344440002',
              title: 'Microservices Distributed Tracing',
              category: 'hard_skill',
              type: 'theory',
              lastScore: 2,
              srsStage: 1,
              nextReviewAt: new Date().toISOString(),
            },
          ],
          recommendedNext: {
            _id: '674c11112222333344440001',
            title: 'React Fiber Architecture',
            category: 'hard_skill',
            type: 'theory',
            srsStage: 0,
            intervalDays: 0,
          },
        }),
      });
    });

    // Mock de /api/topics/due para cuando se cambie a la pestaña de entrenamiento
    await page.route('**/api/topics/due', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '674c11112222333344440001',
            title: 'React Fiber Architecture',
            category: 'hard_skill',
            type: 'theory',
            srsStage: 0,
            intervalDays: 0,
          },
        ]),
      });
    });

    // 1. Navegar a la página principal
    await page.goto('/');

    // 2. Verificar que la pestaña activa por defecto es el Dashboard
    await expect(page.locator('#tab-dashboard')).toBeVisible();
    await expect(page.locator('#dashboard-view')).toBeVisible();

    // 3. Validar métricas de las tarjetas rápidas
    await expect(page.locator('#metric-due-count')).toHaveText('3');
    await expect(page.locator('#metric-due-hard-skills')).toHaveText('2');
    await expect(page.locator('#metric-due-soft-skills')).toHaveText('1');

    // 4. Validar tarjeta de recomendación y título sugerido
    await expect(page.locator('#recommended-topic-title')).toHaveText('React Fiber Architecture');
    const btnTrainNow = page.locator('#btn-train-now');
    await expect(btnTrainNow).toBeVisible();
    await expect(btnTrainNow).toBeEnabled();

    // 5. Validar renderizado de la sección de Áreas Críticas
    await expect(page.locator('#critical-topics-section')).toBeVisible();
    await expect(page.locator('#critical-topics-count')).toContainText('2 detectadas');

    const criticalList = page.locator('#critical-topics-list');
    await expect(criticalList).toContainText('React Fiber Architecture');
    await expect(criticalList).toContainText('Score 1/5');
    await expect(criticalList).toContainText('Microservices Distributed Tracing');
    await expect(criticalList).toContainText('Score 2/5');

    // 6. Probar botón "Entrenar Ahora" -> debe redirigir a Hard Skills con el tema recomendado precargado
    await btnTrainNow.click();

    // Verificar que cambió a la sección de Hard Skills
    await expect(page.locator('#hard-skills-section')).toBeVisible();
    await expect(page.locator('#topic-selector')).toHaveValue('674c11112222333344440001');

    // 7. Navegar de vuelta al Dashboard usando el tab
    await page.locator('#tab-dashboard').click();
    await expect(page.locator('#dashboard-view')).toBeVisible();

    // 8. Probar botón de repasar área crítica específica
    const btnReviewSecond = page.locator('#btn-review-critical-674c11112222333344440002');
    await expect(btnReviewSecond).toBeVisible();
    await btnReviewSecond.click();

    // Verificar que redirige a Hard Skills con el segundo tema seleccionado
    await expect(page.locator('#hard-skills-section')).toBeVisible();
    await expect(page.locator('#topic-selector')).toHaveValue('674c11112222333344440002');
  });

  test('permite navegar libremente entre pestañas Dashboard, Hard Skills y Soft Skills', async ({
    page,
  }) => {
    await page.route('**/api/dashboard/summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dueCount: 0,
          dueHardSkills: 0,
          dueSoftSkills: 0,
          criticalTopics: [],
          recommendedNext: null,
        }),
      });
    });

    await page.goto('/');

    // Dashboard activo
    await expect(page.locator('#dashboard-view')).toBeVisible();

    // Clic en Soft Skills
    await page.locator('#tab-soft-skills').click();
    await expect(page.locator('#soft-skills-section')).toBeVisible();

    // Clic en Hard Skills
    await page.locator('#tab-hard-skills').click();
    await expect(page.locator('#hard-skills-section')).toBeVisible();

    // Retorno a Dashboard
    await page.locator('#tab-dashboard').click();
    await expect(page.locator('#dashboard-view')).toBeVisible();
  });
});
