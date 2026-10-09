# [US-08] Catálogo Completo Multinivel (Junior/Mid/Senior) y Sincronización UI

- **Estado:** Done
- **Rama:** `feature/US-08-multilevel-catalog-and-ui-sync`
- **Fecha de Inicio:** 2026-10-02
- **Fecha de Cierre:** 2026-10-02

## 1. Descripción

Proveer un catálogo multinivel robusto y completo en base de datos para perfiles Junior, Mid y Senior, tanto en Hard Skills como en Soft Skills, utilizando `Topic.bulkWrite` con `upsert: true` para sincronizar y actualizar el campo `level` de los tópicos existentes. Además, sincronizar la interfaz de usuario en `SoftSkillTrainer.jsx` y `HardSkillTrainer.jsx` para que filtren sus listas según el nivel seleccionado (Junior, Mid, Senior), y adaptar `dashboardController.js` para que el resumen y los contadores (`dueCount`, `dueHardSkills`, `dueSoftSkills`) respondan estrictamente al filtro `?level=...`.

## 2. Criterios de Aceptación (AC)

- [x] AC-1: Script de Seeding Robusto (`server/src/scripts/seed.js`):
  - Actualizar los 30 temas originales de US-06 asegurando `level: 'senior'`.
  - Añadir 10 Hard Skills Junior: Métodos de arrays (map/filter/reduce), Async/Await vs Callbacks, CRUD básico en Express, Códigos de estado HTTP, Scopes y closures, useState inmutabilidad, useEffect dependencias y cleanup, Validación de inputs con schemas simples, Queries básicas en Mongo (filtros, proyecciones), Renderizado condicional en React.
  - Añadir 10 Soft Skills Junior (Interacciones Críticas): Daily Standup, Pedir Ayuda, Demo de Ticket a PM, Code Review, Aclaración de Requerimientos, Estimación de Tareas Pequeñas, Manejo de Errores en Staging, Entrega con Documentación, Priorización de Interrupciones, Alineación con el Diseño.
  - Añadir 6 Hard Skills Mid y 6 Soft Skills Mid: Manejo de Custom Hooks, Context API vs Zustand, Índices simples en Mongo, Arquitectura en capas, Negociación de deuda técnica en sprint, Refactorización sin romper contratos, etc.
  - Usar `Topic.bulkWrite` con `upsert: true` para que sobreescriba y actualice el campo `level` de los documentos ya existentes en MongoDB.
- [x] AC-2: Sincronización en Frontend (`SoftSkillTrainer.jsx` y `HardSkillTrainer.jsx`):
  - Ambos componentes deben reflejar el filtro de nivel activo (Junior / Mid / Senior) para que la lista de temas cargue solo los del nivel seleccionado.
  - Si se selecciona "Junior", el combo de Soft Skills debe mostrar los nuevos escenarios de Daily, Demos y Feedback.
- [x] AC-3: Backend (`dashboardController.js`):
  - Al filtrar `?level=junior|mid|senior`, los conteos de `dueCount`, `dueHardSkills` y `dueSoftSkills` deben calcularse únicamente sobre los temas de ese nivel.
- [x] AC-4: Suite de Tests:
  - Actualizar `server/tests/seed.test.js` y tests de dashboard comprobando que cada nivel tenga al menos 10 tópicos y responda métricas aisladas.
  - Playwright E2E verificando que al hacer clic en "Junior", los contadores cambien de 0 al total sembrado y carguen los escenarios de junior.

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `Topic`, `seedTopics()`, `getDashboardSummary()`, `SoftSkillTrainer()`, `HardSkillTrainer()`, `practiceRouter`, `topicsRouter`
- **Archivos intervenidos:**
  - `server/src/scripts/seed.js` — Catálogo completo de 62 tópicos (20 Junior, 12 Mid, 30 Senior) con `bulkWrite` y `upsert: true`
  - `server/src/controllers/dashboardController.js` — Desglose de conteos `dueCount`, `dueHardSkills`, `dueSoftSkills` aislados por `levelFilter`
  - `client/src/components/SoftSkillTrainer.jsx` — Selector de nivel visual, estado reactivo y filtro de escenarios por nivel
  - `client/src/components/HardSkillTrainer.jsx` — Filtrado exclusivo de hard skills por nivel
  - `server/tests/seed.test.js` — Validaciones de 62 tópicos, >=10 tópicos por nivel, idempotencia y actualización de `level` con `bulkWrite`
  - `server/tests/dashboard.test.js` — Pruebas de métricas aisladas con `?level=junior`, `?level=mid`, `?level=senior` y agregadas sin filtro
  - `tests/e2e/multilevel-catalog.spec.js` — Suite Playwright E2E verificando sincronización de contadores del Dashboard y escenarios de Soft Skills
  - `tests/e2e/soft-skills.spec.js` — Interceptor con wildcard `**/api/topics/due**`

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
> devcoach-sparring@1.0.0 test
> npm run test:server

> server@1.0.0 test
> vitest run

 RUN  v3.2.7 /home/teran/proyectos/devcoach-sparring/server

 ✓ tests/seed.test.js (5 tests) 2515ms
   ✓ Seed Script Integration Tests > siembra el catálogo completo multinivel de 62 temas en la base de datos limpia
   ✓ Seed Script Integration Tests > valida que cada nivel (Junior, Mid, Senior) tenga al menos 10 tópicos y distribución Hard/Soft
   ✓ Seed Script Integration Tests > es completamente idempotente: no duplica registros al ejecutarse múltiples veces
   ✓ Seed Script Integration Tests > respeta el progreso de SRS y no sobreescribe srsStage ni history existentes
   ✓ Seed Script Integration Tests > actualiza el campo level en documentos existentes con bulkWrite forzando el nuevo level
 ✓ tests/dashboard.test.js (6 tests) 2300ms
   ✓ AC-3: calcula conteos aislados de dueCount, dueHardSkills y dueSoftSkills con filtro ?level=...
 ✓ tests/softSkillPractice.test.js (6 tests) 1398ms
 ✓ tests/topics.test.js (8 tests) 1566ms
 ✓ tests/practice.test.js (6 tests) 1324ms
 ✓ tests/health.test.js (1 test) 1024ms
 ✓ tests/srsCalculator.test.js (11 tests) 14ms
 ✓ tests/hint.test.js (11 tests) 12494ms

 Test Files  8 passed (8)
      Tests  54 passed (54)
   Start at  01:49:55
   Duration  14.09s
```

### Tests E2E (Playwright)

```bash
> devcoach-sparring@1.0.0 test:e2e
> LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" playwright test

Running 14 tests using 2 workers

  ✓   1 [chromium] › tests/e2e/hard-skills.spec.js:4:3 › permite seleccionar un tema, generar un reto técnico, enviar solución y ver evaluación completa (1.8s)
  ✓   2 [chromium] › tests/e2e/dashboard.spec.js:4:3 › carga métricas del dashboard, renderiza áreas críticas y permite navegar con "Entrenar Ahora" (1.4s)
  ✓   3 [chromium] › tests/e2e/dashboard.spec.js:115:3 › permite navegar libremente entre pestañas Dashboard, Hard Skills y Soft Skills (1.5s)
  ✓   4 [chromium] › tests/e2e/multilevel-catalog.spec.js:4:3 › al hacer clic en "Junior" en Dashboard, los contadores cambian y reflejan el total del nivel (1.2s)
  ✓   5 [chromium] › tests/e2e/scaffolding.spec.js:17:3 › AC-5: Dashboard muestra selector de nivel (Junior/Mid/Senior/Todos) (715ms)
  ✓   6 [chromium] › tests/e2e/multilevel-catalog.spec.js:64:3 › Soft Skills sincroniza el filtro por nivel y carga los nuevos escenarios Junior (Daily, Demos, Feedback) (1.2s)
  ✓   7 [chromium] › tests/e2e/scaffolding.spec.js:32:3 › AC-5: Clic en nivel Junior recarga métricas del dashboard (843ms)
  ✓   8 [chromium] › tests/e2e/smoke.spec.js:4:3 › frontend loads properly and shows header (672ms)
  ✓   9 [chromium] › tests/e2e/scaffolding.spec.js:40:3 › AC-5: Clic en nivel Mid recarga métricas del dashboard (773ms)
  ✓  10 [chromium] › tests/e2e/soft-skills.spec.js:4:3 › permite cambiar a la pestaña de Soft Skills, iniciar sparring, negociar 3 turnos con fallback de texto y ver veredicto final (2.3s)
  ✓  11 [chromium] › tests/e2e/scaffolding.spec.js:47:3 › AC-5: Clic en nivel Senior recarga métricas del dashboard (1.2s)
  ✓  12 [chromium] › tests/e2e/scaffolding.spec.js:54:3 › AC-5: Hard Skills muestra selector de nivel (958ms)
  ✓  13 [chromium] › tests/e2e/scaffolding.spec.js:74:3 › AC-6: Botón "Dame una pista" existe en Hard Skills cuando hay desafío activo (776ms)
  ✓  14 [chromium] › tests/e2e/scaffolding.spec.js:91:3 › AC-3: Dashboard responde correctamente a nivel "Todos" (sin filtro) (2.0s)

  14 passed (12.9s)
```

## 5. Commit de Cierre en dev

`0a7b03f`

