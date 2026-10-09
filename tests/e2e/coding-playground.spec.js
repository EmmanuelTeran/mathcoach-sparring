import { test, expect } from '@playwright/test';

test.describe('Coding Playground E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/practice/coding/challenges?level=junior', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '674c11112222333344445555',
            title: 'Reto de Código: Suma de Números Pares',
            level: 'junior',
            srsStage: 0,
            nextReviewAt: new Date().toISOString(),
            isDue: true,
            codingChallenge: {
              functionName: 'sumEvenNumbers',
              description: 'Suma números pares de un array.',
              starterCode:
                'function sumEvenNumbers(numbers) {\n  console.log("debug-e2e");\n  return numbers.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0);\n}\n',
              constraints: ['No mutar input'],
              testCases: [
                { input: [[1, 2, 3, 4]], expected: 6, isHidden: false },
                { input: [[]], expected: 0, isHidden: false },
                { input: [[-2, -3, 5]], expected: -2, isHidden: false },
                { input: [[10, 15, 20, 25]], expected: 30, isHidden: true },
              ],
            },
          },
        ]),
      });
    });
  });

  test('1. Happy path: Run Code ejecuta los 4 tests y muestra logs', async ({ page }) => {
    await page.goto('/');
    await page.click('#tab-coding-playground');
    await expect(page.locator('.monaco-editor')).toBeVisible();

    await page.click('#btn-run-code');

    await expect(page.locator('#test-results-summary')).toContainText('4/4 tests pasaron');

    const item0 = page.locator('#test-result-item-0');
    await expect(item0).toHaveAttribute('data-status', 'PASSED');

    const hiddenItem = page.locator('#test-result-item-3');
    await expect(hiddenItem).toContainText('Test oculto');

    await page.click('#console-tab-logs');
    await expect(page.locator('#console-logs-output')).toContainText('debug-e2e');
  });

  test('2. Submit: evalúa con el backend y muestra el panel de auditoría', async ({ page }) => {
    await page.route('**/api/practice/coding/evaluate', async (route) => {
      const requestBody = JSON.parse(route.request().postData() || '{}');
      expect(requestBody.testResults.passedCount).toBe(4);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          score: 5,
          feedback: 'Solución impecable e inmutable.',
          allTestsPassed: true,
          aiReviewed: true,
          passedCount: 4,
          totalCount: 4,
          complexity: { time: 'O(n)', space: 'O(1)' },
          readability: 'Código conciso.',
          naming: 'Bueno.',
          strengths: ['Uso limpio de filter y reduce'],
          improvements: [],
          nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
          srsStage: 1,
          intervalDays: 1,
          sessionLogId: '674c99998888777766665555',
        }),
      });
    });

    await page.goto('/');
    await page.click('#tab-coding-playground');
    await expect(page.locator('.monaco-editor')).toBeVisible();

    await page.click('#btn-submit-code');

    await expect(page.locator('#coding-eval-score')).toContainText('5/5');
    await expect(page.locator('#coding-eval-complexity-time')).toContainText('O(n)');
  });

  test('3. Syntax error: muestra banner de SyntaxError en la consola', async ({ page }) => {
    await page.route('**/api/practice/coding/challenges?level=junior', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '674c11112222333344445555',
            title: 'Reto Sintaxis Rota',
            level: 'junior',
            srsStage: 0,
            nextReviewAt: new Date().toISOString(),
            isDue: true,
            codingChallenge: {
              functionName: 'sumEvenNumbers',
              description: 'Suma números pares.',
              starterCode: 'function sumEvenNumbers(numbers) {',
              testCases: [{ input: [[1, 2]], expected: 2 }],
            },
          },
        ]),
      });
    });

    await page.goto('/');
    await page.click('#tab-coding-playground');
    await expect(page.locator('.monaco-editor')).toBeVisible();

    await page.click('#btn-run-code');
    await expect(page.locator('#coding-error-banner')).toContainText('SyntaxError');
  });

  test('4. Escritura en editor: al modificar código la prueba falla', async ({ page }) => {
    await page.goto('/');
    await page.click('#tab-coding-playground');
    await expect(page.locator('.monaco-editor')).toBeVisible();

    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText('function sumEvenNumbers(n){ return 0; }');

    await page.click('#btn-run-code');

    await expect(page.locator('#test-results-summary')).not.toContainText('4/4 tests pasaron');
    await expect(page.locator('#test-result-item-0')).toHaveAttribute('data-status', 'FAILED');
  });
});
