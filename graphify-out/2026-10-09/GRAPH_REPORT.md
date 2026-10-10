# Graph Report - mathcoach-sparring  (2026-10-09)

## Corpus Check
- 75 files · ~71,997 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .example 1)

## Summary
- 545 nodes · 751 edges · 33 communities (24 shown, 9 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8a7df2e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 4. Historias Pendientes
- [US-XX] {{TITULO_HISTORIA}}
- Contexto del Proyecto: Entrenador Personal Fullstack (Hard & Soft Skills)
- Skill: document-tech-specs
- Skill: document-user-guide
- Skill: implement-story
- Skill: new-user-story
- Skill: verify-user-story
- rules/graphify.md
- workflows/graphify.md
- heartbeat.md
- 1. Descripción y Objetivos de Negocio
- rounds.js
- package.json
- Guía de Usuario: MathCoach Sparring
- 2. Criterios de Aceptación (AC)
- 1. Descripción y Objetivos de Negocio
- server/package.json
- 2. Criterios de Aceptación (AC)
- Arquitectura Técnica del Sistema: MathCoach Sparring
- client/package.json
- MathVisionUploader
- 1. Descripción y Objetivos de Negocio
- ensureTracksForTopic
- progressionEngine.js
- computeRoundOutcome
- 1. Descripción y Objetivos de Negocio
- constants/categories.js

## God Nodes (most connected - your core abstractions)
1. `ensureTracksForTopic()` - 15 edges
2. `mongoose` - 14 edges
3. `computeRoundOutcome()` - 13 edges
4. `MathVisionUploader()` - 12 edges
5. `scripts` - 10 edges
6. `connectDB()` - 10 edges
7. `4. Historias Pendientes` - 10 edges
8. `Arquitectura Técnica del Sistema: MathCoach Sparring` - 10 edges
9. `react` - 9 edges
10. `disconnectDB()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `[MATH-US-13] UI de Sesión de Ronda (RoundSession.jsx)` --references--> `MathStatement()`  [INFERRED]
  .antigravity/graph.md → client/src/components/MathStatement.jsx
- `[MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes` --references--> `MathVisionUploader()`  [INFERRED]
  .antigravity/graph.md → client/src/components/MathVisionUploader.jsx
- `9. Deprecación y Purga Definitiva de Endpoints Legados` --references--> `MathVisionUploader()`  [INFERRED]
  docs/ARCHITECTURE.md → client/src/components/MathVisionUploader.jsx
- `B. Orquestador `server/scripts/seed.js`` --references--> `disconnectDB()`  [INFERRED]
  tickets/MATH-US-09-curated-catalog.md → server/src/db.js
- `[MATH-US-09] Catálogo Curado de Ejercicios (Seed Idempotente)` --references--> `ensureTracksForTopic()`  [INFERRED]
  .antigravity/graph.md → server/src/services/trackService.js

## Import Cycles
- None detected.

## Communities (33 total, 9 thin omitted)

### Community 0 - "4. Historias Pendientes"
Cohesion: 0.08
Nodes (24): 0. Glosario y Modelo Mental del Producto, 1.1 Composición de rondas (`ROUND_BUDGET_MIN = 15`), 1.2 Score de ronda y progresión adaptativa, 1.3 Acoplamiento con Spaced Repetition (SM-2 por pista), 1. Reglas de Negocio Globales (aplican a varias historias), 2.1 Orden de ejecución recomendado, 2. Grafo de Dependencias, 3. Historias Completadas (referencia) (+16 more)

### Community 1 - "[US-XX] {{TITULO_HISTORIA}}"
Cohesion: 0.22
Nodes (8): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, Tests E2E (Playwright), Tests Unitarios e Integración (Vitest / Supertest), [US-XX] {{TITULO_HISTORIA}}

### Community 2 - "Contexto del Proyecto: Entrenador Personal Fullstack (Hard & Soft Skills)"
Cohesion: 0.29
Nodes (6): 1. Stack Tecnológico Estricto, 2. Política de Tokens y Graphify en Modo Estricto (PreToolUse), 3. Principios de Código (mattpocock/skills), 4. Gestión de Tareas y Git, 5. Política de Modelos (Orquestación Asimétrica), Contexto del Proyecto: Entrenador Personal Fullstack (Hard & Soft Skills)

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

### Community 11 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.08
Nodes (23): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Configuración Centralizada de Constantes (`server/src/config/progression.js`), 1.3 Contrato Funcional Estricto de `progressionEngine.js`, 1.4 Lógica de Progresión y Adaptabilidad (§1.2 de `graph.md`), 1.5 Acoplamiento Exacto con SM-2 por Pista (§1.3 de `graph.md`), 1.6 Mantenimiento y Saneamiento de `srsCalculator.js`, 1. Descripción y Objetivos de Negocio, 2. Criterios de Aceptación (AC) (+15 more)

### Community 12 - "rounds.js"
Cohesion: 0.10
Nodes (29): dotenv, express, mongodb-memory-server, mongoose, supertest, seedDatabase(), curatedTopics, app (+21 more)

### Community 13 - "package.json"
Cohesion: 0.08
Nodes (21): description, devDependencies, concurrently, @playwright/test, name, private, scripts, dev (+13 more)

### Community 14 - "Guía de Usuario: MathCoach Sparring"
Cohesion: 0.07
Nodes (29): 1.1 Glosario de Entidades Clave, 1. Modelo Mental y Glosario del Producto, 2.1 Categorías Pedagógicas, 2.2 Estructura de las Sesiones de Práctica: El Bloque de ~15 Minutos de Tiempo Experto, 2.3 Cuotas de Ejercicios por Categoría, 2.4 Rotación Inteligente de Problemas, 2.5 Cola Inteligente de Repasos Diarios (`/api/rounds/queue`), 2. Las 3 Categorías y el Sistema Adaptativo de Rondas (+21 more)

### Community 15 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (15): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Inicialización y Gestión Defensiva de Permisos WebRTC, AC-2: Estado "Capturar Ejercicio" (Stream en Vivo y Guías de Encuadre), AC-3: Congelado de Fotograma, Canvas y Conversión Base64, AC-4: Estado "Analizando con IA..." (Feedback Inmersivo) (+7 more)

### Community 16 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.07
Nodes (26): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Reglas de Negocio de Composición de Rondas (`ROUND_BUDGET_MIN = 15`) (§1.1 de `graph.md`), 1.3 Algoritmo Estricto de Selección, Priorización y Ordenamiento, 1.4 Mutación de Estado y Snapshot Inmutable en `Round`, 1.5 Contratos Formales de la API HTTP (`server/src/routes/rounds.js`), 1.6 Manejo Defensivo de Errores y Validaciones, 1. Descripción y Objetivos de Negocio, 1. `GET /api/rounds/queue` — Cola de Pistas Vencidas para Repaso (+18 more)

### Community 17 - "server/package.json"
Cohesion: 0.09
Nodes (21): cors, dependencies, cors, dotenv, express, @google/genai, mongoose, devDependencies (+13 more)

### Community 18 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.13
Nodes (14): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Endpoint `POST /api/evaluate-math` y Validación Defensiva de Entrada, AC-2: Inferencia Multimodal con Gemini 1.5 Pro y Prompts Estratificados por Nivel, AC-3: Salida JSON Estricta Forzada con `responseMimeType` (+6 more)

### Community 19 - "Arquitectura Técnica del Sistema: MathCoach Sparring"
Cohesion: 0.08
Nodes (23): 1. Topología del Monorepo, 2.1 Esquema `MathTopic` (`server/src/models/MathTopic.js`), 2.2 Esquema `Exercise` (`server/src/models/Exercise.js`), 2.3 Esquema `TopicTrack` (`server/src/models/TopicTrack.js`), 2.4 Esquema `Round` (`server/src/models/Round.js`), 2. Modelo de Dominio y Esquemas de Persistencia (Mongoose), 3. Servicio Idempotente `ensureTracksForTopic`, 4.1 Modularidad de Datasets Curados (`server/seed-data/`) (+15 more)

### Community 22 - "client/package.json"
Cohesion: 0.05
Nodes (40): dependencies, katex, lucide-react, react, react-dom, react-markdown, rehype-katex, remark-math (+32 more)

### Community 23 - "MathVisionUploader"
Cohesion: 0.07
Nodes (35): App(), DEFAULT_TOPIC, Dashboard(), MathStatement(), MathVisionUploader(), SAMPLE_TOPIC, lucide-react, react (+27 more)

### Community 26 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.07
Nodes (29): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md)), 1.3 Arquitectura del Seed Modular y Scripts npm, 1.4 Lógica de Idempotencia Estricta y Servicio `ensureTracksForTopic`, 1.5 Especificación del Catálogo Curado (Temas, Categorías y Dificultades), 1.6 Cuotas de Volumen y Presupuesto de Rondas (§1.1), 1.7 Calidad Pedagógica y Rigor de Datos, 1. Descripción y Objetivos de Negocio (+21 more)

### Community 27 - "ensureTracksForTopic"
Cohesion: 0.07
Nodes (32): ensureTracksForTopic(), 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de `graph.md`), 1.3 Esquemas de Base de Datos Mongoose Exactos, 1.4 Mapeo de Categorías y Servicio Idempotente `ensureTracksForTopic`, 1.5 Contratos API, 1. Descripción y Objetivos de Negocio, 2. Criterios de Aceptación (AC) (+24 more)

### Community 28 - "progressionEngine.js"
Cohesion: 0.23
Nodes (12): CATEGORY_LIMITS, EXERCISE_PASS_SCORE, MAX_DIFFICULTY, MIN_DIFFICULTY, PROMOTION_INTERVAL_DAYS, PROMOTION_MIN_PASS_RATE, PROMOTION_MIN_SCORE, ROUND_BUDGET_MIN (+4 more)

### Community 29 - "computeRoundOutcome"
Cohesion: 0.05
Nodes (46): [MATH-US-12] Evaluación Multimodal de Rondas + Progresión, 5.1 Centralización de Constantes y Umbrales (`server/src/config/progression.js`), 5.2 Contrato Funcional de `computeRoundOutcome`, 5.3 Matriz de Acoplamiento Bidireccional: Dificultad Adaptativa vs. Algoritmo SM-2, 5. Motor de Progresión Adaptativa y Acoplamiento SRS (`progressionEngine.js`), 7.1 Prompt Engineering y Rúbricas Especializadas, 7.2 Esquema JSON Estricto y Auditoría de Cobertura (`found: boolean`), 7. Pipeline Multimodal de Evaluación de Rondas (`geminiService.js`) (+38 more)

### Community 30 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.29
Nodes (7): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Arquitectura de Componentes y Descomposición Modular, 1.3 Ciclo de Vida y Máquina de Estados de la Sesión, 1.4 Contrato Estricto de Identificadores Estables para E2E, 1. Descripción y Objetivos de Negocio, Fases Detalladas:, Identificadores de Soporte Adicionales:

## Knowledge Gaps
- **283 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+278 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 324 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ensureTracksForTopic()` connect `ensureTracksForTopic` to `4. Historias Pendientes`, `1. Descripción y Objetivos de Negocio`, `Arquitectura Técnica del Sistema: MathCoach Sparring`, `rounds.js`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `computeRoundOutcome()` connect `computeRoundOutcome` to `1. Descripción y Objetivos de Negocio`, `Arquitectura Técnica del Sistema: MathCoach Sparring`, `rounds.js`, `progressionEngine.js`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `MathVisionUploader()` connect `MathVisionUploader` to `4. Historias Pendientes`, `Arquitectura Técnica del Sistema: MathCoach Sparring`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `ensureTracksForTopic()` (e.g. with `[MATH-US-09] Catálogo Curado de Ejercicios (Seed Idempotente)` and `3. Servicio Idempotente `ensureTracksForTopic``) actually correct?**
  _`ensureTracksForTopic()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `computeRoundOutcome()` (e.g. with `[MATH-US-12] Evaluación Multimodal de Rondas + Progresión` and `5.2 Contrato Funcional de `computeRoundOutcome``) actually correct?**
  _`computeRoundOutcome()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `MathVisionUploader()` (e.g. with `[MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes` and `9. Deprecación y Purga Definitiva de Endpoints Legados`) actually correct?**
  _`MathVisionUploader()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _283 weakly-connected nodes found - possible documentation gaps or missing edges._