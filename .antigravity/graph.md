# Grafo de Implementación: DevCoach Sparring

## Grafo de Dependencias

[US-01: Scaffolding, Playwright & Mongo]
└──> [US-02: Schemas Mongo & Motor SRS]
├──> [US-03: Módulo Hard Skills (Roadmap Active Recall)]
│ └──> [US-05: Dashboard & Cola Diaria de Práctica]
└──> [US-04: Módulo Soft Skills (Defensa por Voz con Gemini)]
└──> [US-05: Dashboard & Cola Diaria de Práctica]
└──> [US-06: Seed de 30 Desafíos & E2E Final]
└──> [US-07: Niveles de Progresión y Andamiaje Pedagógico]
└──> [US-08: Catálogo Completo Multinivel (Junior/Mid/Senior) y Sincronización UI]
└──> [US-09: Prompts de IA Estratificados por Nivel y UI Badges Dinámicos]
└──> [US-10: Coding Playground Interactivo (Monaco + Sandbox Runner + Test Cases)]

---

### [US-01] Scaffolding, Base Monorepo y Harness de Tests (Vitest + Playwright)

- **Dependencias:** Ninguna
- **Criterios de Aceptación (AC):**
  1. Monorepo configurado con `/client` (Vite, React, Tailwind) y `/server` (Express, Mongoose).
  2. Playwright configurado en `/tests/e2e/smoke.spec.js` validando que la app carga en puerto 5173.
  3. Vitest y Supertest configurados en el server con prueba de salud `/api/health` conectada a MongoDB.
  4. Script raíz `npm test` corre unit tests y `npm run test:e2e` corre Playwright.

### [US-02] Schemas Mongoose y Motor Algorítmico SRS (SM-2 Adaptado)

- **Dependencias:** US-01
- **Criterios de Aceptación (AC):**
  1. Schemas: `Topic` (id, title, category, type: 'theory'|'practice', srsStage, easeFactor, intervalDays, nextReviewAt) y `SessionLog` (topicId, score, feedback, userResponse).
  2. Utilidad pura `srsCalculator.js` con tests unitarios al 100% de cobertura.
  3. Endpoints REST: `GET /api/topics/due` (obtiene cola de repaso) y `POST /api/topics/review` (registra score 1-5 y reprograma fecha).

### [US-03] Módulo Hard Skills: Active Recall Teórico y Práctico

- **Dependencias:** US-02
- **Criterios de Aceptación (AC):**
  1. Integración con SDK Gemini (`@google/genai`) para generar preguntas de active recall basadas en los temas de roadmap.sh/fullstack.
  2. UI en React con selector de tema, visor de problema/pregunta, editor para redactar justificación o código React, y botón "Evaluar".
  3. Evaluación por IA: análisis de profundidad técnica, trade-offs explicados, score (1-5) y retroalimentación directa sin condescendencia.

### [US-04] Módulo Soft Skills: Sparring por Voz (Web Speech API + Gemini)

- **Dependencias:** US-02
- **Criterios de Aceptación (AC):**
  1. Hook `useVoiceInteraction` en React usando Web Speech API nativa para grabar voz del usuario y sintetizar la réplica del cliente/tech lead.
  2. Backend: Endpoint con prompt especializado que asume el rol de cliente no técnico o PM exigente que refuta las decisiones técnicas.
  3. Intercambio de 3 turnos conversacionales con veredicto final: evalúa si defendiste con argumentos de negocio, asertividad y trade-offs.

### [US-05] Dashboard Operativo y Acoplamiento de Habilidades

- **Dependencias:** US-03, US-04
- **Criterios de Aceptación (AC):**
  1. Dashboard principal simple: número de repasos pendientes para hoy y lista de temas críticos (score < 3).
  2. Botón "Entrenar Ahora" que prioriza el tema técnico más urgente y sugiere el escenario de voz asociado si ya se alcanzó nivel suficiente en la teoría.
  3. Test E2E en Playwright que simula completar una tarjeta de práctica y comprueba que desaparezca de la cola de hoy.

### [US-06] Seed Senior del Roadmap y Validación E2E Total

- **Dependencias:** US-05
- **Criterios de Aceptación (AC):**
  1. Script `npm run seed` con al menos 25 tópicos del roadmap.sh listos para entrenar (teóricos y prácticos en React/Node/Mongo).
  2. Suite completa de Playwright corriendo en verde sin advertencias.
  3. Ejecución de `document-user-guide` y `document-tech-specs` dejando el repo listo para uso diario.

---

### [US-07] Niveles de Progresión y Andamiaje Pedagógico (Scaffolding)

- **Dependencias:** US-06
- **Criterios de Aceptación (AC):**
  1. Modelo `server/src/models/Topic.js` actualizado con el campo `level`: enum `['junior', 'mid', 'senior']`, default `'junior'`.
  2. Endpoint backend `POST /api/practice/hard-skill/hint`: recibe `{ topicId, challenge }`, consulta a Gemini con rol pedagógico y retorna `{ analogy: String, guidingQuestions: [String] }` sin revelar código ni respuestas directas.
  3. Endpoint `GET /api/dashboard/summary` con soporte para filtro `?level=junior|mid|senior`, priorizando recomendaciones del nivel seleccionado.
  4. Script `npm run seed` actualizado: distribuye temas en 3 niveles (Junior: bases JS, async/await, CRUD Express; Mid: custom hooks, JWT, relaciones Mongo; Senior: libuv/event loop, concurrencia, índices compuestos, trade-offs).
  5. Frontend: selector visual de nivel (Junior / Mid / Senior) en Dashboard y Hard Skills.
  6. Frontend: botón interactivo **"💡 Dame una pista / Modelo Mental"** en `HardSkillTrainer.jsx` que despliega la analogía y preguntas guía.
  7. Suite de tests: prueba unitaria con mock para hints (`server/tests/hint.test.js`) y prueba E2E en Playwright (`tests/e2e/scaffolding.spec.js`) pasando 100% en verde.

---

### [US-08] Catálogo Completo Multinivel (Junior/Mid/Senior) y Sincronización UI

- **Dependencias:** US-07
- **Criterios de Aceptación (AC):**
  1. **Script de Seeding Robusto (`server/src/scripts/seed.js`):**
     - Actualizar los 30 temas originales de US-06 asegurando `level: 'senior'`.
     - Añadir **10 Hard Skills Junior:** Métodos de arrays (map/filter/reduce), Async/Await vs Callbacks, CRUD básico en Express, Códigos de estado HTTP, Scopes y closures, useState inmutabilidad, useEffect dependencias y cleanup, Validación de inputs con schemas simples, Queries básicas en Mongo (filtros, proyecciones), Renderizado condicional en React.
     - Añadir **10 Soft Skills Junior (Interacciones Críticas):**
       - _Daily Standup:_ Estructura "qué hice, qué haré, qué me bloquea" con impacto concreto.
       - _Pedir Ayuda:_ Cómo formular dudas a un Senior demostrando hipótesis previas.
       - _Demo de Ticket a PM:_ Explicar qué aporta tu PR al producto sin jerga innecesaria.
       - _Code Review:_ Argumentar técnicamente sin tomar el feedback como ataque personal.
       - _Aclaración de Requerimientos:_ Preguntar criterios de aceptación antes de asumir y picar código.
       - _Estimación de Tareas Pequeñas:_ Desglosar subtareas y justificar tiempos ante el equipo.
       - _Manejo de Errores en Staging:_ Reportar un bug propio con transparencia y solución propuesta.
       - _Entrega con Documentación:_ Explicar a QA cómo probar los edge cases de tu desarrollo.
       - _Priorización de Interrupciones:_ Qué responder cuando alguien pide algo urgente a mitad de un sprint.
       - _Alineación con el Diseño:_ Comunicar a UI/UX limitaciones técnicas de forma asertiva.
     - Añadir **6 Hard Skills y 6 Soft Skills Mid:** Manejo de Custom Hooks, Context API vs Zustand, Índices simples en Mongo, Arquitectura en capas, Negociación de deuda técnica en sprint, Refactorización sin romper contratos.
     - Usar `Topic.bulkWrite` con `upsert: true` para que sobreescriba y actualice el campo `level` de los documentos ya existentes en MongoDB.
  2. **Sincronización en Frontend (`SoftSkillTrainer.jsx` y `HardSkillTrainer.jsx`):**
     - Ambos componentes deben reflejar el filtro de nivel activo (Junior / Mid / Senior) para que la lista de temas cargue solo los del nivel seleccionado.
     - Si se selecciona "Junior", el combo de Soft Skills debe mostrar los nuevos escenarios de Daily, Demos y Feedback.
  3. **Backend (`dashboardController.js`):**
     - Al filtrar `?level=junior`, los conteos de `dueCount`, `dueHardSkills` y `dueSoftSkills` deben calcularse únicamente sobre los temas de ese nivel.
  4. **Suite de Tests:**
     - Actualizar `server/tests/seed.test.js` y tests de dashboard comprobando que cada nivel tenga al menos 10 tópicos y responda métricas aisladas.
     - Playwright E2E verificando que al hacer clic en "Junior", los contadores cambien de 0 al total sembrado y carguen los escenarios de junior.

---

### [US-09] Estratificación Integral por Niveles (Hard Skills, Soft Skills y Sparring de Voz)

- **Dependencias:** US-08
- **Criterios de Aceptación (AC):**
  1. **Estratificación de Hard Skills (`server/src/services/geminiService.js`):**
     - Retos y evaluaciones adaptados al `topic.level`:
       - **Junior:** Sintaxis, inmutabilidad, depuración de errores comunes, lógica cotidiana y código funcional sin hablar de bajo nivel ni internals de V8.
       - **Mid:** Patrones, modularización, clean code y manejo de asincronía.
       - **Senior:** Arquitectura, concurrencia masiva, trade-offs y resiliencia.
  2. **Estratificación de Soft Skills y Sparring (`server/src/services/softSkillSparringService.js`):**
     - Roles y tono de los interlocutores adaptados al `topic.level`:
       - **Junior:** Interlocutor = Compañero Senior o PM accesible. Escenarios: reportar avances en Daily, explicar dudas en un ticket, recibir feedback en PR. Tono constructivo pero que exige orden y claridad.
       - **Mid:** Interlocutor = PM con fechas ajustadas o Tech Lead pragmático. Escenarios: negociar alcance, justificar refactorización.
       - **Senior:** Interlocutor = CTO escéptico o Cliente corporativo. Escenarios: incidentes de producción, costos cloud, arquitectura.
     - Criterios de evaluación adaptados: en nivel Junior evalúa estructuración (qué, por qué, qué sigue), capacidad de síntesis y actitud proactiva; no exige métricas financieras ni impacto de negocio avanzado.
  3. **Sincronización en Frontend (`HardSkillTrainer.jsx` y `SoftSkillTrainer.jsx`):**
     - Badges dinámicos de nivel en ambas interfaces (`NIVEL JUNIOR`, `NIVEL MID`, `NIVEL SENIOR`).
     - En Soft Skills, mostrar claramente el rol del interlocutor según el nivel (ej. "Rol: Tu compañero Senior en una sesión de 1:1" vs "Rol: CTO de la empresa").
  4. **Suite de Pruebas:**
     - Tests en `server/tests/softSkillPractice.test.js` y `server/tests/practice.test.js` validando que los prompts generados para Junior en ambos servicios no contengan exigencias de Senior.
     - Pruebas E2E de Playwright verificando la carga correcta de escenarios y badges en ambos módulos.

---

### [US-10] Coding Playground Interactivo (Monaco + Sandbox Runner + Test Cases)

- **Dependencias:** US-09
- **Criterios de Aceptación (AC):**
  1. **Dependencia Frontend:** Instalar `@monaco-editor/react` en `/client`.
  2. **Subdocumento en Modelo `Topic` (`server/src/models/Topic.js`):**
     - Añadir campo opcional `codingChallenge`:
       - `starterCode`: String (código inicial con firma de función y comentarios).
       - `testCases`: Array de `{ input: Array, expected: Any, isHidden: Boolean }`.
       - `constraints`: Array de Strings (ej. "Tiempo O(n)", "No usar métodos nativos sort").
  3. **Motor de Ejecución en Navegador (`client/src/utils/codeRunner.js`):**
     - Ejecutar el código JavaScript en un entorno aislado (Web Worker o Function sandboxed).
     - Capturar la salida estándar (`console.log`) y medir tiempo de ejecución en milisegundos.
     - Comparar resultados contra `testCases` y reportar status (`PASSED` o `FAILED` con detalle de entrada, valor esperado y valor obtenido).
  4. **Componente `CodingPlayground.jsx` (Diseño Split-Screen):**
     - Panel izquierdo: Título, nivel, descripción del problema, restricciones y botón opcional de audio.
     - Panel derecho superior: Editor Monaco con tema oscuro, sintaxis JS, botón "Run Code" y botón "Submit & Evaluate".
     - Panel derecho inferior: Consola interactiva con pestañas para "Resultados de Tests" y "Logs de Consola".
  5. **Endpoint de Evaluación Senior (`POST /api/practice/coding/evaluate`):**
     - Recibe `{ topicId, code, testResults }`.
     - Si los tests pasaron, Gemini audita la solución evaluando legibilidad, nombres descriptivos y complejidad temporal/espacial Big-O.
     - Emite un puntaje (1-5), feedback técnico y reprograma el repaso en el motor SRS.
  6. **Seeding de Retos Prácticos (`server/src/scripts/seed.js`):**
     - Poblar al menos 6 retos prácticos de código funcionales (2 Junior, 2 Mid, 2 Senior) con sus respectivos `testCases`.
  7. **Tests Automatizados:**
     - Test unitario de `codeRunner.js` validando captura de errores de sintaxis y ejecución de tests.
     - Prueba E2E en Playwright (`tests/e2e/coding-playground.spec.js`) ejecutando un código válido y verificando que la consola marque los tests en verde.
