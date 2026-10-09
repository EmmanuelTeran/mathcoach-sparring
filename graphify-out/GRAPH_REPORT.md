# Graph Report - mathcoach-sparring  (2026-10-09)

## Corpus Check
- 67 files · ~40,345 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .example 1)

## Summary
- 347 nodes · 522 edges · 26 communities (19 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49002493`
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
- App.jsx
- app.js
- @playwright/test
- Guía de Usuario: DevCoach Sparring
- 2. Criterios de Aceptación (AC)
- 2. Contratos de API
- server/package.json
- practice.js
- Arquitectura Técnica del Sistema: DevCoach Sparring
- client/package.json
- softSkillPractice.js

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
- `3. Subgrafo Afectado (Identificado con Graphify)` --references--> `App()`  [INFERRED]
  tickets/MATH-US-03-vision-uploader.md → client/src/App.jsx
- `3. Subgrafo Afectado (Identificado con Graphify)` --references--> `MathVisionUploader()`  [INFERRED]
  tickets/MATH-US-03-vision-uploader.md → client/src/components/MathVisionUploader.jsx
- `bootstrap()` --calls--> `connectDB()`  [EXTRACTED]
  server/src/server.js → server/src/db.js
- `App()` --calls--> `CodingPlayground()`  [EXTRACTED]
  client/src/App.jsx → client/src/components/CodingPlayground.jsx

## Import Cycles
- None detected.

## Communities (26 total, 7 thin omitted)

### Community 0 - "Grafo de Dependencias"
Cohesion: 0.25
Nodes (7): Grafo de Dependencias, Grafo de Implementación: MathCoach Sparring, [MATH-US-01] Limpieza de Base Legada y Renombrado Monorepo, [MATH-US-02] Modelo de Datos MathTopic y Motor SRS SM-2, [MATH-US-03] UI de Cero Fricción para Active Recall (MathVisionUploader.jsx), [MATH-US-04] Pipeline Evaluador Multimodal y Actualización SRS, [MATH-US-06] Seed de Ejercicios Multinivel y Validación E2E Final

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

### Community 11 - "App.jsx"
Cohesion: 0.11
Nodes (19): [MATH-US-05] Dashboard Matemático & Cola Diaria de Ejercicios por Nivel, App(), CodingPlayground(), Dashboard(), LEVEL_ACTIVE, LEVEL_LABELS, LEVEL_STYLES, MathVisionUploader() (+11 more)

### Community 12 - "app.js"
Cohesion: 0.22
Nodes (17): mongodb-memory-server, mongoose, supertest, app, connectDB(), disconnectDB(), MathTopic, mathTopicSchema (+9 more)

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
Cohesion: 0.09
Nodes (22): cors, dotenv, @google/genai, dependencies, cors, dotenv, express, @google/genai (+14 more)

### Community 18 - "practice.js"
Cohesion: 0.50
Nodes (6): practiceRouter, evaluateCodingSolution(), evaluateHardSkillSolution(), generateHardSkillChallenge(), generateHint(), getClient()

### Community 19 - "Arquitectura Técnica del Sistema: DevCoach Sparring"
Cohesion: 0.06
Nodes (31): 1. Topología del Monorepo, 3. Modelo de Datos (Mongoose Schemas), 4.1 Flujo de Active Recall y Evaluación de Hard Skills (Gemini + SRS), 4.2 Máquina de Estados del Motor Algorítmico SRS (SM-2 Adaptado), 4.3 Flujo de Arranque y Healthcheck, 4.4 Harness de Testing y E2E Playwright, 4.5 Flujo de Sparring por Voz (Web Speech API + Gemini + SRS), 4.6 Lógica de Recomendación Acoplada (Hard Skills + Soft Skills) (+23 more)

### Community 22 - "client/package.json"
Cohesion: 0.06
Nodes (33): dependencies, lucide-react, monaco-editor, @monaco-editor/react, react, react-dom, devDependencies, autoprefixer (+25 more)

### Community 26 - "softSkillPractice.js"
Cohesion: 0.15
Nodes (14): express, areTopicsRelated(), extractKeywords(), getDashboardSummary(), getLastScore(), dashboardRouter, softSkillPracticeRouter, topicsRouter (+6 more)

## Knowledge Gaps
- **171 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+166 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 203 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.jsx` to `client/package.json`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `3. Subgrafo Afectado (Identificado con Graphify)` connect `App.jsx` to `2. Criterios de Aceptación (AC)`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _171 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Should `@playwright/test` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Guía de Usuario: DevCoach Sparring` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `2. Criterios de Aceptación (AC)` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._