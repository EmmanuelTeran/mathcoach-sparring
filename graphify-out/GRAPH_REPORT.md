# Graph Report - mathcoach-sparring  (2026-10-09)

## Corpus Check
- 65 files · ~49,314 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .example 1)

## Summary
- 406 nodes · 535 edges · 31 communities (22 shown, 9 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10ea37c3`
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
- 2. Criterios de Aceptación (AC)
- seed.js
- package.json
- Guía de Usuario: MathCoach Sparring
- 2. Criterios de Aceptación (AC)
- dependencies
- server/package.json
- 2. Criterios de Aceptación (AC)
- Arquitectura Técnica del Sistema: MathCoach Sparring
- client/package.json
- App.jsx
- 1. Descripción y Objetivos de Negocio
- ensureTracksForTopic
- practice.js
- constants/categories.js

## God Nodes (most connected - your core abstractions)
1. `ensureTracksForTopic()` - 15 edges
2. `mongoose` - 12 edges
3. `MathVisionUploader()` - 10 edges
4. `scripts` - 10 edges
5. `4. Historias Pendientes` - 10 edges
6. `react` - 9 edges
7. `connectDB()` - 9 edges
8. `2. Criterios de Aceptación (AC)` - 9 edges
9. `disconnectDB()` - 8 edges
10. `MathTopic` - 8 edges

## Surprising Connections (you probably didn't know these)
- `[MATH-US-13] UI de Sesión de Ronda (RoundSession.jsx)` --references--> `MathStatement()`  [INFERRED]
  .antigravity/graph.md → client/src/components/MathStatement.jsx
- `[MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes` --references--> `MathVisionUploader()`  [INFERRED]
  .antigravity/graph.md → client/src/components/MathVisionUploader.jsx
- `AC-1: Montaje Único de `MathVisionUploader` y Test de Instancia Única` --references--> `MathVisionUploader()`  [INFERRED]
  tickets/MATH-US-07-hotfix-ui.md → client/src/components/MathVisionUploader.jsx
- `Contexto y Defectos Detectados` --references--> `MathVisionUploader()`  [INFERRED]
  tickets/MATH-US-07-hotfix-ui.md → client/src/components/MathVisionUploader.jsx
- `B. Orquestador `server/scripts/seed.js`` --references--> `disconnectDB()`  [INFERRED]
  tickets/MATH-US-09-curated-catalog.md → server/src/db.js

## Import Cycles
- None detected.

## Communities (31 total, 9 thin omitted)

### Community 0 - "4. Historias Pendientes"
Cohesion: 0.10
Nodes (20): 0. Glosario y Modelo Mental del Producto, 2.1 Orden de ejecución recomendado, 2. Grafo de Dependencias, 3. Historias Completadas (referencia), 4. Historias Pendientes, Grafo de Implementación: MathCoach Sparring, [MATH-US-01] Limpieza de Base Legada y Renombrado Monorepo, [MATH-US-02] Modelo de Datos MathTopic y Motor SRS SM-2 (+12 more)

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

### Community 11 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (16): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Montaje Único de `MathVisionUploader` y Test de Instancia Única, AC-2: Componente `MathStatement.jsx` con Markdown + LaTeX (KaTeX), AC-3: Estado Vacío cuando no hay Ejercicio Cargado, AC-4: Eliminación Total de "Coding Playground" y Navegación Simplificada (+8 more)

### Community 12 - "seed.js"
Cohesion: 0.10
Nodes (25): dotenv, mongodb-memory-server, mongoose, supertest, seedDatabase(), curatedTopics, app, CATEGORIES (+17 more)

### Community 13 - "package.json"
Cohesion: 0.08
Nodes (21): description, devDependencies, concurrently, @playwright/test, name, private, scripts, dev (+13 more)

### Community 14 - "Guía de Usuario: MathCoach Sparring"
Cohesion: 0.10
Nodes (20): 1.1 Glosario de Entidades Clave, 1. Modelo Mental y Glosario del Producto, 2.1 Categorías Pedagógicas, 2. Las 3 Categorías y el Sistema Adaptativo de Rondas, 3.1 Temas Curriculares Disponibles, 3.2 Distribución de Ejercicios por Matriz (Tema × Categoría × Dificultad), 3.3 Siembra e Inicialización del Catálogo (`npm run seed`), 3. Catálogo Curado de Ejercicios Matemáticos (+12 more)

### Community 15 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (15): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Inicialización y Gestión Defensiva de Permisos WebRTC, AC-2: Estado "Capturar Ejercicio" (Stream en Vivo y Guías de Encuadre), AC-3: Congelado de Fotograma, Canvas y Conversión Base64, AC-4: Estado "Analizando con IA..." (Feedback Inmersivo) (+7 more)

### Community 16 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, katex, lucide-react, react, react-dom, react-markdown, rehype-katex, remark-math

### Community 17 - "server/package.json"
Cohesion: 0.08
Nodes (26): cors, express, dependencies, cors, dotenv, express, @google/genai, mongoose (+18 more)

### Community 18 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.13
Nodes (14): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Endpoint `POST /api/evaluate-math` y Validación Defensiva de Entrada, AC-2: Inferencia Multimodal con Gemini 1.5 Pro y Prompts Estratificados por Nivel, AC-3: Salida JSON Estricta Forzada con `responseMimeType` (+6 more)

### Community 19 - "Arquitectura Técnica del Sistema: MathCoach Sparring"
Cohesion: 0.11
Nodes (18): 1. Topología del Monorepo, 2.1 Esquema `MathTopic` (`server/src/models/MathTopic.js`), 2.2 Esquema `Exercise` (`server/src/models/Exercise.js`), 2.3 Esquema `TopicTrack` (`server/src/models/TopicTrack.js`), 2.4 Esquema `Round` (`server/src/models/Round.js`), 2. Modelo de Dominio y Esquemas de Persistencia (Mongoose), 3. Servicio Idempotente `ensureTracksForTopic`, 4.1 Modularidad de Datasets Curados (`server/seed-data/`) (+10 more)

### Community 22 - "client/package.json"
Cohesion: 0.06
Nodes (31): devDependencies, autoprefixer, jsdom, postcss, tailwindcss, @testing-library/jest-dom, @testing-library/react, vite (+23 more)

### Community 23 - "App.jsx"
Cohesion: 0.19
Nodes (12): App(), DEFAULT_TOPIC, Dashboard(), MathStatement(), MathVisionUploader(), SAMPLE_TOPIC, lucide-react, react (+4 more)

### Community 26 - "1. Descripción y Objetivos de Negocio"
Cohesion: 0.07
Nodes (29): 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md)), 1.3 Arquitectura del Seed Modular y Scripts npm, 1.4 Lógica de Idempotencia Estricta y Servicio `ensureTracksForTopic`, 1.5 Especificación del Catálogo Curado (Temas, Categorías y Dificultades), 1.6 Cuotas de Volumen y Presupuesto de Rondas (§1.1), 1.7 Calidad Pedagógica y Rigor de Datos, 1. Descripción y Objetivos de Negocio (+21 more)

### Community 27 - "ensureTracksForTopic"
Cohesion: 0.07
Nodes (31): ensureTracksForTopic(), 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de `graph.md`), 1.3 Esquemas de Base de Datos Mongoose Exactos, 1.4 Mapeo de Categorías y Servicio Idempotente `ensureTracksForTopic`, 1.5 Contratos API, 1. Descripción y Objetivos de Negocio, 2. Criterios de Aceptación (AC) (+23 more)

### Community 28 - "practice.js"
Cohesion: 0.17
Nodes (11): 1.1 Composición de rondas (`ROUND_BUDGET_MIN = 15`), 1.2 Score de ronda y progresión adaptativa, 1.3 Acoplamiento con Spaced Repetition (SM-2 por pista), 1. Reglas de Negocio Globales (aplican a varias historias), [MATH-US-12] Evaluación Multimodal de Rondas + Progresión, @google/genai, practiceRouter, evaluateMathVisionSolution() (+3 more)

## Knowledge Gaps
- **209 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 246 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ensureTracksForTopic()` connect `ensureTracksForTopic` to `4. Historias Pendientes`, `1. Descripción y Objetivos de Negocio`, `Arquitectura Técnica del Sistema: MathCoach Sparring`, `seed.js`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `calculateNextReview()` connect `practice.js` to `2. Criterios de Aceptación (AC)`, `Guía de Usuario: MathCoach Sparring`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `MathVisionUploader()` connect `App.jsx` to `4. Historias Pendientes`, `2. Criterios de Aceptación (AC)`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `ensureTracksForTopic()` (e.g. with `[MATH-US-09] Catálogo Curado de Ejercicios (Seed Idempotente)` and `3. Servicio Idempotente `ensureTracksForTopic``) actually correct?**
  _`ensureTracksForTopic()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `MathVisionUploader()` (e.g. with `[MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes` and `3. Subgrafo Afectado (Identificado con Graphify)`) actually correct?**
  _`MathVisionUploader()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `4. Historias Pendientes` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._