# Graph Report - mathcoach-sparring  (2026-10-09)

## Corpus Check
- 57 files · ~33,946 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .example 1)

## Summary
- 427 nodes · 530 edges · 33 communities (24 shown, 9 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `061dc1f2`
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
- client/package.json
- models.test.js
- package.json
- Guía de Usuario: DevCoach Sparring
- 2. Criterios de Aceptación (AC)
- 2. Contratos de API
- dependencies
- 2. Criterios de Aceptación (AC)
- Arquitectura Técnica del Sistema: DevCoach Sparring
- MathVisionUploader
- 2. Criterios de Aceptación (AC)
- practice.js
- ensureTracksForTopic
- devDependencies
- devDependencies
- scripts
- constants/categories.js

## God Nodes (most connected - your core abstractions)
1. `Guía de Usuario: DevCoach Sparring` - 15 edges
2. `Arquitectura Técnica del Sistema: DevCoach Sparring` - 12 edges
3. `MathVisionUploader()` - 11 edges
4. `mongoose` - 11 edges
5. `4. Historias Pendientes` - 10 edges
6. `react` - 9 edges
7. `scripts` - 9 edges
8. `ensureTracksForTopic()` - 9 edges
9. `2. Contratos de API` - 9 edges
10. `2. Criterios de Aceptación (AC)` - 9 edges

## Surprising Connections (you probably didn't know these)
- `[MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes` --references--> `MathVisionUploader()`  [INFERRED]
  .antigravity/graph.md → client/src/components/MathVisionUploader.jsx
- `AC-1: Montaje Único de `MathVisionUploader` y Test de Instancia Única` --references--> `MathVisionUploader()`  [INFERRED]
  tickets/MATH-US-07-hotfix-ui.md → client/src/components/MathVisionUploader.jsx
- `Contexto y Defectos Detectados` --references--> `MathVisionUploader()`  [INFERRED]
  tickets/MATH-US-07-hotfix-ui.md → client/src/components/MathVisionUploader.jsx
- `[MATH-US-12] Evaluación Multimodal de Rondas + Progresión` --references--> `evaluateMathVisionSolution()`  [INFERRED]
  .antigravity/graph.md → server/src/services/geminiService.js
- `AC-4: Purga Absoluta del Backend Legado` --references--> `evaluateMathVisionSolution()`  [INFERRED]
  tickets/MATH-US-08-domain-model.md → server/src/services/geminiService.js

## Import Cycles
- None detected.

## Communities (33 total, 9 thin omitted)

### Community 0 - "4. Historias Pendientes"
Cohesion: 0.08
Nodes (23): 0. Glosario y Modelo Mental del Producto, 1.1 Composición de rondas (`ROUND_BUDGET_MIN = 15`), 1.2 Score de ronda y progresión adaptativa, 1.3 Acoplamiento con Spaced Repetition (SM-2 por pista), 1. Reglas de Negocio Globales (aplican a varias historias), 2.1 Orden de ejecución recomendado, 2. Grafo de Dependencias, 3. Historias Completadas (referencia) (+15 more)

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
Cohesion: 0.07
Nodes (29): dependencies, katex, lucide-react, react, react-dom, react-markdown, rehype-katex, remark-math (+21 more)

### Community 12 - "models.test.js"
Cohesion: 0.08
Nodes (33): cors, dotenv, express, mongodb-memory-server, mongoose, supertest, vitest, name (+25 more)

### Community 13 - "package.json"
Cohesion: 0.08
Nodes (20): description, devDependencies, concurrently, @playwright/test, name, private, scripts, dev (+12 more)

### Community 14 - "Guía de Usuario: DevCoach Sparring"
Cohesion: 0.04
Nodes (47): 10.1 Interpretación de Métricas Rápidas, 10.2 Priorización Automática: Botón "Entrenar Ahora" (`recommendedNext`), 10.3 Gestión y Limpieza de Áreas Críticas, 10. Panel de Control y Dashboard Operativo, 11.1 Distribución del Catálogo, 11.2 Interacciones Críticas Junior en Soft Skills, 11.3 Sincronización Visual y Filtros en la Plataforma, 11. Catálogo Multinivel (Junior, Mid, Senior) y Sincronización en UI (US-08) (+39 more)

### Community 15 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (15): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Inicialización y Gestión Defensiva de Permisos WebRTC, AC-2: Estado "Capturar Ejercicio" (Stream en Vivo y Guías de Encuadre), AC-3: Congelado de Fotograma, Canvas y Conversión Base64, AC-4: Estado "Analizando con IA..." (Feedback Inmersivo) (+7 more)

### Community 16 - "2. Contratos de API"
Cohesion: 0.12
Nodes (17): 2.1 `GET /api/health`, 2.2 `GET /api/topics/due`, 2.3 `POST /api/topics/review`, 2.4 `POST /api/practice/hard-skill/generate`, 2.5 `POST /api/practice/hard-skill/evaluate`, 2.6 `POST /api/practice/soft-skill/start`, 2.7 `POST /api/practice/soft-skill/reply`, 2.8 `GET /api/dashboard/summary` (+9 more)

### Community 17 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, cors, dotenv, express, @google/genai, mongoose

### Community 18 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.14
Nodes (13): 1. Descripción, 2. Criterios de Aceptación (AC), 3. Subgrafo Afectado (Identificado con Graphify), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Endpoint `POST /api/evaluate-math` y Validación Defensiva de Entrada, AC-2: Inferencia Multimodal con Gemini 1.5 Pro y Prompts Estratificados por Nivel, AC-3: Salida JSON Estricta Forzada con `responseMimeType` (+5 more)

### Community 19 - "Arquitectura Técnica del Sistema: DevCoach Sparring"
Cohesion: 0.06
Nodes (31): 1. Topología del Monorepo, 3. Modelo de Datos (Mongoose Schemas), 4.1 Flujo de Active Recall y Evaluación de Hard Skills (Gemini + SRS), 4.2 Máquina de Estados del Motor Algorítmico SRS (SM-2 Adaptado), 4.3 Flujo de Arranque y Healthcheck, 4.4 Harness de Testing y E2E Playwright, 4.5 Flujo de Sparring por Voz (Web Speech API + Gemini + SRS), 4.6 Lógica de Recomendación Acoplada (Hard Skills + Soft Skills) (+23 more)

### Community 22 - "MathVisionUploader"
Cohesion: 0.15
Nodes (16): [MATH-US-13] UI de Sesión de Ronda (RoundSession.jsx), App(), DEFAULT_TOPIC, Dashboard(), MathStatement(), MathVisionUploader(), SAMPLE_TOPIC, 11.1 Pila de Renderizado de `MathStatement` (Markdown + LaTeX con KaTeX) (+8 more)

### Community 23 - "2. Criterios de Aceptación (AC)"
Cohesion: 0.12
Nodes (16): 1. Descripción, 2. Criterios de Aceptación (AC), 4. Evidencia de Pruebas (Completado por verify-user-story), 5. Commit de Cierre en dev, AC-1: Montaje Único de `MathVisionUploader` y Test de Instancia Única, AC-2: Componente `MathStatement.jsx` con Markdown + LaTeX (KaTeX), AC-3: Estado Vacío cuando no hay Ejercicio Cargado, AC-4: Eliminación Total de "Coding Playground" y Navegación Simplificada (+8 more)

### Community 26 - "practice.js"
Cohesion: 0.16
Nodes (12): 10.1 Arquitectura del Flujo Multimodal, 10.2 Conexión Express con Gemini 1.5 Pro (`@google/genai`), 10.3 Formato del JSON Estricto y Parsing Defensivo, 10.4 Acoplamiento con el Motor SRS (SM-2) y Persistencia en Mongoose, 10.5 Manejo de Errores y Códigos HTTP, 10. Pipeline Evaluador Multimodal (Gemini 1.5 Pro) y Acoplamiento SRS (MATH-US-04), @google/genai, practiceRouter (+4 more)

### Community 27 - "ensureTracksForTopic"
Cohesion: 0.07
Nodes (32): [MATH-US-09] Catálogo Curado de Ejercicios (Seed Idempotente), ensureTracksForTopic(), 1.1 Contexto Arquitectónico y Razón de Cambio, 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de `graph.md`), 1.3 Esquemas de Base de Datos Mongoose Exactos, 1.4 Mapeo de Categorías y Servicio Idempotente `ensureTracksForTopic`, 1.5 Contratos API, 1. Descripción y Objetivos de Negocio (+24 more)

### Community 28 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, jsdom, postcss, tailwindcss, @testing-library/jest-dom, @testing-library/react, vite (+2 more)

### Community 29 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, mongodb-memory-server, supertest, vitest

### Community 30 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, dev, start, test

## Knowledge Gaps
- **234 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+229 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 264 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Arquitectura Técnica del Sistema: DevCoach Sparring` connect `Arquitectura Técnica del Sistema: DevCoach Sparring` to `2. Contratos de API`, `practice.js`, `MathVisionUploader`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Why does `calculateNextReview()` connect `practice.js` to `4. Historias Pendientes`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `MathVisionUploader()` connect `MathVisionUploader` to `4. Historias Pendientes`, `2. Criterios de Aceptación (AC)`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `MathVisionUploader()` (e.g. with `[MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes` and `11.2 Purga Arquitectónica de Monaco Editor y Coding Playground`) actually correct?**
  _`MathVisionUploader()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _234 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `4. Historias Pendientes` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `client/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._