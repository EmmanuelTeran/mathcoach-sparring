# [US-02] Schemas Mongoose y Motor Algorítmico SRS (SM-2 Adaptado)

- **Estado:** Done
- **Rama:** `feature/US-02-srs-engine-and-models`
- **Fecha de Inicio:** 2026-09-30
- **Fecha de Cierre:** 2026-09-30

## 1. Descripción

Implementar el motor algorítmico de repetición espaciada (SRS basado en una adaptación de SM-2) mediante una función pura (`srsCalculator.js`), los modelos Mongoose para temas (`Topic`) con histórico de revisiones, y los endpoints REST para obtener los temas pendientes (`GET /api/topics/due`) y registrar una sesión de repaso (`POST /api/topics/review`), asegurando cobertura total de tests unitarios y de integración.

## 2. Criterios de Aceptación (AC)

- [x] AC-1: Utilidad pura `server/src/utils/srsCalculator.js` con tests unitarios al 100% de cobertura (`server/tests/srsCalculator.test.js`):
  - Scores 1 y 2 (fallo/duda severa) resetean `srsStage = 0`, `intervalDays = 1`.
  - Score 3 (aprobado raspado) mantiene intervalo corto (3 días) o reinicia escalado.
  - Scores 4 y 5 escalan intervalos exponencialmente usando `easeFactor`.
  - El `easeFactor` nunca desciende por debajo de 1.3.
- [x] AC-2: Modelo Mongoose `server/src/models/Topic.js` con los campos:
  - `title`, `category` (enum: `hard_skill` | `soft_skill`), `type` (enum: `theory` | `practice`), `srsStage` (default 0), `easeFactor` (default 2.5), `intervalDays` (default 0), `nextReviewAt` (Date, default Date.now), y subdocumentos `history` (score, userInput, aiFeedback, reviewedAt).
- [x] AC-3: Endpoints REST:
  - `GET /api/topics/due`: devuelve temas con `nextReviewAt <= Date.now()` ordenados por prioridad (menor score histórico y mayor retraso).
  - `POST /api/topics/review`: recibe `{ topicId, score, userInput, aiFeedback }`, aplica el cálculo de `srsCalculator`, guarda el log en el historial y actualiza el tópico en Mongo reprogramando `nextReviewAt`.
- [x] AC-4: Integration tests con Supertest (`server/tests/topics.test.js`) validando ambos endpoints y asegurando que `nextReviewAt` quede correctamente en el futuro.
- [x] AC-5: Suite completa (`npm test` y `npm run test:e2e`) ejecutándose 100% en verde sin regresiones.

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `Topic`, `topics.js`, `Topic.js`, `srsCalculator.js`, `calculateNextReview()`, `topicsRouter`, `reviewHistorySchema`, `topicSchema`, `topics.test.js`, `srsCalculator.test.js`
- **Archivos a intervenir:**
  - `server/src/utils/srsCalculator.js`
  - `server/src/models/Topic.js`
  - `server/src/routes/topics.js`
  - `server/src/app.js`
  - `server/tests/srsCalculator.test.js`
  - `server/tests/topics.test.js`
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

 ✓ tests/srsCalculator.test.js (11 tests) 15ms
 ✓ tests/health.test.js (1 test) 1110ms
 ✓ tests/topics.test.js (8 tests) 1432ms

 Test Files  3 passed (3)
      Tests  20 passed (20)
   Start at  21:19:20
   Duration  2.75s (transform 150ms, setup 0ms, collect 1.65s, tests 2.56s, environment 1ms, prepare 430ms)
```

### Tests E2E (Playwright)

```bash
> devcoach-sparring@1.0.0 test:e2e
> LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" playwright test

Running 1 test using 1 worker

  ✓  1 tests/e2e/smoke.spec.js:4:3 › Smoke Test - Frontend & Health › frontend loads properly and shows header (1.1s)

  1 passed (3.9s)
```

## 5. Commit de Cierre en dev

`ad850f8b50c25f395b97305e7fe1bebd0e6d84fe`
