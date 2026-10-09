# [US-04] Módulo Soft Skills: Sparring por Voz (Web Speech API + Gemini)

- **Estado:** Done
- **Rama:** `feature/US-04-soft-skills-voice`
- **Fecha de Inicio:** 2026-09-30
- **Fecha de Cierre:** 2026-09-30

## 1. Descripción

Implementar el módulo interactivo de Soft Skills y consultoría de arquitectura técnica mediante simulación de sparring de voz por turnos asistido por IA (`@google/genai` con `gemini-2.5-flash`). La IA asume roles de stakeholders escépticos (ej. Tech Lead crítico, PM orientado a costos, o Director con requerimientos agresivos), desafiando las propuestas técnicas del desarrollador a lo largo de 3 turnos conversacionales. Al finalizar la interacción, emite un veredicto estructurado evaluando claridad de negocio, defensa de trade-offs y asertividad, recalculando la progresión SRS (`srsCalculator`) y almacenando la sesión en MongoDB. La interfaz React incorpora síntesis de voz, reconocimiento de micrófono con fallback manual accesible y panel analítico de evaluación.

## 2. Criterios de Aceptación (AC)

- [x] AC-1: Servicio de sparring backend (`server/src/services/softSkillSparringService.js`) implementado con prompts especializados para roles de cliente y evaluador asertivo.
- [x] AC-2: Endpoints REST en `server/src/routes/softSkillPractice.js`:
  - `POST /api/practice/soft-skill/start`: Recibe `{ topicId }`, plantea escenario conflictivo y retorna rol del cliente y pregunta inicial.
  - `POST /api/practice/soft-skill/reply`: Recibe `{ topicId, conversationHistory, userAudioTranscript }`. Si es turno intermedio genera réplica escéptica; si es turno final genera veredicto `{ score, feedback, businessClarity, tradeOffDefense, assertivenessScore }`, actualiza el Topic con `srsCalculator` y persiste en `SessionLog`.
- [x] AC-3: Suite de pruebas backend (`server/tests/softSkillPractice.test.js`) con mocks de Gemini (`vi.mock`), validando flujo completo (start -> reply intermedia -> veredicto final con MongoDB).
- [x] AC-4: Hook Frontend `client/src/hooks/useVoiceInteraction.js` usando `window.SpeechRecognition`/`webkitSpeechRecognition` y `window.speechSynthesis` con gestión de estados y fallback de texto.
- [x] AC-5: Componente Frontend `client/src/components/SoftSkillTrainer.jsx` con selector de escenario, avatar/rol del cliente, botón de micrófono reactivo, historial de chat interactivo, panel de veredicto y pestañas de navegación en `client/src/App.jsx`.
- [x] AC-6: Prueba E2E en Playwright (`tests/e2e/soft-skills.spec.js`) ejecutando la interacción con fallback de texto y verificando veredicto en pantalla.
- [x] AC-7: Verificación completa de suite unitaria (`npm test` con 32 tests) y E2E (`npm run test:e2e` con 3 tests) en verde.
- [x] AC-8: Documentación de usuario (`docs/USER_GUIDE.md`) y arquitectura técnica (`docs/ARCHITECTURE.md`) actualizadas.

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `Topic`, `SessionLog`, `srsCalculator`, `softSkillPracticeRouter`, `softSkillSparringService`, `useVoiceInteraction`, `SoftSkillTrainer`, `App.jsx`, `softSkillPractice.test.js`, `soft-skills.spec.js`
- **Archivos intervenidos:**
  - `server/src/models/SessionLog.js`
  - `server/src/services/softSkillSparringService.js`
  - `server/src/routes/softSkillPractice.js`
  - `server/src/app.js`
  - `server/tests/softSkillPractice.test.js`
  - `client/src/hooks/useVoiceInteraction.js`
  - `client/src/components/SoftSkillTrainer.jsx`
  - `client/src/App.jsx`
  - `tests/e2e/soft-skills.spec.js`
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

 ✓ tests/practice.test.js (6 tests) 1555ms
 ✓ tests/softSkillPractice.test.js (6 tests) 1562ms
 ✓ tests/topics.test.js (8 tests) 1589ms   
 ✓ tests/srsCalculator.test.js (11 tests) 9ms
 ✓ tests/health.test.js (1 test) 766ms
                           
 Test Files  5 passed (5) 
      Tests  32 passed (32)
   Start at  21:44:38     
   Duration  4.58s (transform 257ms, setup 0ms, collect 3.44s, tests 5.48s, environment 2ms, prepare 602ms)
```

### Tests End-to-End Frontend (Playwright)

```bash
> devcoach-sparring@1.0.0 test:e2e
> LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" playwright test

Running 3 tests using 2 workers

  ✓  1 …ds properly and shows header (1.9s)
  ✓  2 …ón y ver evaluación completa (2.5s)
  ✓  3 … texto y ver veredicto final (1.7s)

  3 passed (8.4s)
```
