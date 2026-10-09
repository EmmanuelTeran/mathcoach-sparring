# [US-07] Niveles de Progresión y Andamiaje Pedagógico (Scaffolding)

- **Estado:** Done
- **Rama:** `feature/US-07-progression-levels-and-scaffolding`
- **Fecha de Inicio:** 2026-10-02
- **Fecha de Cierre:** 2026-10-02

## 1. Descripción

Incorporar niveles de progresión pedagógica (Junior / Mid / Senior) al modelo de tópicos y a la experiencia de entrenamiento. Se añade un endpoint de pistas pedagógicas (`/hint`) que usa Gemini con rol de tutor socrático sin revelar respuestas directas, filtro de nivel en el dashboard, re-seed estratificado con distribución temática por nivel, selector visual de nivel en Dashboard y HardSkillTrainer, y botón "💡 Dame una pista / Modelo Mental" en el entrenador de hard skills.

## 2. Criterios de Aceptación (AC)

- [x] AC-1: `server/src/models/Topic.js` actualizado con campo `level`: enum `['junior', 'mid', 'senior']`, default `'junior'`.
- [x] AC-2: Endpoint `POST /api/practice/hard-skill/hint` que recibe `{ topicId, challenge }`, consulta Gemini con rol pedagógico socrático y retorna `{ analogy: String, guidingQuestions: [String] }` sin revelar código ni respuestas directas.
- [x] AC-3: `GET /api/dashboard/summary` soporta filtro `?level=junior|mid|senior`, priorizando recomendaciones del nivel seleccionado.
- [x] AC-4: Script `npm run seed` actualizado con distribución estratificada: Junior (bases JS, async/await, CRUD Express), Mid (custom hooks, JWT, relaciones Mongo), Senior (libuv/event loop, concurrencia, índices compuestos, trade-offs).
- [x] AC-5: Frontend: selector visual de nivel (Junior / Mid / Senior) en Dashboard y HardSkillTrainer.
- [x] AC-6: Frontend: botón interactivo "💡 Dame una pista / Modelo Mental" en `HardSkillTrainer.jsx` que despliega la analogía y preguntas guía.
- [x] AC-7: `server/tests/hint.test.js` con mock de Gemini + prueba E2E `tests/e2e/scaffolding.spec.js` pasando 100% en verde.

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `Topic`, `getDashboardSummary()`, `HardSkillTrainer()`, `Dashboard()`, `geminiService.js`, `seed.js`, `practiceRouter`
- **Archivos intervenidos:**
  - `server/src/models/Topic.js` — campo `level` añadido
  - `server/src/services/geminiService.js` — función `generateHint()` añadida
  - `server/src/routes/practice.js` — endpoint `POST /hint` añadido
  - `server/src/routes/topics.js` — filtro `?level=` en `GET /due`
  - `server/src/controllers/dashboardController.js` — filtro `?level=` en summary
  - `server/src/scripts/seed.js` — re-seed estratificado 34 topics (8+8+8 hard + 10 soft)
  - `client/src/components/HardSkillTrainer.jsx` — selector de nivel + botón de pista + panel hint
  - `client/src/components/Dashboard.jsx` — selector de nivel (Todos/Junior/Mid/Senior)
  - `server/tests/hint.test.js` — prueba unitaria con mock (nuevo)
  - `server/tests/seed.test.js` — actualizado para nuevo conteo estratificado
  - `tests/e2e/hard-skills.spec.js` — mock route actualizado para `?level=`
  - `tests/e2e/scaffolding.spec.js` — prueba E2E (nuevo)

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```
Test Files  8 passed (8)
     Tests  52 passed (52)
  Start at  01:14:32
  Duration  13.94s

hint.test.js (11 tests):
  ✓ AC-1: Topic model has level field › defaults to junior when level is not specified
  ✓ AC-1: Topic model has level field › accepts valid enum values for level
  ✓ AC-1: Topic model has level field › rejects invalid level values
  ✓ AC-2: POST /api/practice/hard-skill/hint › returns 400 when topicId is missing
  ✓ AC-2: POST /api/practice/hard-skill/hint › returns 400 when challenge is missing
  ✓ AC-2: POST /api/practice/hard-skill/hint › returns 404 when topic not found
  ✓ AC-2: POST /api/practice/hard-skill/hint › returns analogy and guidingQuestions from Gemini mock
  ✓ AC-2: POST /api/practice/hard-skill/hint › does not return direct code or answers in hint
  ✓ AC-3: GET /api/dashboard/summary › filters dueTopics by level=junior
  ✓ AC-3: GET /api/dashboard/summary › filters dueTopics by level=mid
  ✓ AC-3: GET /api/dashboard/summary › returns all due topics when no level filter is applied
```

### Tests E2E (Playwright)

```
Running 12 tests using 2 workers

  ✓ [chromium] › dashboard.spec.js › carga métricas del dashboard (1.6s)
  ✓ [chromium] › hard-skills.spec.js › permite seleccionar un tema y evaluar (1.9s)
  ✓ [chromium] › smoke.spec.js › frontend loads properly (800ms)
  ✓ [chromium] › soft-skills.spec.js › permite sparring por voz (2.1s)
  ✓ [chromium] › dashboard.spec.js › navegación entre pestañas (1.1s)
  ✓ [chromium] › scaffolding.spec.js › AC-5: Dashboard muestra selector de nivel (723ms)
  ✓ [chromium] › scaffolding.spec.js › AC-5: Clic en nivel Junior recarga métricas (1.4s)
  ✓ [chromium] › scaffolding.spec.js › AC-5: Clic en nivel Mid recarga métricas (920ms)
  ✓ [chromium] › scaffolding.spec.js › AC-5: Clic en nivel Senior recarga métricas (876ms)
  ✓ [chromium] › scaffolding.spec.js › AC-5: Hard Skills muestra selector de nivel (544ms)
  ✓ [chromium] › scaffolding.spec.js › AC-6: Botón Dame una pista existe en Hard Skills (602ms)
  ✓ [chromium] › scaffolding.spec.js › AC-3: Dashboard responde a nivel Todos (1.6s)

  12 passed (10.7s)
```

## 5. Commit de Cierre en dev

`d9e37ab`
