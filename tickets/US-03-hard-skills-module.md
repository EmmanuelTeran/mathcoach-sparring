# [US-03] Módulo Hard Skills: Active Recall Teórico y Práctico con IA

- **Estado:** Done
- **Rama:** `feature/US-03-hard-skills-module`
- **Fecha de Inicio:** 2026-09-30
- **Fecha de Cierre:** 2026-09-30

## 1. Descripción

Implementar el módulo interactivo de Hard Skills que combina Active Recall con evaluación experta de IA utilizando el SDK `@google/genai` (modelo `gemini-2.5-flash`). El sistema genera desafíos técnicos adaptados según el tipo de tema (teoría avanzada sobre arquitectura interna/protocolos/trade-offs o escenarios prácticos de cuellos de botella/diseño/optimización), evalúa la respuesta del usuario con un rol de Senior Evaluator sin condescendencia, computa y actualiza la progresión del algoritmo SRS (`srsCalculator`), y expone una interfaz frontend reactiva con visualizador del reto, editor monoespaciado y panel analítico de feedback y próxima revisión.

## 2. Criterios de Aceptación (AC)

- [x] AC-1: Integración de `@google/genai` en `server/src/services/geminiService.js` con fallback y soporte para `process.env.GEMINI_API_KEY` usando `gemini-2.5-flash`.
- [x] AC-2: Endpoints REST en `server/src/routes/practice.js`:
  - `POST /api/practice/hard-skill/generate`: Recibe `{ topicId }`, valida existencia del tema en MongoDB, genera desafío técnico (teórico o práctico) enfocado en profundidad senior.
  - `POST /api/practice/hard-skill/evaluate`: Recibe `{ topicId, challenge, userSolution }`, evalúa mediante prompt estricto Senior Evaluator retornando `{ score, feedback, missingTradeoffs, strengths }`, actualiza el Topic con `srsCalculator` y registra el log de sesión.
- [x] AC-3: Suite de pruebas unitarias/integración (`server/tests/practice.test.js`) con mock de `@google/genai` vía `vi.mock`, validando status 200, estructura de respuesta y actualización en base de datos.
- [x] AC-4: Componente Frontend `client/src/components/HardSkillTrainer.jsx` y su integración en `App.jsx`:
  - Selector de tema pendiente o botón de carga prioritaria.
  - Visualizador de desafío técnico.
  - Textarea monoespaciado para código o redacción de solución.
  - Botón "Evaluar Solución" con indicador de carga / spinner.
  - Panel de resultados con badge de score (1-5), feedback técnico, lista de fortalezas, puntos ciegos / missing tradeoffs, y fecha programada de próximo repaso.
- [x] AC-5: Prueba E2E en Playwright (`tests/e2e/hard-skills.spec.js`) verificando el flujo completo de selección, resolución y presentación de feedback.
- [x] AC-6: Suite global en verde (`npm test` y `npm run test:e2e`).
- [x] AC-7: Documentación actualizada en `docs/USER_GUIDE.md` y `docs/ARCHITECTURE.md`.

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `Topic`, `SessionLog`, `srsCalculator`, `practiceRouter`, `geminiService`, `HardSkillTrainer`, `App.jsx`, `practice.test.js`, `hard-skills.spec.js`
- **Archivos intervenidos:**
  - `server/package.json`
  - `server/.env.example`
  - `server/src/models/SessionLog.js`
  - `server/src/services/geminiService.js`
  - `server/src/routes/practice.js`
  - `server/src/app.js`
  - `server/tests/practice.test.js`
  - `client/src/components/HardSkillTrainer.jsx`
  - `client/src/App.jsx`
  - `tests/e2e/hard-skills.spec.js`
  - `docs/USER_GUIDE.md`
  - `docs/ARCHITECTURE.md`

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
> devcoach-sparring@1.0.0 test
> npm run test:server

> devcoach-sparring@1.0.0 test:server
> npm --workspace=server test

> server@1.0.0 test
> vitest run

 RUN  v3.2.7 /home/teran/proyectos/devcoach-sparring/server

 ✓ tests/health.test.js (1 test) 1939ms
 ✓ tests/practice.test.js (6 tests) 2089ms
 ✓ tests/topics.test.js (8 tests) 2446ms
 ✓ tests/srsCalculator.test.js (11 tests) 18ms
                                       
 Test Files  4 passed (4) 
      Tests  26 passed (26)
   Duration  5.28s
```

### Tests E2E (Playwright)

```bash
> devcoach-sparring@1.0.0 test:e2e
> LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" playwright test

Running 2 tests using 2 workers

  ✓  1 …oads properly and shows header (5.5s)
  ✓  2 …ción y ver evaluación completa (7.1s)

  2 passed (12.0s)
```

