# Graph Report - mathcoach-sparring  (2026-10-10)

## Corpus Check
- 87 files · ~88,531 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .example 1)

## Summary
- 639 nodes · 944 edges · 36 communities (28 shown, 8 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `199eded9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 4. Historias Pendientes
- [US-XX] {{TITULO_HISTORIA}}
- Contexto del Proyecto: MathCoach Sparring - Entrenador Personal de Matemáticas Universitarias
- Skill: document-tech-specs
- Skill: document-user-guide
- Skill: implement-story
- Skill: new-user-story
- Skill: verify-user-story
- rules/graphify.md
- workflows/graphify.md
- heartbeat.md
- [MATH-US-14] Dashboard por Tema y Categoría
- seed.js
- scripts
- Guía de Usuario: MathCoach Sparring
- 2. Criterios de Aceptación (AC)
- 1. Descripción y Objetivos de Negocio
- dependencies
- 2. Criterios de Aceptación (AC)
- Arquitectura Técnica del Sistema: MathCoach Sparring
- client/package.json
- RoundSession
- 1. Descripción y Objetivos de Negocio
- 2. Criterios de Aceptación (AC)
- 1. Descripción y Objetivos de Negocio
- computeRoundOutcome
- 1. Descripción y Objetivos de Negocio
- 2. Criterios de Aceptación (AC)
- 1. Descripción y Objetivos de Negocio
- progressionEngine.js
- scripts

## God Nodes (most connected - your core abstractions)
1. `RoundSession()` - 22 edges
2. `react` - 15 edges
3. `ensureTracksForTopic()` - 15 edges
4. `mongoose` - 14 edges
5. `computeRoundOutcome()` - 14 edges
6. `TopicTrack` - 12 edges
7. `Arquitectura Técnica del Sistema: MathCoach Sparring` - 12 edges
8. `Dashboard()` - 11 edges
9. `MathStatement()` - 11 edges
10. `MathVisionUploader()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `[MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes` --references--> `MathVisionUploader()`  [INFERRED]
  .antigravity/graph.md → client/src/components/MathVisionUploader.jsx
- `9. Deprecación y Purga Definitiva de Endpoints Legados` --references--> `MathVisionUploader()`  [INFERRED]
  docs/ARCHITECTURE.md → client/src/components/MathVisionUploader.jsx
- `AC-1: Montaje Único de `MathVisionUploader` y Test de Instancia Única` --references--> `MathVisionUploader()`  [INFERRED]
  tickets/MATH-US-07-hotfix-ui.md → client/src/components/MathVisionUploader.jsx
- `Contexto y Defectos Detectados` --references--> `MathVisionUploader()`  [INFERRED]
  tickets/MATH-US-07-hotfix-ui.md → client/src/components/MathVisionUploader.jsx
- `Identificadores de Soporte Adicionales:` --references--> `RoundResults()`  [INFERRED]
  tickets/MATH-US-13-round-session-ui.md → client/src/components/RoundResults.jsx

## Import Cycles
- None detected.

## Communities (36 total, 8 thin omitted)

### Community 0 - "4. Historias Pendientes"
Cohesion: 0.08
Nodes (24): 0. Glosario y Modelo Mental del Producto, 1.1 Composición de rondas (`ROUND_BUDGET_MIN = 15`), 1.2 Score de ronda y progresión adaptativa, 1.3 Acoplamiento con Spaced Repetition (SM-2 por pista), 1. Reglas de Negocio Globales (aplican a varias historias), 2.1 Orden de ejecución recomendado, 2. Grafo de Dependencias, 3. Historias Completadas (referencia) (+16 more)

### Community 1 - "[US-XX] {{TITULO_HISTORIA}}"
Cohesion: 0.22
Nodes (8): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, Tests E2E (Playwright), Tests Unitarios e Integración (Vitest / Supertest), [US-XX] {{TITULO_HISTORIA}}

### Community 2 - "Contexto del Proyecto: MathCoach Sparring - Entrenador Personal de Matemáticas Universitarias"
Cohesion: 0.29
Nodes (6): 1. Stack Tecnológico Estricto, 2. Política de Tokens y Graphify en Modo Estricto (PreToolUse), 3. Principios de Código (mattpocock/skills), 4. Gestión de Tareas y Git, 5. Política de Modelos (Orquestación Asimétrica), Contexto del Proyecto: MathCoach Sparring - Entrenador Personal de Matemáticas Universitarias

### Community 3 - "Skill: document-tech-specs"
Cohesion: 0.50
Nodes (3): Pasos de Ejecución, Propósito, Skill: document-tech-specs

### Community 4 - "Skill: document-user-guide"
Cohesion: 0.50
Nodes (3): Pasos de Ejecución, Propósito, Skill: document-user-guide

### Community 5 - "Skill: implement-story"
Cohesion: 0.50
Nodes (3): Pasos de Ejecución, Propósito, Skill: implement-story

### Community 6 - "Skill: new-user-story"
Cohesion: 0.50
Nodes (3): Pasos de Ejecución, Propósito, Skill: new-user-story

### Community 7 - "Skill: verify-user-story"
Cohesion: 0.50
Nodes (3): Pasos de Ejecución, Propósito, Skill: verify-user-story

### Community 11 - "[MATH-US-14] Dashboard por Tema y Categoría"
Cohesion: 0.10
Nodes (19): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2.1 Contrato Formal HTTP: `GET /api/dashboard/summary`, 1.2.2 Lógica de Agregación y Cómputo en el Servidor:, 1.2 Reescritura Completa del Backend (`server/src/controllers/dashboardController.js` y `server/src/routes/dashboard.js`), 1.3 Rediseño Integral de la Interfaz (`client/src/components/Dashboard.jsx`), 1.4 Purga Estricta de Textos y Copys Legados de DevCoach, 1.5 Contrato Estricto de Identificadores Estables para E2E e Interacción, 1. Descripción y Objetivos de Negocio (+11 more)

### Community 12 - "seed.js"
Cohesion: 0.08
Nodes (43): cors, dotenv, express, mongodb-memory-server, mongoose, supertest, devDependencies, mongodb-memory-server (+35 more)

### Community 13 - "scripts"
Cohesion: 0.07
Nodes (22): description, devDependencies, concurrently, @playwright/test, name, private, scripts, dev (+14 more)

### Community 14 - "Guía de Usuario: MathCoach Sparring"
Cohesion: 0.07
Nodes (29): 1.1 Glosario de Entidades Clave, 1. Modelo Mental y Glosario del Producto, 2.1 Categorías Pedagógicas, 2.2 Estructura de las Sesiones de Práctica: El Bloque de ~15 Minutos de Tiempo Experto, 2.3 Cuotas de Ejercicios por Categoría, 2.4 Rotación Inteligente de Problemas, 2.5 Cola Inteligente de Repasos Diarios (`/api/rounds/queue`), 2. Las 3 Categorías y el Sistema Adaptativo de Rondas (+21 more)

### Community 15 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (15): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Inicialización y Gestión Defensiva de Permisos WebRTC, AC-2: Estado "Capturar Ejercicio" (Stream en Vivo y Guías de Encuadre), AC-3: Congelado de Fotograma, Canvas y Conversión Base64, AC-4: Estado "Analizando con IA..." (Feedback Inmersivo) (+7 more)

### Community 16 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.07
Nodes (26): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Reglas de Negocio de Composición de Rondas (`ROUND_BUDGET_MIN = 15`) (§1.1 de `graph.md`), 1.3 Algoritmo Estricto de Selección, Priorización y Ordenamiento, 1.4 Mutación de Estado y Snapshot Inmutable en `Round`, 1.5 Contratos Formales de la API HTTP (`server/src/routes/rounds.js`), 1.6 Manejo Defensivo de Errores y Validaciones, 1. Descripción y Objetivos de Negocio, 1. `GET /api/rounds/queue` — Cola de Pistas Vencidas para Repaso (+18 more)

### Community 17 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, cors, dotenv, express, @google/genai, mongoose

### Community 18 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.13
Nodes (14): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Endpoint `POST /api/evaluate-math` y Validación Defensiva de Entrada, AC-2: Inferencia Multimodal con Gemini 1.5 Pro y Prompts Estratificados por Nivel, AC-3: Salida JSON Estricta Forzada con `responseMimeType` (+6 more)

### Community 19 - "Arquitectura Técnica del Sistema: MathCoach Sparring"
Cohesion: 0.05
Nodes (36): 11.1 Mocking Determinista de Gemini 1.5 Pro, 11.2 Cobertura de Flujos E2E Críticos, 11. Estrategia de Pruebas Automatizadas y Validación E2E, 1. Topología del Monorepo, 2.1 Esquema `MathTopic` (`server/src/models/MathTopic.js`), 2.2 Esquema `Exercise` (`server/src/models/Exercise.js`), 2.3 Esquema `TopicTrack` (`server/src/models/TopicTrack.js`), 2.4 Esquema `Round` (`server/src/models/Round.js`) (+28 more)

### Community 22 - "client/package.json"
Cohesion: 0.05
Nodes (40): dependencies, katex, lucide-react, react, react-dom, react-markdown, rehype-katex, remark-math (+32 more)

### Community 23 - "RoundSession"
Cohesion: 0.06
Nodes (54): App(), DEFAULT_TOPIC, Dashboard(), DifficultySegments(), formatDueDate(), ScoreBadge(), MathStatement(), MathVisionUploader() (+46 more)

### Community 26 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.07
Nodes (29): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md)), 1.3 Arquitectura del Seed Modular y Scripts npm, 1.4 Lógica de Idempotencia Estricta y Servicio `ensureTracksForTopic`, 1.5 Especificación del Catálogo Curado (Temas, Categorías y Dificultades), 1.6 Cuotas de Volumen y Presupuesto de Rondas (§1.1), 1.7 Calidad Pedagógica y Rigor de Datos, 1. Descripción y Objetivos de Negocio (+21 more)

### Community 27 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.06
Nodes (31): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de `graph.md`), 1.3 Esquemas de Base de Datos Mongoose Exactos, 1.4 Mapeo de Categorías y Servicio Idempotente `ensureTracksForTopic`, 1.5 Contratos API, 1. Descripción y Objetivos de Negocio, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify) (+23 more)

### Community 28 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.08
Nodes (23): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Configuración Centralizada de Constantes (`server/src/config/progression.js`), 1.3 Contrato Funcional Estricto de `progressionEngine.js`, 1.4 Lógica de Progresión y Adaptabilidad (§1.2 de `graph.md`), 1.5 Acoplamiento Exacto con SM-2 por Pista (§1.3 de `graph.md`), 1.6 Mantenimiento y Saneamiento de `srsCalculator.js`, 1. Descripción y Objetivos de Negocio, 2. Criterios de Aceptación (AC) (+15 more)

### Community 29 - "computeRoundOutcome"
Cohesion: 0.06
Nodes (39): [MATH-US-12] Evaluación Multimodal de Rondas + Progresión, @google/genai, buildSystemInstruction(), evaluateRoundSolutions(), getClient(), computeRoundOutcome(), 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Reglas de Negocio de Progresión y SRS (§1.2 y §1.3 de `graph.md`) (+31 more)

### Community 30 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.29
Nodes (7): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Arquitectura de Componentes y Descomposición Modular, 1.3 Ciclo de Vida y Máquina de Estados de la Sesión, 1.4 Contrato Estricto de Identificadores Estables para E2E, 1. Descripción y Objetivos de Negocio, Fases Detalladas:, Identificadores de Soporte Adicionales:

### Community 31 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (16): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Montaje Único de `MathVisionUploader` y Test de Instancia Única, AC-2: Componente `MathStatement.jsx` con Markdown + LaTeX (KaTeX), AC-3: Estado Vacío cuando no hay Ejercicio Cargado, AC-4: Eliminación Total de "Coding Playground" y Navegación Simplificada (+8 more)

### Community 33 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.10
Nodes (19): 1.1 Contexto Arquitectónico y Cierre del Roadmap, 1.2.1 Topología y Orquestación de Servidores, 1.2.2 Estrategia de Mocking Determinista para Gemini 1.5 Pro, 1.2 Configuración de la Suite E2E con Playwright (`tests/e2e/`), 1.3 Cobertura de los 4 Flujos de Usuario Críticos, 1.4 Purga y Actualización de Tests E2E Legados, 1.5 Scripts y Automatización (`package.json`), 1.6 Sincronización y Cierre Documental (+11 more)

### Community 34 - "progressionEngine.js"
Cohesion: 0.30
Nodes (10): CATEGORY_LIMITS, EXERCISE_PASS_SCORE, MAX_DIFFICULTY, MIN_DIFFICULTY, PROMOTION_INTERVAL_DAYS, PROMOTION_MIN_PASS_RATE, PROMOTION_MIN_SCORE, ROUND_BUDGET_MIN (+2 more)

### Community 35 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, dev, seed, start, test

## Knowledge Gaps
- **317 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+312 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 364 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `computeRoundOutcome()` connect `computeRoundOutcome` to `progressionEngine.js`, `seed.js`, `Arquitectura Técnica del Sistema: MathCoach Sparring`, `RoundSession`, `1. Descripción y Objetivos de Negocio`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `3. Subgrafo Afectado (Identificado con Graphify)` connect `RoundSession` to `1. Descripción y Objetivos de Negocio`, `computeRoundOutcome`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `RoundSession()` connect `RoundSession` to `4. Historias Pendientes`, `1. Descripción y Objetivos de Negocio`, `[MATH-US-14] Dashboard por Tema y Categoría`, `Guía de Usuario: MathCoach Sparring`, `Arquitectura Técnica del Sistema: MathCoach Sparring`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `RoundSession()` (e.g. with `[MATH-US-14] Dashboard por Tema y Categoría` and `10.1 Jerarquía y Descomposición de Componentes React`) actually correct?**
  _`RoundSession()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `ensureTracksForTopic()` (e.g. with `[MATH-US-09] Catálogo Curado de Ejercicios (Seed Idempotente)` and `3. Servicio Idempotente `ensureTracksForTopic``) actually correct?**
  _`ensureTracksForTopic()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _317 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `4. Historias Pendientes` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._