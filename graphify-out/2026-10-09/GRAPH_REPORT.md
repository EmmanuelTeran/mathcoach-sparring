# Graph Report - mathcoach-sparring  (2026-10-09)

## Corpus Check
- 72 files · ~45,487 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .example 1)

## Summary
- 405 nodes · 587 edges · 35 communities (29 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `553c821c`
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
- app.js
- package.json
- Guía de Usuario: DevCoach Sparring
- [US-01] Scaffolding, Base Monorepo y Harness de Tests (Vitest + Playwright)
- 2. Contratos de API
- server/package.json
- App.jsx
- Arquitectura Técnica del Sistema: DevCoach Sparring
- [US-03] Módulo Hard Skills: Active Recall Teórico y Práctico con IA
- [US-02] Schemas Mongoose y Motor Algorítmico SRS (SM-2 Adaptado)
- [US-05] Dashboard Operativo y Acoplamiento de Habilidades (Hard + Soft Skills)
- dashboardController.js
- practice.js
- [US-09] Prompts de IA Estratificados por Nivel y UI Badges Dinámicos
- [US-06] Seed Senior (30 Temas Clave) y Suite E2E Final
- [US-07] Niveles de Progresión y Andamiaje Pedagógico (Scaffolding)
- 2. Criterios de Aceptación (AC)
- devDependencies
- dependencies
- scripts
- CodingPlayground.jsx

## God Nodes (most connected - your core abstractions)
1. `mongoose` - 14 edges
2. `Guía de Usuario: DevCoach Sparring` - 13 edges
3. `Topic` - 12 edges
4. `Grafo de Dependencias` - 11 edges
5. `@playwright/test` - 10 edges
6. `connectDB()` - 10 edges
7. `2. Criterios de Aceptación (AC)` - 10 edges
8. `executeTests()` - 9 edges
9. `scripts` - 9 edges
10. `mongodb-memory-server` - 9 edges

## Surprising Connections (you probably didn't know these)
- `- [x] AC-6: Servicio IA `evaluateCodingSolution` en `server/src/services/geminiService.js`` --references--> `evaluateCodingSolution()`  [INFERRED]
  tickets/US-10-coding-playground.md → server/src/services/geminiService.js
- `3. Subgrafo Afectado (Identificado con Graphify)` --references--> `calculateNextReview()`  [INFERRED]
  tickets/US-02-srs-engine-and-models.md → server/src/utils/srsCalculator.js
- `1. Descripción` --references--> `calculateNextReview()`  [INFERRED]
  tickets/US-10-coding-playground.md → server/src/utils/srsCalculator.js
- `3. Subgrafo Afectado (Identificado con Graphify)` --references--> `App()`  [INFERRED]
  tickets/US-10-coding-playground.md → client/src/App.jsx
- `- [x] AC-7: Componente `client/src/components/CodingPlayground.jsx` (Split-Screen)` --references--> `runCodeInWorker()`  [INFERRED]
  tickets/US-10-coding-playground.md → client/src/utils/codeRunner.js

## Import Cycles
- None detected.

## Communities (35 total, 6 thin omitted)

### Community 0 - "Grafo de Dependencias"
Cohesion: 0.09
Nodes (20): Grafo de Dependencias, Grafo de Implementación: DevCoach Sparring, [US-01] Scaffolding, Base Monorepo y Harness de Tests (Vitest + Playwright), [US-02] Schemas Mongoose y Motor Algorítmico SRS (SM-2 Adaptado), [US-03] Módulo Hard Skills: Active Recall Teórico y Práctico, [US-04] Módulo Soft Skills: Sparring por Voz (Web Speech API + Gemini), [US-05] Dashboard Operativo y Acoplamiento de Habilidades, [US-06] Seed Senior del Roadmap y Validación E2E Total (+12 more)

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
Cohesion: 0.18
Nodes (10): vitest, name, private, type, version, autoprefixer, postcss, tailwindcss (+2 more)

### Community 12 - "app.js"
Cohesion: 0.20
Nodes (19): express, mongodb-memory-server, mongoose, supertest, app, connectDB(), disconnectDB(), MathTopic (+11 more)

### Community 13 - "package.json"
Cohesion: 0.07
Nodes (20): description, devDependencies, concurrently, @playwright/test, name, private, scripts, dev (+12 more)

### Community 14 - "Guía de Usuario: DevCoach Sparring"
Cohesion: 0.06
Nodes (35): 10.1 Interpretación de Métricas Rápidas, 10.2 Priorización Automática: Botón "Entrenar Ahora" (`recommendedNext`), 10.3 Gestión y Limpieza de Áreas Críticas, 10. Panel de Control y Dashboard Operativo, 11.1 Distribución del Catálogo, 11.2 Interacciones Críticas Junior en Soft Skills, 11.3 Sincronización Visual y Filtros en la Plataforma, 11. Catálogo Multinivel (Junior, Mid, Senior) y Sincronización en UI (US-08) (+27 more)

### Community 15 - "[US-01] Scaffolding, Base Monorepo y Harness de Tests (Vitest + Playwright)"
Cohesion: 0.22
Nodes (8): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, Tests E2E (Playwright), Tests Unitarios e Integración (Vitest / Supertest), [US-01] Scaffolding, Base Monorepo y Harness de Tests (Vitest + Playwright)

### Community 16 - "2. Contratos de API"
Cohesion: 0.12
Nodes (17): 2.1 `GET /api/health`, 2.2 `GET /api/topics/due`, 2.3 `POST /api/topics/review`, 2.4 `POST /api/practice/hard-skill/generate`, 2.5 `POST /api/practice/hard-skill/evaluate`, 2.6 `POST /api/practice/soft-skill/start`, 2.7 `POST /api/practice/soft-skill/reply`, 2.8 `GET /api/dashboard/summary` (+9 more)

### Community 17 - "server/package.json"
Cohesion: 0.09
Nodes (22): cors, dotenv, @google/genai, dependencies, cors, dotenv, express, @google/genai (+14 more)

### Community 18 - "App.jsx"
Cohesion: 0.17
Nodes (10): App(), CodingPlayground(), Dashboard(), LEVEL_ACTIVE, LEVEL_LABELS, LEVEL_STYLES, lucide-react, react (+2 more)

### Community 19 - "Arquitectura Técnica del Sistema: DevCoach Sparring"
Cohesion: 0.08
Nodes (23): 1. Topología del Monorepo, 3. Modelo de Datos (Mongoose Schemas), 4.1 Flujo de Active Recall y Evaluación de Hard Skills (Gemini + SRS), 4.2 Máquina de Estados del Motor Algorítmico SRS (SM-2 Adaptado), 4.3 Flujo de Arranque y Healthcheck, 4.4 Harness de Testing y E2E Playwright, 4.5 Flujo de Sparring por Voz (Web Speech API + Gemini + SRS), 4.6 Lógica de Recomendación Acoplada (Hard Skills + Soft Skills) (+15 more)

### Community 22 - "[US-03] Módulo Hard Skills: Active Recall Teórico y Práctico con IA"
Cohesion: 0.25
Nodes (7): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), Tests E2E (Playwright), Tests Unitarios e Integración (Vitest / Supertest), [US-03] Módulo Hard Skills: Active Recall Teórico y Práctico con IA

### Community 23 - "[US-02] Schemas Mongoose y Motor Algorítmico SRS (SM-2 Adaptado)"
Cohesion: 0.22
Nodes (8): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, Tests E2E (Playwright), Tests Unitarios e Integración (Vitest / Supertest), [US-02] Schemas Mongoose y Motor Algorítmico SRS (SM-2 Adaptado)

### Community 24 - "[US-05] Dashboard Operativo y Acoplamiento de Habilidades (Hard + Soft Skills)"
Cohesion: 0.25
Nodes (7): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), Tests End-to-End (Playwright), Tests Unitarios e Integración Backend (Vitest / Supertest), [US-05] Dashboard Operativo y Acoplamiento de Habilidades (Hard + Soft Skills)

### Community 25 - "dashboardController.js"
Cohesion: 0.16
Nodes (13): areTopicsRelated(), extractKeywords(), getDashboardSummary(), getLastScore(), dashboardRouter, 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify) (+5 more)

### Community 26 - "practice.js"
Cohesion: 0.19
Nodes (14): practiceRouter, softSkillPracticeRouter, evaluateCodingSolution(), evaluateHardSkillSolution(), generateHardSkillChallenge(), generateHint(), getClient(), getClient() (+6 more)

### Community 27 - "[US-09] Prompts de IA Estratificados por Nivel y UI Badges Dinámicos"
Cohesion: 0.25
Nodes (7): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, Tests E2E (Playwright), Tests Unitarios e Integración (Vitest / Supertest), [US-09] Prompts de IA Estratificados por Nivel y UI Badges Dinámicos

### Community 28 - "[US-06] Seed Senior (30 Temas Clave) y Suite E2E Final"
Cohesion: 0.25
Nodes (7): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), Pruebas E2E (Playwright), Tests Unitarios e Integración Backend (Vitest / Supertest), [US-06] Seed Senior (30 Temas Clave) y Suite E2E Final

### Community 29 - "[US-07] Niveles de Progresión y Andamiaje Pedagógico (Scaffolding)"
Cohesion: 0.25
Nodes (7): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, Tests E2E (Playwright), Tests Unitarios e Integración (Vitest / Supertest), [US-07] Niveles de Progresión y Andamiaje Pedagógico (Scaffolding)

### Community 30 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (21): deepEqual(), executeTests(), runCodeInWorker(), serializeValue(), 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story) (+13 more)

### Community 31 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, autoprefixer, postcss, tailwindcss, vite, @vitejs/plugin-react, vitest

### Community 32 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, lucide-react, monaco-editor, @monaco-editor/react, react, react-dom

### Community 33 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

## Knowledge Gaps
- **202 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+197 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 240 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.jsx` to `CodingPlayground.jsx`, `client/package.json`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `3. Subgrafo Afectado (Identificado con Graphify)` connect `2. Criterios de Aceptación (AC)` to `App.jsx`, `practice.js`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `calculateNextReview()` connect `practice.js` to `app.js`, `2. Criterios de Aceptación (AC)`, `[US-02] Schemas Mongoose y Motor Algorítmico SRS (SM-2 Adaptado)`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _202 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Grafo de Dependencias` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Guía de Usuario: DevCoach Sparring` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._