# [US-09] Prompts de IA Estratificados por Nivel y UI Badges Dinámicos

- **Estado:** Done
- **Rama:** `feature/US-09-stratified-prompts-and-dynamic-badges`
- **Fecha de Inicio:** 2026-10-02
- **Fecha de Cierre:** 2026-10-02

## 1. Descripción

Estratificar integralmente los prompts y la evaluación por IA para los 3 niveles de progresión (Junior, Mid, Senior) tanto en el módulo de Hard Skills como en el de Soft Skills. Es indispensable que los escenarios de voz no exijan habilidades de liderazgo Senior ni métricas de ROI complejas cuando el usuario está entrenando en nivel Junior, sino que simulen interacciones cotidianas de equipo (Dailies, Code Reviews, cómo pedir ayuda a un senior, clarificación de tickets) con roles accesibles y constructivos. En Hard Skills, los retos y evaluaciones de Junior deben enfocarse en sintaxis, inmutabilidad, depuración de errores comunes y bases cotidianas. En la interfaz gráfica (`HardSkillTrainer.jsx` y `SoftSkillTrainer.jsx`), se incorporan badges dinámicos de nivel y la descripción explícita del rol del interlocutor en los ejercicios de sparring por voz.

## 2. Criterios de Aceptación (AC)

- [x] AC-1: **Estratificación de Hard Skills (`server/src/services/geminiService.js`):**
  - Retos y evaluaciones adaptados al `topic.level`:
    - **Junior:** Sintaxis, inmutabilidad, depuración de errores comunes, lógica cotidiana y código funcional sin hablar de bajo nivel ni internals de V8.
    - **Mid:** Patrones, modularización, clean code y manejo de asincronía.
    - **Senior:** Arquitectura, concurrencia masiva, trade-offs y resiliencia.
  - El evaluador técnico no penaliza falta de análisis de arquitectura interna ni trade-offs de alta concurrencia en nivel Junior, evaluando corrección conceptual, sintáctica y buenas prácticas básicas.
- [x] AC-2: **Estratificación de Soft Skills y Sparring (`server/src/services/softSkillSparringService.js`):**
  - Roles y tono de los interlocutores adaptados al `topic.level`:
    - **Junior:** Interlocutor = Compañero Senior o PM accesible. Escenarios: reportar avances en Daily, explicar dudas en un ticket, recibir feedback en PR. Tono constructivo pero que exige orden y claridad.
    - **Mid:** Interlocutor = PM con fechas ajustadas o Tech Lead pragmático. Escenarios: negociar alcance, justificar refactorización.
    - **Senior:** Interlocutor = CTO escéptico o Cliente corporativo. Escenarios: incidentes de producción, costos cloud, arquitectura.
  - Criterios de evaluación adaptados: en nivel Junior evalúa estructuración (qué, por qué, qué sigue), capacidad de síntesis y actitud proactiva; no exige métricas financieras ni impacto de negocio avanzado.
- [x] AC-3: **Sincronización en Frontend (`HardSkillTrainer.jsx` y `SoftSkillTrainer.jsx`):**
  - Badges dinámicos de nivel en ambas interfaces (`NIVEL JUNIOR`, `NIVEL MID`, `NIVEL SENIOR`) con colores contextuales según el nivel del tópico seleccionado/activo.
  - En Soft Skills, mostrar claramente el rol y descripción del interlocutor según el nivel (ej. "Rol: Tu compañero Senior en una sesión de 1:1" vs "Rol: CTO de la empresa").
  - En Hard Skills, adaptar los badges de reto y score para no mostrar "Senior" indebidamente en perfiles Junior/Mid.
- [x] AC-4: **Suite de Pruebas y Validación:**
  - Tests en `server/tests/softSkillPractice.test.js` y `server/tests/practice.test.js` validando que los prompts generados para Junior en ambos servicios no contengan exigencias de Senior.
  - Pruebas E2E de Playwright verificando la carga correcta de escenarios, roles y badges dinámicos en ambos módulos (`tests/e2e/stratified-prompts.spec.js`).

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `generateHardSkillChallenge()`, `evaluateHardSkillSolution()`, `startSoftSkillSparring()`, `replySoftSkillSparring()`, `SPARRING_ROLES`, `SPARRING_ROLES_BY_LEVEL`, `HardSkillTrainer()`, `SoftSkillTrainer()`
- **Archivos intervenidos:**
  - `server/src/services/geminiService.js` — Estratificación de generación de retos técnicos y evaluación por niveles Junior, Mid y Senior
  - `server/src/services/softSkillSparringService.js` — Estratificación de arquetipos de roles (`SPARRING_ROLES_BY_LEVEL`), tonos y veredictos en 3 dimensiones adaptadas
  - `server/src/routes/practice.js` — Propagación del campo `level` en generación de retos
  - `server/src/routes/softSkillPractice.js` — Propagación de `level` y `roleDescription` en start y reply
  - `client/src/components/HardSkillTrainer.jsx` — Dynamic level badge `#dynamic-level-badge-hard-skills`, `#challenge-level-badge`, `#challenge-type-badge` y score badge estratificado
  - `client/src/components/SoftSkillTrainer.jsx` — Dynamic level badge `#dynamic-level-badge-soft-skills`, `#client-role-level-badge`, `#client-role-description` y score badge estratificado
  - `server/tests/practice.test.js` — Tests unitarios e integración validando prompts y evaluaciones adaptadas sin exigencias de senior en perfiles junior
  - `server/tests/softSkillPractice.test.js` — Tests unitarios e integración validando roles cercanos (peer/PM) y evaluaciones de comunicación adaptadas
  - `tests/e2e/stratified-prompts.spec.js` — Suite E2E de Playwright comprobando interacción completa y badges dinámicos en frontend

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
> devcoach-sparring@1.0.0 test
> npm run test:server

> server@1.0.0 test
> vitest run

 RUN  v3.2.7 /home/teran/proyectos/devcoach-sparring/server

 ✓ tests/seed.test.js (5 tests) 1858ms
 ✓ tests/softSkillPractice.test.js (8 tests) 1791ms
 ✓ tests/practice.test.js (9 tests) 1445ms
 ✓ tests/dashboard.test.js (6 tests) 1474ms
 ✓ tests/topics.test.js (8 tests) 2002ms
 ✓ tests/health.test.js (1 test) 1807ms
 ✓ tests/srsCalculator.test.js (11 tests) 18ms
 ✓ tests/hint.test.js (11 tests) 14005ms

 Test Files  8 passed (8)
      Tests  59 passed (59)
   Start at  20:50:22
   Duration  16.07s
```

### Tests E2E (Playwright)

```bash
> devcoach-sparring@1.0.0 test:e2e
> LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" playwright test

Running 16 tests using 2 workers

  ✓   1 [chromium] › tests/e2e/dashboard.spec.js:4:3 › carga métricas del dashboard, renderiza áreas críticas y permite navegar con "Entrenar Ahora" (1.9s)
  ✓   2 [chromium] › tests/e2e/hard-skills.spec.js:4:3 › permite seleccionar un tema, generar un reto técnico, enviar solución y ver evaluación completa (2.2s)
  ✓   3 [chromium] › tests/e2e/dashboard.spec.js:115:3 › permite navegar libremente entre pestañas Dashboard, Hard Skills y Soft Skills (2.0s)
  ✓   4 [chromium] › tests/e2e/multilevel-catalog.spec.js:4:3 › al hacer clic en "Junior" en Dashboard, los contadores cambian y reflejan el total del nivel (1.2s)
  ✓   5 [chromium] › tests/e2e/multilevel-catalog.spec.js:64:3 › Soft Skills sincroniza el filtro por nivel y carga los nuevos escenarios Junior (Daily, Demos, Feedback) (1.4s)
  ✓   6 [chromium] › tests/e2e/scaffolding.spec.js:17:3 › AC-5: Dashboard muestra selector de nivel (Junior/Mid/Senior/Todos) (819ms)
  ✓   7 [chromium] › tests/e2e/scaffolding.spec.js:32:3 › AC-5: Clic en nivel Junior recarga métricas del dashboard (898ms)
  ✓   8 [chromium] › tests/e2e/smoke.spec.js:4:3 › frontend loads properly and shows header (615ms)
  ✓   9 [chromium] › tests/e2e/soft-skills.spec.js:4:3 › permite cambiar a la pestaña de Soft Skills, iniciar sparring, negociar 3 turnos con fallback de texto y ver veredicto final (2.2s)
  ✓  10 [chromium] › tests/e2e/scaffolding.spec.js:40:3 › AC-5: Clic en nivel Mid recarga métricas del dashboard (1.0s)
  ✓  11 [chromium] › tests/e2e/scaffolding.spec.js:47:3 › AC-5: Clic en nivel Senior recarga métricas del dashboard (961ms)
  ✓  12 [chromium] › tests/e2e/scaffolding.spec.js:54:3 › AC-5: Hard Skills muestra selector de nivel (925ms)
  ✓  13 [chromium] › tests/e2e/stratified-prompts.spec.js:4:3 › Hard Skills muestra badges dinámicos según el nivel y estratifica el reto técnico (2.0s)
  ✓  14 [chromium] › tests/e2e/scaffolding.spec.js:74:3 › AC-6: Botón "Dame una pista" existe en Hard Skills cuando hay desafío activo (1.0s)
  ✓  15 [chromium] › tests/e2e/stratified-prompts.spec.js:116:3 › Soft Skills muestra badges dinámicos y descripción explícita del rol según el nivel (1.7s)
  ✓  16 [chromium] › tests/e2e/scaffolding.spec.js:91:3 › AC-3: Dashboard responde correctamente a nivel "Todos" (sin filtro) (2.0s)

  16 passed (13.7s)
```

## 5. Commit de Cierre en dev

`02e7d5a (feat/docs/chore merged to dev)`
