# Graph Report - mathcoach-sparring  (2026-10-09)

## Corpus Check
- 68 files · ~43,898 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .example 1)

## Summary
- 364 nodes · 541 edges · 29 communities (22 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4b39b1d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Grafo de Dependencias
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
- client/package.json
- practice.test.js
- @playwright/test
- Guía de Usuario: DevCoach Sparring
- 2. Criterios de Aceptación (AC)
- 2. Contratos de API
- server/package.json
- 2. Criterios de Aceptación (AC)
- Arquitectura Técnica del Sistema: DevCoach Sparring
- devDependencies
- codeRunner.js
- app.js
- dependencies
- scripts

## God Nodes (most connected - your core abstractions)
1. `mongoose` - 14 edges
2. `Guía de Usuario: DevCoach Sparring` - 14 edges
3. `Topic` - 12 edges
4. `@playwright/test` - 11 edges
5. `connectDB()` - 10 edges
6. `Arquitectura Técnica del Sistema: DevCoach Sparring` - 10 edges
7. `scripts` - 9 edges
8. `mongodb-memory-server` - 9 edges
9. `app` - 9 edges
10. `SessionLog` - 9 edges

## Surprising Connections (you probably didn't know these)
- `[MATH-US-05] Dashboard Matemático & Cola Diaria de Ejercicios por Nivel` --references--> `MathVisionUploader()`  [INFERRED]
  .antigravity/graph.md → client/src/components/MathVisionUploader.jsx
- `AC-4: Motor SRS SM-2 y Persistencia Atómica en `MathTopic`` --references--> `calculateNextReview()`  [INFERRED]
  tickets/MATH-US-04-multimodal-pipeline.md → server/src/utils/srsCalculator.js
- `3. Subgrafo Afectado (Identificado con Graphify)` --references--> `App()`  [INFERRED]
  tickets/MATH-US-03-vision-uploader.md → client/src/App.jsx
- `3. Subgrafo Afectado (Identificado con Graphify)` --references--> `MathVisionUploader()`  [INFERRED]
  tickets/MATH-US-03-vision-uploader.md → client/src/components/MathVisionUploader.jsx
- `CodingPlayground()` --calls--> `runCodeInWorker()`  [EXTRACTED]
  client/src/components/CodingPlayground.jsx → client/src/utils/codeRunner.js

## Import Cycles
- None detected.

## Communities (29 total, 7 thin omitted)

### Community 0 - "Grafo de Dependencias"
Cohesion: 0.22
Nodes (8): Grafo de Dependencias, Grafo de Implementación: MathCoach Sparring, [MATH-US-01] Limpieza de Base Legada y Renombrado Monorepo, [MATH-US-02] Modelo de Datos MathTopic y Motor SRS SM-2, [MATH-US-03] UI de Cero Fricción para Active Recall (MathVisionUploader.jsx), [MATH-US-04] Pipeline Evaluador Multimodal y Actualización SRS, [MATH-US-05] Dashboard Matemático & Cola Diaria de Ejercicios por Nivel, [MATH-US-06] Seed de Ejercicios Multinivel y Validación E2E Final

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

### Community 11 - "client/package.json"
Cohesion: 0.08
Nodes (26): vitest, name, private, type, version, App(), CodingPlayground(), Dashboard() (+18 more)

### Community 12 - "practice.test.js"
Cohesion: 0.18
Nodes (21): dotenv, mongodb-memory-server, mongoose, supertest, app, areTopicsRelated(), extractKeywords(), getDashboardSummary() (+13 more)

### Community 13 - "@playwright/test"
Cohesion: 0.06
Nodes (20): description, devDependencies, concurrently, @playwright/test, name, private, scripts, dev (+12 more)

### Community 14 - "Guía de Usuario: DevCoach Sparring"
Cohesion: 0.05
Nodes (40): 10.1 Interpretación de Métricas Rápidas, 10.2 Priorización Automática: Botón "Entrenar Ahora" (`recommendedNext`), 10.3 Gestión y Limpieza de Áreas Críticas, 10. Panel de Control y Dashboard Operativo, 11.1 Distribución del Catálogo, 11.2 Interacciones Críticas Junior en Soft Skills, 11.3 Sincronización Visual y Filtros en la Plataforma, 11. Catálogo Multinivel (Junior, Mid, Senior) y Sincronización en UI (US-08) (+32 more)

### Community 15 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (15): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Inicialización y Gestión Defensiva de Permisos WebRTC, AC-2: Estado "Capturar Ejercicio" (Stream en Vivo y Guías de Encuadre), AC-3: Congelado de Fotograma, Canvas y Conversión Base64, AC-4: Estado "Analizando con IA..." (Feedback Inmersivo) (+7 more)

### Community 16 - "2. Contratos de API"
Cohesion: 0.12
Nodes (17): 2.1 `GET /api/health`, 2.2 `GET /api/topics/due`, 2.3 `POST /api/topics/review`, 2.4 `POST /api/practice/hard-skill/generate`, 2.5 `POST /api/practice/hard-skill/evaluate`, 2.6 `POST /api/practice/soft-skill/start`, 2.7 `POST /api/practice/soft-skill/reply`, 2.8 `GET /api/dashboard/summary` (+9 more)

### Community 17 - "server/package.json"
Cohesion: 0.10
Nodes (20): cors, dependencies, cors, dotenv, express, @google/genai, mongoose, devDependencies (+12 more)

### Community 18 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.13
Nodes (14): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Endpoint `POST /api/evaluate-math` y Validación Defensiva de Entrada, AC-2: Inferencia Multimodal con Gemini 1.5 Pro y Prompts Estratificados por Nivel, AC-3: Salida JSON Estricta Forzada con `responseMimeType` (+6 more)

### Community 19 - "Arquitectura Técnica del Sistema: DevCoach Sparring"
Cohesion: 0.06
Nodes (31): 1. Topología del Monorepo, 3. Modelo de Datos (Mongoose Schemas), 4.1 Flujo de Active Recall y Evaluación de Hard Skills (Gemini + SRS), 4.2 Máquina de Estados del Motor Algorítmico SRS (SM-2 Adaptado), 4.3 Flujo de Arranque y Healthcheck, 4.4 Harness de Testing y E2E Playwright, 4.5 Flujo de Sparring por Voz (Web Speech API + Gemini + SRS), 4.6 Lógica de Recomendación Acoplada (Hard Skills + Soft Skills) (+23 more)

### Community 22 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, jsdom, postcss, tailwindcss, @testing-library/jest-dom, @testing-library/react, vite (+2 more)

### Community 23 - "codeRunner.js"
Cohesion: 0.57
Nodes (4): deepEqual(), executeTests(), runCodeInWorker(), serializeValue()

### Community 26 - "app.js"
Cohesion: 0.14
Nodes (20): express, @google/genai, codingPracticeRouter, dashboardRouter, healthRouter, practiceRouter, softSkillPracticeRouter, topicsRouter (+12 more)

### Community 27 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, lucide-react, monaco-editor, @monaco-editor/react, react, react-dom

### Community 28 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

## Knowledge Gaps
- **182 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 215 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MathVisionUploader()` connect `client/package.json` to `Grafo de Dependencias`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `3. Subgrafo Afectado (Identificado con Graphify)` connect `client/package.json` to `2. Criterios de Aceptación (AC)`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `client/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08367071524966262 - nodes in this community are weakly interconnected._
- **Should `@playwright/test` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Guía de Usuario: DevCoach Sparring` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `2. Criterios de Aceptación (AC)` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._