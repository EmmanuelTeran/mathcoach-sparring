# [US-06] Seed Senior (30 Temas Clave) y Suite E2E Final

- **Estado:** Done
- **Rama:** `feature/US-06-seed-and-e2e-final`
- **Fecha de Inicio:** 2026-09-30
- **Fecha de Cierre:** 2026-09-30

## 1. Descripción

Cerrar el MVP de DevCoach Sparring implementando el script de seeding idempotente con exactamente 30 temas de nivel Mid-to-Senior alineados con roadmap.sh/fullstack (15 Hard Skills y 15 Soft Skills sin HTML/CSS vanilla). 
Proveer pruebas unitarias e integración en `server/tests/seed.test.js` para asegurar idempotencia y validación de categorías.
Garantizar la ejecución y validación completa de la suite backend (`npm test`, 38+ tests) y de la suite E2E con Playwright (`npm run test:e2e`).
Completar la documentación final del proyecto en `docs/USER_GUIDE.md` y `docs/ARCHITECTURE.md`.

## 2. Criterios de Aceptación (AC)

- [x] AC-1: Script de seeding idempotente en `server/src/scripts/seed.js` y script raíz `npm run seed` con upsert / validación por `title`.
- [x] AC-2: Exactamente 30 temas de nivel Mid-to-Senior alineados con roadmap.sh:
  - 15 Hard Skills (`type: 'theory'`, `category: 'hard_skill'`): Event Loop, Memory & Streams, Fiber Reconciliation, State Management, Profiling, Índices Compuestos, Transacciones ANSI SQL, MongoDB Modeling, Protocolos de Red TLS/HTTP3, WebSockets vs SSE, Token Architecture, Rate Limiting, Cache Architecture, Idempotencia de APIs, Docker & Graceful Shutdown.
  - 15 Soft Skills (`type: 'practice'`, `category: 'soft_skill'`): Deuda Técnica, Microservicios vs Monolito, Fechas Imposibles, Testing Automatizado, Post-mortem / RCA, Migración Tecnológica, Requerimientos Ambiguos, Accesibilidad / Web Vitals, Scope Creep, Herramientas AI / Vibe Coding, Fallos de Seguridad, Desacuerdos de Arquitectura, Costos Cloud, Simplificación de Código, Demostración de Valor de Negocio.
- [x] AC-3: Suite de pruebas `server/tests/seed.test.js` con MongoMemoryServer verificando inserción de 30 temas, tipos/categorías correctas y comportamiento idempotente sin duplicados en re-ejecuciones.
- [x] AC-4: Ejecución de `npm test` verificando que toda la suite backend (38+ tests, obtenidos 41 tests) pase en verde sin errores.
- [x] AC-5: Ejecución de `npm run test:e2e` pasando al 100% todos los flujos de Playwright.
- [x] AC-6: Actualización de documentación:
  - `docs/USER_GUIDE.md`: Instrucciones de arranque rápido (`npm run seed`, `npm run dev`), protocolo diario de 20 minutos y uso de voz.
  - `docs/ARCHITECTURE.md`: Catálogo completo de endpoints, diagrama Mermaid de arquitectura y confirmación de cobertura.
- [x] AC-7: Merge `--no-ff` a `dev` y actualización de `.antigravity/heartbeat.md` marcando el backlog 100% completado.

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `Topic`, `seed.js`, `seed.test.js`, `package.json`, `USER_GUIDE.md`, `ARCHITECTURE.md`
- **Archivos intervenidos:**
  - `server/src/scripts/seed.js`
  - `server/package.json`
  - `package.json`
  - `server/tests/seed.test.js`
  - `docs/USER_GUIDE.md`
  - `docs/ARCHITECTURE.md`
  - `.antigravity/heartbeat.md`

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

 ✓ tests/softSkillPractice.test.js (6 tests) 1832ms
 ✓ tests/dashboard.test.js (5 tests) 1858ms
 ✓ tests/topics.test.js (8 tests) 1987ms
 ✓ tests/seed.test.js (4 tests) 1446ms
 ✓ tests/practice.test.js (6 tests) 1593ms
 ✓ tests/health.test.js (1 test) 1313ms
 ✓ tests/srsCalculator.test.js (11 tests) 9ms

 Test Files  7 passed (7)
      Tests  41 passed (41)
   Start at  23:42:12
   Duration  7.57s (transform 334ms, setup 0ms, collect 8.53s, tests 10.04s, environment 2ms, prepare 1.14s)
```

### Pruebas E2E (Playwright)

```bash
> devcoach-sparring@1.0.0 test:e2e
> LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" playwright test

Running 5 tests using 2 workers

  ✓  1 [chromium] › hard-skills.spec.js:14:3 › Módulo Hard Skills › debe cargar tema técnico, enviar solución y ver evaluación completa (3.0s)
  ✓  2 [chromium] › dashboard.spec.js:15:3 › Dashboard y Acoplamiento › visualiza métricas, áreas críticas y permite navegar con "Entrenar Ahora" (2.9s)
  ✓  3 [chromium] › dashboard.spec.js:63:3 › Dashboard y Acoplamiento › permite navegación directa entre pestañas Dashboard, Hard Skills y Soft Skills (1.5s)
  ✓  4 [chromium] › smoke.spec.js:3:3 › Health › frontend loads properly and shows header (896ms)
  ✓  5 [chromium] › soft-skills.spec.js:14:3 › Módulo Soft Skills (Voz y Consultoría) › simula sparring de 3 turnos con fallback de texto y ver veredicto final (1.7s)

  5 passed (10.3s)
```
