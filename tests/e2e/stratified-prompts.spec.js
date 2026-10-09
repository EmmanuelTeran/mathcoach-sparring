import { test, expect } from '@playwright/test';

test.describe('[US-09] Prompts Estratificados por Nivel y UI Badges Dinámicos', () => {
  test('Hard Skills muestra badges dinámicos según el nivel y estratifica el reto técnico', async ({ page }) => {
    // Interceptar /api/topics/due para devolver temas de nivel junior
    await page.route('**/api/topics/due**', async (route) => {
      const url = route.request().url();
      if (url.includes('level=senior')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              _id: '674c00000000000000000030',
              title: 'Arquitectura de Microfrontends y Module Federation',
              category: 'hard_skill',
              type: 'theory',
              level: 'senior',
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              _id: '674c00000000000000000001',
              title: 'Métodos de Arrays en JS (map, filter, reduce)',
              category: 'hard_skill',
              type: 'theory',
              level: 'junior',
            },
          ]),
        });
      }
    });

    await page.route('**/api/practice/hard-skill/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          topicId: '674c00000000000000000001',
          title: 'Métodos de Arrays en JS (map, filter, reduce)',
          type: 'theory',
          category: 'hard_skill',
          level: 'junior',
          challenge:
            '[Desafío Teórico Junior - Métodos de Arrays]: Explica la diferencia entre map y forEach y cómo evitar mutar el array original.',
        }),
      });
    });

    await page.route('**/api/practice/hard-skill/evaluate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          score: 5,
          feedback: 'Excelente comprensión de inmutabilidad y métodos de arrays en JavaScript.',
          missingTradeoffs: [],
          strengths: ['Sintaxis limpia', 'Inmutabilidad respetada'],
          nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
          srsStage: 1,
          intervalDays: 1,
          sessionLogId: '674c99999999999999999999',
        }),
      });
    });

    await page.goto('/');

    // 1. Cambiar a la pestaña de Hard Skills
    await page.locator('#tab-hard-skills').click();
    await expect(page.locator('#hard-skills-section')).toBeVisible();

    // 2. Comprobar badge dinámico inicial (NIVEL JUNIOR)
    const dynamicBadge = page.locator('#dynamic-level-badge-hard-skills');
    await expect(dynamicBadge).toBeVisible();
    await expect(dynamicBadge).toHaveText('NIVEL JUNIOR');

    // 3. Cambiar a nivel Mid y verificar badge
    await page.locator('#level-btn-mid-hard-skills').click();
    await expect(dynamicBadge).toHaveText('NIVEL MID');

    // 4. Cambiar a nivel Senior y verificar badge
    await page.locator('#level-btn-senior-hard-skills').click();
    await expect(dynamicBadge).toHaveText('NIVEL SENIOR');

    // 5. Volver a nivel Junior y cargar reto
    await page.locator('#level-btn-junior-hard-skills').click();
    await expect(dynamicBadge).toHaveText('NIVEL JUNIOR');

    await page.locator('#btn-load-priority').click();
    await expect(page.locator('#challenge-card')).toBeVisible();

    // 6. Verificar badges dinámicos del reto generado
    const challengeLevelBadge = page.locator('#challenge-level-badge');
    await expect(challengeLevelBadge).toBeVisible();
    await expect(challengeLevelBadge).toHaveText('NIVEL JUNIOR');

    const challengeTypeBadge = page.locator('#challenge-type-badge');
    await expect(challengeTypeBadge).toContainText('Junior');

    // 7. Evaluar solución y comprobar badge de score sin 'Senior' indebido
    await page.locator('#user-solution-input').fill('map retorna un nuevo array transformado mientras forEach itera sin retornar nada.');
    await page.locator('#btn-evaluate-solution').click();

    await expect(page.locator('#evaluation-results-panel')).toBeVisible();
    const scoreBadge = page.locator('#score-badge-container');
    await expect(scoreBadge).toContainText('Nivel Junior');
    await expect(scoreBadge).not.toContainText('Senior Sólido');
  });

  test('Soft Skills muestra badges dinámicos y descripción explícita del rol según el nivel', async ({ page }) => {
    // Interceptar topics para junior y senior
    await page.route('**/api/topics/due**', async (route) => {
      const url = route.request().url();
      if (url.includes('level=senior')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              _id: '674c00000000000000000021',
              title: 'Defensa de Trade-Offs ante Stakeholders en Arquitectura',
              category: 'soft_skill',
              type: 'practice',
              level: 'senior',
            },
          ]),
        });
      } else {
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
          ]),
        });
      }
    });

    // Mock start para junior
    await page.route('**/api/practice/soft-skill/start', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.topicId === '674c00000000000000000021') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            topicId: '674c00000000000000000021',
            title: 'Defensa de Trade-Offs ante Stakeholders en Arquitectura',
            level: 'senior',
            role: 'CTO Escéptico',
            roleDescription: 'CTO de la empresa en revisión de arquitectura y costos',
            avatar: '👔',
            scenario: 'El CTO cuestiona la justificación técnica de la inversión en alta disponibilidad.',
            initialQuestion: '¿Por qué necesitamos tanta infraestructura cara en la nube?',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            topicId: '674c00000000000000000011',
            title: 'Daily Standup: Estructura Qué Hice, Qué Haré y Bloqueos',
            level: 'junior',
            role: 'Scrum Master / PM de Equipo',
            roleDescription: 'Scrum Master / PM en el Daily Standup matutino',
            avatar: '📋',
            scenario: 'En la daily matutina, el equipo necesita saber tu progreso y si tienes bloqueos.',
            initialQuestion: 'Hola! ¿Podrías darme un resumen conciso de qué hiciste ayer, qué harás hoy y si tienes algún bloqueo?',
          }),
        });
      }
    });

    await page.goto('/');

    // 1. Cambiar a la pestaña de Soft Skills
    await page.locator('#tab-soft-skills').click();
    await expect(page.locator('#soft-skills-section')).toBeVisible();

    // 2. Comprobar badge dinámico en cabecera inicial (Junior)
    const dynamicBadge = page.locator('#dynamic-level-badge-soft-skills');
    await expect(dynamicBadge).toBeVisible();
    await expect(dynamicBadge).toHaveText('NIVEL JUNIOR');

    // 3. Probar cambio a nivel Mid y Senior en reposo
    await page.locator('#level-btn-mid-soft-skills').click();
    await expect(dynamicBadge).toHaveText('NIVEL MID');

    await page.locator('#level-btn-senior-soft-skills').click();
    await expect(dynamicBadge).toHaveText('NIVEL SENIOR');

    // 4. Volver a Junior e iniciar sparring
    await page.locator('#level-btn-junior-soft-skills').click();
    await expect(dynamicBadge).toHaveText('NIVEL JUNIOR');

    await page.locator('#btn-start-sparring').click();

    // 5. Validar tarjeta de interlocutor y descripción del rol para Junior
    const banner = page.locator('#client-role-banner');
    await expect(banner).toBeVisible();

    const roleLevelBadge = page.locator('#client-role-level-badge');
    await expect(roleLevelBadge).toBeVisible();
    await expect(roleLevelBadge).toHaveText('NIVEL JUNIOR');

    const roleName = page.locator('#client-role-name');
    await expect(roleName).toHaveText('Scrum Master / PM de Equipo');

    const roleDesc = page.locator('#client-role-description');
    await expect(roleDesc).toBeVisible();
    await expect(roleDesc).toContainText('Rol: Scrum Master / PM en el Daily Standup matutino');
  });
});
