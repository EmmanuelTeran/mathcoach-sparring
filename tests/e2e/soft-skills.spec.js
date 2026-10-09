import { test, expect } from '@playwright/test';

test.describe('Soft Skills Module - Sparring por Voz & Consultoría E2E', () => {
  test('permite cambiar a la pestaña de Soft Skills, iniciar sparring, negociar 3 turnos con fallback de texto y ver veredicto final', async ({
    page,
  }) => {
    // Interceptar llamadas a la API para determinismo E2E
    await page.route('**/api/topics/due**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '674c33332222333344445555',
            title: 'Negociación de Deuda Técnica vs Lanzamiento',
            category: 'soft_skill',
            type: 'practice',
            srsStage: 0,
            intervalDays: 0,
          },
        ]),
      });
    });

    await page.route('**/api/practice/soft-skill/start', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          topicId: '674c33332222333344445555',
          title: 'Negociación de Deuda Técnica vs Lanzamiento',
          role: 'Tech Lead Escéptico',
          avatar: '🛡️',
          scenario: 'El cliente exige adelantar el lanzamiento ignorando la estrategia de tests.',
          initialQuestion:
            '¿Por qué insistes en escribir tests de integración si los tests manuales nos permitirían salir en dos días?',
        }),
      });
    });

    let replyCount = 0;
    await page.route('**/api/practice/soft-skill/reply', async (route) => {
      replyCount += 1;

      if (replyCount === 1) {
        // Primer turno de usuario -> réplica intermedia del cliente
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isFinalTurn: false,
            role: 'Tech Lead Escéptico',
            reply:
              'Entiendo el valor teórico, pero si fallamos la fecha de entrega el cliente cancelará el contrato. ¿Cómo mitigas ese riesgo financiero inmediato?',
          }),
        });
      } else if (replyCount === 2) {
        // Segundo turno de usuario -> segunda réplica intermedia
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isFinalTurn: false,
            role: 'Tech Lead Escéptico',
            reply:
              '¿Y qué pasa si automatizamos solo el flujo de checkout y dejamos el resto para el siguiente sprint?',
          }),
        });
      } else {
        // Tercer turno de usuario -> veredicto formal
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isFinalTurn: true,
            role: 'Tech Lead Escéptico',
            score: 5,
            feedback:
              'Excelente liderazgo y manejo de presión. Negociaste un MVP con cobertura crítica (checkout) sin ceder en estabilidad operacional.',
            businessClarity:
              'Tradujiste el riesgo de bugs en checkout directamente a pérdida de facturación e imagen de marca.',
            tradeOffDefense:
              'Defendiste con claridad el trade-off de priorizar el camino feliz crítico postergando features secundarias.',
            assertivenessScore: 5,
            missingTradeoffs: [],
            strengths: [
              'Propuesta constructiva de compromiso',
              'Lenguaje asertivo y sereno',
            ],
            nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            srsStage: 1,
            intervalDays: 1,
            sessionLogId: '674c88887777666655554444',
          }),
        });
      }
    });

    // 1. Navegar a la aplicación
    await page.goto('/');

    // 2. Cambiar a la pestaña "Soft Skills (Voz & Consultoría)"
    const tabSoftSkills = page.locator('#tab-soft-skills');
    await expect(tabSoftSkills).toBeVisible();
    await tabSoftSkills.click();

    // 3. Verificar sección de Soft Skills activa
    const softSkillsSection = page.locator('#soft-skills-section');
    await expect(softSkillsSection).toBeVisible();

    // 4. Iniciar sesión de sparring
    const btnStart = page.locator('#btn-start-sparring');
    await expect(btnStart).toBeVisible();
    await btnStart.click();

    // 5. Verificar banner del cliente y primera pregunta
    await expect(page.locator('#client-role-banner')).toBeVisible();
    await expect(page.locator('#client-role-name')).toContainText('Tech Lead Escéptico');
    await expect(page.locator('#chat-messages-container')).toContainText('¿Por qué insistes en escribir tests de integración');

    // 6. Turno 1: Enviar defensa con fallback de texto
    const textInput = page.locator('#user-voice-transcript-input');
    const sendBtn = page.locator('#btn-send-reply');

    await textInput.fill(
      'Los tests manuales no previenen regresiones en flujos de pago. Un fallo en producción costaría 10 veces más que dos días de retraso.'
    );
    await sendBtn.click();

    // Verificar réplica intermedia 1
    await expect(page.locator('#chat-messages-container')).toContainText('¿Cómo mitigas ese riesgo financiero inmediato?');

    // 7. Turno 2: Responder a la segunda objeción
    await textInput.fill(
      'Podemos mitigar el riesgo priorizando las pruebas automáticas en el flujo crítico y lanzando en canary release.'
    );
    await sendBtn.click();

    // Verificar réplica intermedia 2
    await expect(page.locator('#chat-messages-container')).toContainText('automatizamos solo el flujo de checkout');

    // 8. Turno 3: Turno final con veredicto
    await textInput.fill(
      'De acuerdo, automatizamos el checkout crítico hoy y firmamos el compromiso de cubrir el resto en el siguiente sprint.'
    );
    await sendBtn.click();

    // 9. Validar panel de veredicto final
    const verdictPanel = page.locator('#soft-skill-verdict-panel');
    await expect(verdictPanel).toBeVisible();

    // Badge de score
    await expect(page.locator('#verdict-score-badge')).toContainText('Score 5/5');

    // Texto de feedback y dimensiones
    await expect(page.locator('#verdict-feedback-text')).toContainText('Excelente liderazgo y manejo de presión');
    await expect(page.locator('#verdict-business-clarity')).toContainText('pérdida de facturación');
    await expect(page.locator('#verdict-tradeoff-defense')).toContainText('camino feliz crítico');
    await expect(page.locator('#verdict-assertiveness-score')).toContainText('5/5');

    // Fortalezas
    await expect(page.locator('#verdict-strengths-list')).toContainText('Propuesta constructiva de compromiso');

    // Próximo repaso SRS
    await expect(page.locator('#soft-skill-next-review-date')).toBeVisible();
  });
});
