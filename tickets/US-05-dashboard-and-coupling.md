# [US-05] Dashboard Operativo y Acoplamiento de Habilidades (Hard + Soft Skills)

- **Estado:** Done
- **Rama:** `feature/US-05-dashboard-and-coupling`
- **Fecha de Inicio:** 2026-09-30
- **Fecha de Cierre:** 2026-09-30

## 1. Descripción

Implementar el Dashboard principal de métricas y cola diaria de práctica que unifica el progreso de Hard Skills y Soft Skills. Expone el endpoint consolidado `GET /api/dashboard/summary` que calcula conteos pendientes (`dueCount`, `dueHardSkills`, `dueSoftSkills`), detecta temas con deficiencias críticas (`criticalTopics` con último score < 3 ordenados de menor a mayor) e implementa la regla de recomendación acoplada (`recommendedNext`): si el tema más urgente es una soft skill pero su contraparte técnica (misma subcategoría o categoría) tiene calificación deficiente (< 3), prioriza el reto de hard skill para cimentar la base técnica antes de la defensa verbal.

En frontend, proveer un Dashboard reactivo integrado en `client/src/App.jsx` con tarjetas analíticas de pendientes, desglose visual, botón destacado "Entrenar Ahora" con navegación inteligente directa al módulo y tema sugerido, y la lista interactiva de áreas críticas. El flujo se valida con pruebas unitarias/integración y prueba E2E en Playwright.

## 2. Criterios de Aceptación (AC)

- [x] AC-1: Endpoint backend `GET /api/dashboard/summary` en `server/src/routes/dashboard.js` y `server/src/controllers/dashboardController.js` retornando:
  - `dueCount`: total de temas pendientes para hoy (`nextReviewAt <= Date.now()`).
  - `dueHardSkills`: retos técnicos pendientes (`type === 'theory'`).
  - `dueSoftSkills`: simulaciones de voz pendientes (`type === 'practice'`).
  - `criticalTopics`: temas con último score < 3 según su última sesión o score registrado, ordenados ascendentemente.
  - `recommendedNext`: selección inteligente del tema más urgente considerando acoplamiento de bases teóricas antes de defensa verbal.
- [x] AC-2: Suite de pruebas backend `server/tests/dashboard.test.js` con Supertest validando métricas, detección de áreas críticas y la regla de acoplamiento de recomendación.
- [x] AC-3: Componente frontend `client/src/components/Dashboard.jsx` integrado en `client/src/App.jsx` con tarjetas de resumen, desglose de pendientes, botón "Entrenar Ahora" y tabla de áreas críticas.
- [x] AC-4: Navegación unificada entre Dashboard, Hard Skills y Soft Skills permitiendo cargar temas automáticamente desde el Dashboard.
- [x] AC-5: Prueba E2E en Playwright (`tests/e2e/dashboard.spec.js`) verificando carga de métricas, navegación con "Entrenar Ahora" y renderizado de áreas críticas.
- [x] AC-6: Verificación de no regresión (`npm test` pasando todos los 32 tests previos + 5 nuevos de dashboard = 37 tests) y E2E general (5 tests) en verde.
- [x] AC-7: Documentación actualizada en `docs/USER_GUIDE.md` y `docs/ARCHITECTURE.md`.

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `Topic`, `SessionLog`, `dashboardRouter`, `dashboardController`, `Dashboard.jsx`, `App.jsx`, `dashboard.test.js`, `dashboard.spec.js`
- **Archivos intervenidos:**
  - `server/src/controllers/dashboardController.js`
  - `server/src/routes/dashboard.js`
  - `server/src/app.js`
  - `server/tests/dashboard.test.js`
  - `client/src/components/Dashboard.jsx`
  - `client/src/components/HardSkillTrainer.jsx`
  - `client/src/components/SoftSkillTrainer.jsx`
  - `client/src/App.jsx`
  - `tests/e2e/dashboard.spec.js`
  - `tests/e2e/hard-skills.spec.js`
  - `docs/USER_GUIDE.md`
  - `docs/ARCHITECTURE.md`

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración Backend (Vitest / Supertest)

```bash
> devcoach-sparring@1.0.0 test
> npm run test:server

> devcoach-sparring@1.0.0 test:server
> npm --workspace=server test

> server@1.0.0 test
> vitest run

 RUN  v3.2.7 /home/teran/proyectos/devcoach-sparring/server

 ✓ tests/softSkillPractice.test.js (6 tests) 1272ms
 ✓ tests/dashboard.test.js (5 tests) 1300ms
 ✓ tests/topics.test.js (8 tests) 1414ms
 ✓ tests/srsCalculator.test.js (11 tests) 12ms
 ✓ tests/health.test.js (1 test) 864ms
 ✓ tests/practice.test.js (6 tests) 1051ms

 Test Files  6 passed (6)
      Tests  37 passed (37)
   Start at  22:12:15
   Duration  4.78s (transform 298ms, setup 0ms, collect 4.50s, tests 5.91s, environment 2ms, prepare 720ms)
```

### Tests End-to-End (Playwright)

```bash
> devcoach-sparring@1.0.0 test:e2e
> LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" playwright test

Running 5 tests using 2 workers

  ✓  1 … áreas críticas y permite navegar con "Entrenar Ahora" (2.2s)
  ✓  2 …eto técnico, enviar solución y ver evaluación completa (2.1s)
  ✓  3 …d & Health › frontend loads properly and shows header (501ms)
  ✓  4 …e entre pestañas Dashboard, Hard Skills y Soft Skills (908ms)
  ✓  5 …r 3 turnos con fallback de texto y ver veredicto final (1.4s)

  5 passed (7.1s)
```
