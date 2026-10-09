# Grafo de Implementación: MathCoach Sparring

> Fuente de verdad para `new-user-story` → `implement-story` → `verify-user-story`.
> Cada historia se ejecuta en `feature/MATH-US-XX-<slug>` desde `dev` y genera `tickets/MATH-US-XX-<slug>.md`.

## 0. Glosario y Modelo Mental del Producto

| Término | Definición |
|---|---|
| **Tema** (`MathTopic`) | Unidad de contenido (p. ej. "Fracciones algebraicas", "Límites"). Tiene `slug`, `title`, `area`, `source`. |
| **Categoría** | Tipo de ejercicio. Sustituye a los antiguos "niveles 1/2/3". Valores fijos: **Técnica** (`technique`), **Aplicación** (`application`), **Demostración** (`proof`). |
| **Dificultad** | Escalón adaptativo **dentro** de cada categoría: `1`, `2`, `3`. Sube según el desempeño. |
| **Pista** (`TopicTrack`) | Par único *Tema × Categoría*. Es la unidad que lleva **SRS y dificultad actual**. Cada tema tiene 3 pistas. |
| **Ejercicio** (`Exercise`) | Enunciado concreto (Markdown + LaTeX) asociado a tema, categoría y dificultad, con `expertMinutes` y `order` (complejidad creciente). |
| **Ronda** (`Round`) | Sesión de práctica de una pista: conjunto de ejercicios que **un experto resolvería en ~15 min**. Se evalúa como un todo. |
| **Tiempo experto** (`expertMinutes`) | Minutos estimados que tarda alguien que domina el tema en resolver el ejercicio. Base para componer rondas. |

> [!NOTE]
> "Técnica" reemplaza a "procedimentales". Si se prefiere otro nombre, sólo cambia la etiqueta UI en `client/src/constants/categories.js`; la clave interna `technique` no cambia.

## 1. Reglas de Negocio Globales (aplican a varias historias)

### 1.1 Composición de rondas (`ROUND_BUDGET_MIN = 15`)

| Categoría | Mín. ejercicios | Máx. ejercicios | Regla |
|---|---|---|---|
| Técnica | 3 | 10 | Acumular `expertMinutes` hasta alcanzar ≥ 15 o llegar al máximo. |
| Aplicación | 1 | 3 | Igual, pero normalmente 1–2 ejercicios. |
| Demostración | 1 | 1 | Siempre un único ejercicio por ronda. |

- Se toman ejercicios de la **dificultad actual** de la pista.
- Prioridad de selección: menos veces servido (`timesServed` asc) → más antiguo (`lastServedAt` asc) → `order` asc.
- Los ejercicios seleccionados se **presentan ordenados por `order` ascendente** (dificultad incremental dentro de la ronda).
- Si el catálogo no alcanza el mínimo, se sirve lo disponible (≥ 1) y la respuesta incluye `warning: 'catalog_insufficient'`.

### 1.2 Score de ronda y progresión adaptativa

- Cada ejercicio recibe un score `0–5`. `roundScore = promedio` (1 decimal). `passRate = % de ejercicios con score ≥ 3`.
- **Promoción** (sube dificultad para el próximo repaso): `difficulty < 3 && roundScore >= 4.0 && passRate >= 0.8`.
- **Permanencia:** cualquier otro caso. **No hay degradación** de dificultad.
- Umbrales centralizados en `server/src/config/progression.js` (`PROMOTION_MIN_SCORE`, `PROMOTION_MIN_PASS_RATE`, `PROMOTION_INTERVAL_DAYS`, `ROUND_BUDGET_MIN`, límites por categoría).

### 1.3 Acoplamiento con Spaced Repetition (SM-2 por pista)

| Resultado de la ronda | Efecto en dificultad | Efecto en SRS |
|---|---|---|
| `roundScore < 3` (fallo) | Se mantiene | Reinicio SM-2: `repetition = 0`, intervalo 1 día. |
| Aprobada sin promoción | Se mantiene | SM-2 estándar (`calculateNextReview` con `round(roundScore)`). |
| Promoción | `difficulty + 1` | `repetition = 1`, intervalo fijo `PROMOTION_INTERVAL_DAYS` (3) — material nuevo, repaso pronto. `efactor` se conserva del cálculo SM-2. |
| Dificultad 3 con score alto | Se mantiene (tope) | SM-2 estándar → intervalos largos (dominio). |

## 2. Grafo de Dependencias

```text
[MATH-US-01: Limpieza Legada y Renombrado Monorepo]                       ✅ Done
└──> [MATH-US-02: Modelo MathTopic y Motor SRS SM-2]                      ✅ Done
     └──> [MATH-US-03: UI Cero Fricción (MathVisionUploader.jsx)]         ✅ Done
          └──> [MATH-US-04: Pipeline Evaluador Multimodal + SRS]          ✅ Done
               └──> [MATH-US-07: Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes]
                    └──> [MATH-US-08: Modelo de Dominio Tema × Categoría × Dificultad + Purga Backend Legado]
                         ├──> [MATH-US-09: Catálogo Curado de Ejercicios (Seed Idempotente)]
                         ├──> [MATH-US-10: Motor de Progresión Adaptativa (Dificultad + SRS por Pista)]
                         └──> [MATH-US-11: Constructor de Rondas de 15 min + API de Rondas]
                                   │            (MATH-US-10 + MATH-US-11)
                                   └──> [MATH-US-12: Evaluación Multimodal de Rondas + Progresión]
                                        └──> [MATH-US-13: UI de Sesión de Ronda (RoundSession.jsx)]
                                             └──> [MATH-US-14: Dashboard por Tema y Categoría]
                                                  └──> [MATH-US-15: Validación E2E Final + Documentación]  (requiere MATH-US-09)

[MATH-US-05] ❌ Reemplazada por MATH-US-14
[MATH-US-06] ❌ Reemplazada por MATH-US-09 (seed) + MATH-US-15 (E2E)
```

### 2.1 Orden de ejecución recomendado

| # | Historia | Depende de | Paralelizable con | Estado |
|---|---|---|---|---|
| 1 | MATH-US-07 | 04 | — | Backlog |
| 2 | MATH-US-08 | 07 | — | Backlog |
| 3 | MATH-US-09 | 08 | 10, 11 | Backlog |
| 4 | MATH-US-10 | 08 | 09, 11 | Backlog |
| 5 | MATH-US-11 | 08 | 09, 10 | Backlog |
| 6 | MATH-US-12 | 10, 11 | — | Backlog |
| 7 | MATH-US-13 | 12, 09 (para prueba manual) | — | Backlog |
| 8 | MATH-US-14 | 13 | — | Backlog |
| 9 | MATH-US-15 | 09, 14 | — | Backlog |

---

## 3. Historias Completadas (referencia)

### [MATH-US-01] Limpieza de Base Legada y Renombrado Monorepo
- **Estado:** Done
- **Criterios de Aceptación (AC):**
  1. Monorepo renombrado a `mathcoach-sparring` en raíz y packages (`@mathcoach-sparring/client`, `@mathcoach-sparring/server`).
  2. Eliminación de componentes legados de DevCoach (`HardSkillTrainer.jsx`, `SoftSkillTrainer.jsx`).
  3. Eliminación de scripts y tests acoplados a semillas anteriores.

### [MATH-US-02] Modelo de Datos MathTopic y Motor SRS SM-2
- **Estado:** Done
- **Criterios de Aceptación (AC):**
  1. Modelo `MathTopic` en `server/src/models/MathTopic.js` con `title`, `source`, `level` (1, 2, 3), `problemStatement` e historial.
  2. Motor SRS SM-2 (`srsCalculator.js`) con rango 0–5 y aliases bidireccionales (`repetition`, `interval`, `efactor`, `dueDate`).
  3. Tests unitarios en verde (`server/tests/mathTopic.test.js`).

### [MATH-US-03] UI de Cero Fricción para Active Recall (MathVisionUploader.jsx)
- **Estado:** Done
- **Criterios de Aceptación (AC):**
  1. `MathVisionUploader.jsx` con WebRTC (`getUserMedia`), selector de cámara y fallback a `<input type="file">`.
  2. Visor en vivo con guías de encuadre y captura a `<canvas>`.
  3. Conversión a Base64 JPEG (0.85) y detención de tracks.
  4. Estados de UI: "Activar Cámara", "Capturar Ejercicio", "Analizando con IA..." y resultados (score, feedback, hint, fecha SRS).
  5. Contrato `POST /api/evaluate-math` con `{ problemId, image, metadata }`.

### [MATH-US-04] Pipeline Evaluador Multimodal y Actualización SRS
- **Estado:** Done
- **Criterios de Aceptación (AC):**
  1. Endpoint `POST /api/evaluate-math` delegando a Gemini 1.5 Pro (`@google/genai`).
  2. Prompt riguroso por nivel (1: Computacional, 2: Modelado, 3: Demostración). *(Se generaliza a Categoría × Dificultad en MATH-US-12.)*
  3. Salida JSON `{ score, feedback_paso_a_paso, hint }` y actualización SRS en BD.

### [MATH-US-05] ~~Dashboard Matemático & Cola Diaria por Nivel~~
- **Estado:** Cancelada — reemplazada por **MATH-US-14** (el concepto "nivel" desaparece en favor de Categoría × Dificultad).

### [MATH-US-06] ~~Seed Multinivel & E2E Final~~
- **Estado:** Cancelada — dividida en **MATH-US-09** (catálogo/seed) y **MATH-US-15** (E2E + docs).

---

## 4. Historias Pendientes

### [MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes
- **Dependencias:** MATH-US-04
- **Contexto / Bugs reportados:**
  - El ejercicio no se ve: `MathVisionUploader.jsx` sólo pinta `topic.title`; nunca renderiza `problemStatement`, y el `topic` por defecto en `App.jsx` no trae enunciado.
  - Captura duplicada: `App.jsx` monta `<MathVisionUploader>` **dos veces** cuando `activeTab === 'math-vision'` (L102–111 y L118–127).
  - Textos heredados de DevCoach sin sentido: pestaña "Coding Playground", filtros "Junior/Mid/Senior", tarjetas "Hard Skills (Técnico)", "Soft Skills (Voz)", "simulaciones", "Defensa y consultoría con stakeholders", "retos activos", "trade-offs omitidos".
- **Archivos esperados:** `client/src/App.jsx`, `client/src/components/MathVisionUploader.jsx`, `client/src/components/Dashboard.jsx`, nuevo `client/src/components/MathStatement.jsx`; eliminar `client/src/components/CodingPlayground.jsx`, `client/src/utils/codeRunner.js`, `client/src/utils/codeRunner.test.js`, `client/src/utils/monacoSetup.js`, dependencia `@monaco-editor/react`, `tests/e2e/coding-playground.spec.js`.
- **Criterios de Aceptación (AC):**
  1. `App.jsx` monta un único `MathVisionUploader`; existe test (Vitest) que verifica una sola instancia de `#btn-activate-camera` (o id equivalente) en la pestaña de captura.
  2. Nuevo componente `MathStatement.jsx` que renderiza Markdown + LaTeX con KaTeX (`react-markdown` + `remark-math` + `rehype-katex` + `katex/dist/katex.min.css`). Se muestra de forma prominente **encima** del área de captura con id `#problem-statement`.
  3. Si no hay ejercicio cargado (`!topic?.problemStatement`), se muestra un estado vacío claro ("No hay ejercicio cargado — elige un tema desde el Panel") en lugar de la cámara.
  4. Se elimina la pestaña y todo el código de "Coding Playground" (componente, utilidades, dependencia Monaco, spec E2E). Pestañas resultantes: **Entrenar** y **Panel**.
  5. Limpieza de copy en `Dashboard.jsx`: desaparecen el filtro Junior/Mid/Senior y las tarjetas Hard/Soft Skills; quedan sólo métricas matemáticas neutras ("Repasos pendientes", "Áreas críticas"). El rediseño completo llega en MATH-US-14.
  6. `grep -ri "junior\|senior\|soft skill\|hard skill\|coding playground\|stakeholder" client/src` no devuelve resultados.
  7. Tests de cliente y E2E existentes (no eliminados) en verde.

### [MATH-US-08] Modelo de Dominio Tema × Categoría × Dificultad + Purga de Backend Legado
- **Dependencias:** MATH-US-07
- **Contexto:** Hoy `MathTopic` mezcla "tema" y "ejercicio" y lleva el SRS por ejercicio con `level` 1/2/3 (y valores legados `junior/mid/senior`). El backend aún contiene `Topic.js`, `SessionLog.js`, `softSkillPractice`, `codingPractice`, `softSkillSparringService.js` y un `dashboardController` basado en hard/soft skills. Proyecto en desarrollo: **no se requiere migración de datos**, se re-siembra (MATH-US-09).
- **Modelos (Mongoose):**
  - `MathTopic` (reescrito): `{ slug (unique), title, area ('algebra'|'trigonometria'|'geometria'|'calculo'|'analisis'), source, order, description }`.
  - `Exercise` (nuevo): `{ topicId (ref), category ('technique'|'application'|'proof'), difficulty (1|2|3), order (Number, complejidad creciente), statement (Markdown+LaTeX, required), referenceSolution (String, para el evaluador), expertMinutes (Number > 0, required), source, timesServed (default 0), lastServedAt (Date|null), externalKey (unique, para seed idempotente) }`. Índice `{ topicId, category, difficulty, order }`.
  - `TopicTrack` (nuevo): `{ topicId (ref), category, difficulty (1..3, default 1), repetition, interval, efactor, dueDate, lastRoundScore, roundsCompleted }`. Índice único `{ topicId, category }`; índice `{ dueDate }`.
  - `Round` (nuevo): `{ trackId, topicId, category, difficulty, exercises: [{ exerciseId, order, statement, expertMinutes }], totalExpertMinutes, status ('pending'|'evaluated'), results: [{ exerciseId, score, feedback_paso_a_paso, hint }], roundScore, passRate, promoted, previousDifficulty, newDifficulty, createdAt, evaluatedAt }`.
  - Constantes compartidas: `server/src/config/categories.js` y `client/src/constants/categories.js` (`technique → "Técnica"`, `application → "Aplicación"`, `proof → "Demostración"`).
- **Purga:** eliminar `Topic.js`, `SessionLog.js`, `routes/softSkillPractice.js`, `routes/codingPractice.js`, `services/softSkillSparringService.js`, rutas/servicios de práctica de texto no matemáticos en `practice.js` y `geminiService.js`, y sus tests (`softSkillPractice.test.js`, `codingPractice.test.js`, `hint.test.js`, `topics.test.js`, `dashboard.test.js` legados) y specs E2E legados (`hard-skills`, `soft-skills`, `stratified-prompts`, `multilevel-catalog`, `scaffolding` si aplica). `routes/topics.js` se reescribe para `GET /api/topics` (lista de temas con sus 3 pistas).
- **Criterios de Aceptación (AC):**
  1. Los 4 modelos existen con validaciones defensivas (categorías y dificultades fuera de rango rechazadas; `expertMinutes > 0`; `statement` requerido) y tests en `server/tests/models.test.js`.
  2. Hook/servicio `ensureTracksForTopic(topicId)` crea idempotentemente las 3 pistas (dificultad 1, `dueDate = now`).
  3. `GET /api/topics` devuelve `[{ _id, slug, title, area, tracks: [{ category, difficulty, dueDate, lastRoundScore }] }]`.
  4. No queda ninguna referencia a `Topic.js`, `SessionLog`, `soft_skill`, `hard_skill`, `junior/mid/senior` en `server/src` (verificado con grep en el ticket).
  5. `dashboardController` queda temporalmente reducido a un stub compatible (se reescribe en MATH-US-14) o se elimina junto a su ruta si nada lo consume.
  6. `npm test` en verde.

### [MATH-US-09] Catálogo Curado de Ejercicios (Seed Idempotente)
- **Dependencias:** MATH-US-08
- **Contexto:** El catálogo es la materia prima de las rondas. Debe permitir **al menos 2 rondas distintas** por pista y dificultad respetando §1.1.
- **Archivos esperados:** `server/scripts/seed.js`, `server/seed-data/<topic-slug>.js` (un archivo por tema), script `"seed"` en `server/package.json` y raíz.
- **Criterios de Aceptación (AC):**
  1. `npm run seed` hace upsert por `slug` (temas) y `externalKey` (ejercicios); ejecutarlo dos veces no duplica nada. Crea las 3 pistas de cada tema vía `ensureTracksForTopic`.
  2. Mínimo **4 temas** (≥ 2 de álgebra CONAMAT, ≥ 2 de cálculo/análisis Stewart/Spivak), cada uno con las 3 categorías × 3 dificultades.
  3. Volumen mínimo por (tema, categoría, dificultad): Técnica ≥ 2 × 15 min de `expertMinutes` y ≥ 6 ejercicios; Aplicación ≥ 3; Demostración ≥ 2.
  4. `expertMinutes` realistas (guía: Técnica 1–5 min, Aplicación 5–15 min, Demostración 8–15 min) y `order` reflejando complejidad creciente (p. ej. en fracciones: una suma y un producto → combinaciones anidadas extensas).
  5. Todo enunciado en Markdown + LaTeX válido y con `referenceSolution`.
  6. Test `server/tests/catalog.test.js` que carga los datos del seed y verifica AC-2, AC-3 y que el constructor de rondas (cuando exista) puede formar 2 rondas por pista/dificultad.

### [MATH-US-10] Motor de Progresión Adaptativa (Dificultad + SRS por Pista)
- **Dependencias:** MATH-US-08
- **Contexto:** Lógica pura (sin Express ni Gemini) que implementa §1.2 y §1.3. TDD estricto.
- **Archivos esperados:** `server/src/config/progression.js`, `server/src/utils/progressionEngine.js`, `server/tests/progressionEngine.test.js`. Reutiliza `srsCalculator.js` (actualizar su JSDoc: rango 0–5, quitar "DevCoach").
- **Contrato:**
  ```js
  computeRoundOutcome({ scores: number[], track: { difficulty, repetition, interval, efactor } })
  // => { roundScore, passRate, promoted, newDifficulty, srs: { repetition, interval, efactor, dueDate } }
  ```
- **Criterios de Aceptación (AC):**
  1. `roundScore` = promedio a 1 decimal; `passRate` = proporción con score ≥ 3; `scores` vacío lanza error.
  2. Promoción exactamente según §1.2 (casos límite: 4.0 y 0.8 promueven; 3.9 o 0.79 no; dificultad 3 nunca sube).
  3. Efectos SRS exactamente según tabla §1.3 (fallo → reinicio 1 día; promoción → `repetition = 1`, intervalo `PROMOTION_INTERVAL_DAYS`; resto → SM-2 estándar).
  4. Nunca degrada la dificultad.
  5. Cobertura de tests ≥ 95 % del módulo.

### [MATH-US-11] Constructor de Rondas de 15 min + API de Rondas
- **Dependencias:** MATH-US-08
- **Contexto:** Implementa §1.1. Una ronda se crea para una pista y "congela" sus ejercicios (snapshot) para que la evaluación sea consistente.
- **Archivos esperados:** `server/src/services/roundBuilder.js`, `server/src/routes/rounds.js`, `server/tests/roundBuilder.test.js`, `server/tests/rounds.api.test.js`.
- **Contratos API:**
  - `GET /api/rounds/queue` → pistas vencidas (`dueDate <= now`) ordenadas por: menor `lastRoundScore` (null primero) y mayor retraso. `[{ trackId, topic: { _id, title, slug }, category, difficulty, dueDate, lastRoundScore }]`.
  - `POST /api/rounds` body `{ topicId, category }` → `201 { roundId, topic, category, difficulty, exercises: [{ exerciseId, order, statement, expertMinutes }], totalExpertMinutes, warning? }`. Si ya existe una ronda `pending` para la pista, la reutiliza (200).
  - `GET /api/rounds/:id` → ronda completa (incluye `results` si está evaluada).
- **Criterios de Aceptación (AC):**
  1. `buildRound(track)` respeta mínimos/máximos por categoría y el presupuesto de 15 min (tests con fixtures: ejercicios cortos → hasta 10; largos → 3; Aplicación de 15 min → 1; Demostración → siempre 1).
  2. Selecciona sólo de la dificultad actual de la pista, con la prioridad de §1.1, y devuelve los ejercicios ordenados por `order` asc.
  3. Al crear la ronda incrementa `timesServed` y fija `lastServedAt` de los ejercicios incluidos (rondas sucesivas rotan ejercicios).
  4. `warning: 'catalog_insufficient'` cuando no se alcanza el mínimo; `404` si el tema no existe; `400` si la categoría es inválida.
  5. Tests Supertest + MongoMemoryServer en verde.

### [MATH-US-12] Evaluación Multimodal de Rondas + Progresión
- **Dependencias:** MATH-US-10, MATH-US-11
- **Contexto:** El usuario resuelve **todos** los ejercicios de la ronda en su libreta y al final sube 1..N fotos (una página puede contener varios ejercicios). Gemini evalúa cada ejercicio por separado y el motor de progresión actualiza la pista. Reemplaza a `POST /api/evaluate-math` (se retira y sus tests se migran).
- **Archivos esperados:** `server/src/services/geminiService.js` (generalizar `evaluateMathVisionSolution` → `evaluateRoundSolutions`), `server/src/routes/rounds.js`, `server/tests/roundEvaluation.test.js`.
- **Contrato API:**
  - `POST /api/rounds/:id/evaluate` body `{ images: string[] (1..6, base64 JPEG) }`.
  - `200 { roundScore, passRate, promoted, previousDifficulty, newDifficulty, nextReviewAt, results: [{ exerciseId, order, score, feedback_paso_a_paso, hint }], overall_feedback }`.
  - `422 { error: 'exercises_not_found', missing: [order...] }` si Gemini no localiza algún ejercicio en las fotos (no persiste nada; la UI pide otra foto).
  - `409` si la ronda ya fue evaluada; `400` payload inválido; `502` fallo de IA.
- **Prompt:** recibe la lista numerada de enunciados + `referenceSolution`, y una rúbrica por **categoría** (Técnica: exactitud del cómputo y pasos algebraicos; Aplicación: planteamiento, modelado y uso correcto de teoremas; Demostración: validez deductiva, cuantificadores, hipótesis) ajustada por **dificultad**. Respuesta JSON forzada (`responseMimeType: 'application/json'`) `{ exercises: [{ order, found, score, feedback_paso_a_paso, hint }], overall_feedback }` con parsing defensivo.
- **Criterios de Aceptación (AC):**
  1. Validaciones de entrada y códigos de error según contrato.
  2. Persistencia atómica: `Round` (`status: 'evaluated'`, `results`, `roundScore`, `passRate`, `promoted`, dificultades) y `TopicTrack` (dificultad, SRS, `lastRoundScore`, `roundsCompleted`) usando `computeRoundOutcome`.
  3. Tests con Gemini mockeado cubriendo: promoción, permanencia, fallo (reinicio SRS), ejercicio no encontrado (422), JSON malformado (502).
  4. `/api/evaluate-math` eliminado sin referencias restantes en cliente ni servidor.

### [MATH-US-13] UI de Sesión de Ronda (RoundSession.jsx)
- **Dependencias:** MATH-US-12 (y MATH-US-09 para prueba manual con datos reales)
- **Contexto:** Pantalla principal de práctica. Sustituye el flujo de "un ejercicio = una foto".
- **Archivos esperados:** `client/src/components/RoundSession.jsx`, `client/src/components/RoundResults.jsx`, refactor de `MathVisionUploader.jsx` a componente de captura reutilizable (múltiples fotos), `client/src/App.jsx`, tests en `client/tests/`.
- **Criterios de Aceptación (AC):**
  1. Al entrar con `{ topicId, category }` llama `POST /api/rounds` y muestra encabezado: tema, categoría (etiqueta en español), dificultad (1–3) y tiempo de referencia ("Un experto lo resuelve en ~15 min").
  2. Lista numerada de enunciados con `MathStatement` (KaTeX), en el orden de la ronda (incremental). Cronómetro informativo opcional (no bloquea).
  3. Botón "Ya terminé, capturar" → captura 1..6 fotos (cámara o archivo) con miniaturas, posibilidad de borrar/añadir, y envío a `POST /api/rounds/:id/evaluate`.
  4. Manejo de `422`: indica qué ejercicios no se encontraron y permite añadir otra foto y reenviar.
  5. `RoundResults` muestra score por ejercicio con feedback y hint, `roundScore`, mensaje de progresión ("Subes a dificultad 2 en Técnica para el próximo repaso" / "Te mantienes en dificultad 1") y fecha del próximo repaso.
  6. Ids estables para E2E: `#round-header`, `#round-exercise-<order>`, `#btn-finish-round`, `#btn-submit-round`, `#round-results`, `#round-progression`.
  7. Tests Vitest con `fetch` mockeado para los estados: cargando, lista, captura, evaluando, 422, resultados.

### [MATH-US-14] Dashboard por Tema y Categoría
- **Dependencias:** MATH-US-13
- **Contexto:** Reemplaza MATH-US-05. Reescribe `Dashboard.jsx` y `dashboardController.js` alrededor de pistas.
- **Contrato API:** `GET /api/dashboard/summary` → `{ dueCount, dueByCategory: { technique, application, proof }, nextRecommended: { trackId, topic, category, difficulty } | null, criticalTracks: [{ topic, category, difficulty, lastRoundScore }] (lastRoundScore < 3), topics: [{ _id, title, area, tracks: [{ category, difficulty, dueDate, lastRoundScore }] }] }`.
- **Criterios de Aceptación (AC):**
  1. Tarjetas de repasos pendientes por categoría (Técnica / Aplicación / Demostración) con su conteo.
  2. Matriz Tema × Categoría: cada celda muestra dificultad actual (1–3, p. ej. indicador de 3 segmentos), fecha del próximo repaso y último score; clic en la celda inicia una ronda de esa pista.
  3. "Entrenar ahora" abre `RoundSession` con la pista recomendada (primera de `/api/rounds/queue`).
  4. Sección "Áreas críticas" con pistas `lastRoundScore < 3`.
  5. Sin textos heredados (verificación por grep como en MATH-US-07).
  6. Tests de controlador (Supertest) y de componente (Vitest).

### [MATH-US-15] Validación E2E Final + Documentación
- **Dependencias:** MATH-US-09, MATH-US-14
- **Criterios de Aceptación (AC):**
  1. Specs Playwright con backend real sobre BD sembrada y Gemini mockeado (variable de entorno o interceptor de red): (a) Panel → Entrenar ahora → ronda Técnica con 3–10 ejercicios visibles; (b) captura por archivo → resultados → promoción a dificultad 2 reflejada en el Panel; (c) ronda de Demostración con 1 solo ejercicio; (d) flujo 422 con foto adicional.
  2. Se eliminan specs E2E obsoletos (`math-vision.spec.js`, `dashboard.spec.js`, `smoke.spec.js` se actualizan o reemplazan).
  3. `npm run test:all` en verde.
  4. `docs/ARCHITECTURE.md` y `docs/USER_GUIDE.md` actualizados (skills `document-tech-specs` y `document-user-guide`) explicando categorías, dificultades, rondas de 15 min y su efecto en el SRS.
  5. `.antigravity/context.md` actualizado: título y stack sin referencias a Hard/Soft Skills ni Web Speech API.
