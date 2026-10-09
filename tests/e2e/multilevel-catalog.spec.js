import { test, expect } from '@playwright/test';

test.describe('[US-08] Catálogo Completo Multinivel y Sincronización UI', () => {
  test('al hacer clic en "Junior" en Dashboard, los contadores cambian y reflejan el total del nivel', async ({
    page,
  }) => {
    // Interceptar /api/dashboard/summary para verificar la sincronización por nivel
    await page.route('**/api/dashboard/summary**', async (route) => {
      const url = route.request().url();
      if (url.includes('level=junior')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            dueCount: 20,
            dueHardSkills: 10,
            dueSoftSkills: 10,
            criticalTopics: [],
            recommendedNext: {
              _id: '674c00000000000000000001',
              title: 'Métodos de Arrays en JS (map, filter, reduce)',
              category: 'hard_skill',
              type: 'theory',
              level: 'junior',
              srsStage: 0,
              intervalDays: 0,
            },
          }),
        });
      } else {
        // Estado inicial sin filtro o en 0
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
      }
    });

    await page.goto('/');

    // 1. Dashboard inicial muestra 0 en pendientes
    await expect(page.locator('#dashboard-view')).toBeVisible();
    const countLocator = page.locator('#metric-due-count');
    await expect(countLocator).toHaveText('0');

    // 2. Hacer clic en el botón de nivel "Junior"
    const juniorBtn = page.locator('#level-btn-junior-dashboard');
    await expect(juniorBtn).toBeVisible();
    await juniorBtn.click();

    // 3. El contador debe cambiar de 0 a 20 (total sembrado en junior)
    await expect(countLocator).toHaveText('20');
    await expect(page.locator('#metric-due-hard-skills')).toHaveText('10');
    await expect(page.locator('#metric-due-soft-skills')).toHaveText('10');
  });

  test('Soft Skills sincroniza el filtro por nivel y carga los nuevos escenarios Junior (Daily, Demos, Feedback)', async ({
    page,
  }) => {
    await page.route('**/api/topics/due**', async (route) => {
      const url = route.request().url();
      if (url.includes('level=junior')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              _id: '674c00000000000000000011',
              title: 'Daily Standup: Estructura Qué Hice, Qué Haré y Bloqueos',
              category: 'soft_skill',
              type: 'practice',
              level: 'junior',
            },
            {
              _id: '674c00000000000000000012',
              title: 'Pedir Ayuda: Formular Dudas con Hipótesis Previas',
              category: 'soft_skill',
              type: 'practice',
              level: 'junior',
            },
            {
              _id: '674c00000000000000000013',
              title: 'Demo de Ticket a PM: Explicar Valor sin Jerga',
              category: 'soft_skill',
              type: 'practice',
              level: 'junior',
            },
            {
              _id: '674c00000000000000000014',
              title: 'Code Review: Argumentar Técnicamente sin Personalismos',
              category: 'soft_skill',
              type: 'practice',
              level: 'junior',
            },
          ]),
        });
      } else if (url.includes('level=mid')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              _id: '674c00000000000000000021',
              title: 'Negociación de Deuda Técnica en Sprint',
              category: 'soft_skill',
              type: 'practice',
              level: 'mid',
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              _id: '674c00000000000000000031',
              title: 'Defensa de Deuda Técnica',
              category: 'soft_skill',
              type: 'practice',
              level: 'senior',
            },
          ]),
        });
      }
    });

    await page.goto('/');

    // 1. Navegar a Soft Skills
    const tabSoftSkills = page.locator('#tab-soft-skills');
    await expect(tabSoftSkills).toBeVisible();
    await tabSoftSkills.click();

    // 2. Verificar que el selector de nivel en Soft Skills está visible
    const levelSelector = page.locator('#level-selector-soft-skills');
    await expect(levelSelector).toBeVisible();

    // 3. Seleccionar nivel "Junior"
    const juniorBtn = page.locator('#level-btn-junior-soft-skills');
    await expect(juniorBtn).toBeVisible();
    await juniorBtn.click();

    // 4. El select de temas debe contener los escenarios clave de Junior
    const topicSelector = page.locator('#soft-skill-topic-selector');
    await expect(topicSelector).toBeVisible();

    const optionsText = await topicSelector.innerText();
    expect(optionsText).toContain('Daily Standup');
    expect(optionsText).toContain('Pedir Ayuda');
    expect(optionsText).toContain('Demo de Ticket a PM');
    expect(optionsText).toContain('Code Review');

    // 5. Cambiar a nivel "Mid" y verificar que el dropdown se actualiza
    const midBtn = page.locator('#level-btn-mid-soft-skills');
    await expect(midBtn).toBeVisible();
    await midBtn.click();

    await expect(topicSelector).toContainText('Negociación de Deuda Técnica en Sprint');
    const midOptions = await topicSelector.innerText();
    expect(midOptions).not.toContain('Daily Standup');
  });
});
