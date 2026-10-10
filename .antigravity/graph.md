# Grafo de Implementación: MathCoach Sparring

> Fuente de verdad para `new-user-story` → `implement-story` → `verify-user-story`.
> Cada historia se ejecuta en `feature/MATH-US-XX-<slug>` desde `dev` y genera `tickets/MATH-US-XX-<slug>.md`.

## 0. Glosario y Modelo Mental del Producto

| Término | Definición |
|---|---|
| **Tema** (`MathTopic`) | Unidad de contenido curricular (p. ej. "Fracciones algebraicas", "Límites y continuidad"). Tiene `slug`, `title`, `area`, `source`. |
| **Categoría** | Dimensión pedagógica del ejercicio. Valores fijos: **Técnica** (`technique`), **Aplicación** (`application`), **Demostración** (`proof`). |
| **Dificultad** | Escalón adaptativo numérico (**1, 2, 3**) **dentro** de cada categoría. Sube según el desempeño de la ronda. |
| **Pista** (`TopicTrack`) | Par único *Tema × Categoría*. Es la unidad atómica que mantiene **SRS SM-2 y dificultad actual**. Cada tema posee exactamente 3 pistas. |
| **Ejercicio** (`Exercise`) | Enunciado concreto de libreta (Markdown + LaTeX KaTeX) asociado a tema, categoría y dificultad, con `expertMinutes` (> 0) y `order` (complejidad creciente). |
| **Ronda** (`Round`) | Sesión de práctica en libreta física evaluada en bloque. Snapshot inmutable de ejercicios. En Hito 1: ~15 min; en Hito 2: **~30 min** para Técnica y Aplicación. |
| **Tiempo experto** (`expertMinutes`) | Minutos estimados que tarda un docente o estudiante avanzado en resolver el ejercicio con rigor. Base para componer rondas balanceadas. |

---

## 1. Reglas de Negocio Globales

### 1.1 Composición de rondas (Evolución Hito 2: Rondas de 30 min)

A partir de **Hito 2 (MATH-US-16)**, el tiempo de referencia para alguien que domina el tema se calibra a **30 minutos de tiempo experto** para Técnica y Aplicación (`TECHNIQUE_BUDGET_MIN = 30`, `APPLICATION_BUDGET_MIN = 30`), manteniendo Demostración en un ejercicio reflexivo profundo (`PROOF_BUDGET_MIN = 15`):

| Categoría | Presupuesto (`expertMinutes`) | Mín. ejercicios | Máx. ejercicios | Regla de Selección |
|---|---|---|---|---|
| **Técnica** | **30 min** | 6 | 18 | Acumular `expertMinutes` hasta alcanzar $\ge 30$ o llegar al máximo (18). |
| **Aplicación** | **30 min** | 2 | 6 | Acumular `expertMinutes` hasta alcanzar $\ge 30$ o llegar al máximo (6). |
| **Demostración** | **15 min** | 1 | 1 | Siempre un único ejercicio deductivo profundo por ronda. |

- Se toman ejercicios de la **dificultad actual** de la pista (`track.difficulty`).
- Prioridad de selección (Rotación Justa): menos veces servido (`timesServed` asc) → más antiguo (`lastServedAt` asc) → `order` asc.
- Los ejercicios seleccionados se presentan ordenados por `order` ascendente (dificultad incremental dentro de la ronda de libreta).
- Si el catálogo no alcanza el mínimo, se sirve lo disponible ($\ge 1$) y la respuesta incluye `warning: 'catalog_insufficient'`.
- **Regla de suficiencia del catálogo (Seed 2.0):** Para permitir al menos 2 rondas disjuntas completas por celda (tema × dificultad):
  - Técnica: $\ge 60$ min acumulados y $\ge 12$ ejercicios.
  - Aplicación: $\ge 60$ min acumulados y $\ge 4$ ejercicios.
  - Demostración: $\ge 2$ ejercicios.

### 1.2 Score de ronda y progresión adaptativa

- Cada ejercicio recibe un score `0–5`. `roundScore = promedio` (1 decimal). `passRate = % de ejercicios con score ≥ 3`.
- **Promoción** (sube dificultad para el próximo repaso): `difficulty < 3 && roundScore >= 4.0 && passRate >= 0.8`.
- **Permanencia:** cualquier otro caso. **No hay degradación** de dificultad.
- Umbrales centralizados en `server/src/config/progression.js` (`PROMOTION_MIN_SCORE = 4.0`, `PROMOTION_MIN_PASS_RATE = 0.8`, `PROMOTION_INTERVAL_DAYS = 3`, presupuestos por categoría, cuotas).

### 1.3 Acoplamiento con Spaced Repetition (SM-2 por pista)

| Resultado de la ronda | Efecto en dificultad | Efecto en SRS |
|---|---|---|
| `roundScore < 3` (fallo) | Se mantiene | Reinicio SM-2: `repetition = 0`, intervalo 1 día. |
| Aprobada sin promoción | Se mantiene | SM-2 estándar (`calculateNextReview` con `round(roundScore)`). |
| Promoción | `difficulty + 1` | `repetition = 1`, intervalo fijo `PROMOTION_INTERVAL_DAYS` (3) — material nuevo, repaso pronto. `efactor` se conserva del cálculo SM-2. |
| Dificultad 3 con score alto | Se mantiene (tope) | SM-2 estándar → intervalos largos (consolidación de maestría). |

---

## 2. Grafo de Dependencias

```text
[HITO 1: Cimiento Funcional y Flujo de Rondas]
[MATH-US-01: Limpieza Legada y Renombrado Monorepo]                       ✅ Done
└──> [MATH-US-02: Modelo MathTopic y Motor SRS SM-2]                      ✅ Done
     └──> [MATH-US-03: UI Cero Fricción (MathVisionUploader.jsx)]         ✅ Done
          └──> [MATH-US-04: Pipeline Evaluador Multimodal + SRS]          ✅ Done
               └──> [MATH-US-07: Hotfix UI: Enunciado y Captura Única]    ✅ Done
                    └──> [MATH-US-08: Modelo Tema × Categoría × Dificultad] ✅ Done
                         ├──> [MATH-US-09: Catálogo Curado (Seed 1.0)]    ✅ Done
                         ├──> [MATH-US-10: Motor de Progresión Adaptativa] ✅ Done
                         └──> [MATH-US-11: Constructor de Rondas + API]   ✅ Done
                                   │            (MATH-US-10 + MATH-US-11)
                                   └──> [MATH-US-12: Evaluación Multimodal Rondas] ✅ Done
                                        └──> [MATH-US-13: UI Sesión RoundSession]  ✅ Done
                                             └──> [MATH-US-14: Dashboard de Pistas] ✅ Done
                                                  └──> [MATH-US-15: Validación E2E + Docs] ✅ Done

[HITO 2: Rondas de 30 Minutos, Expansión Curricular y Potenciadores Cognitivos]
[MATH-US-15: Cierre Hito 1] ✅ Done
└──> [MATH-US-16: Calibración de Rondas a 30 min (Técnica y Aplicación)]
     ├──> [MATH-US-17: Expansión Curricular (4 Nuevos Temas)]
     │    └──> [MATH-US-18: Banco Masivo de Ejercicios Curados (Seed 2.0)]
     ├──> [MATH-US-19: Diagnóstico Quirúrgico de Errores y Prerrequisitos Rotos]
     ├──> [MATH-US-20: Rondas Intercaladas (Interleaving Mode Multitema)] (requiere MATH-US-18)
     └──> [MATH-US-21: Sistema de Pistas Escalonadas Socráticas (3-Tier Hints)]
```

### 2.1 Orden de ejecución de Hito 2

| # | Historia | Depende de | Paralelizable con | Estado |
|---|---|---|---|---|
| 16 | MATH-US-16 (Rondas de 30 min) | 15 | — | Backlog |
| 17 | MATH-US-17 (4 Nuevos Temas) | 16 | 19, 21 | Backlog |
| 18 | MATH-US-18 (Banco Masivo Seed 2.0) | 16, 17 | 19, 21 | Backlog |
| 19 | MATH-US-19 (Diagnóstico de Errores) | 16 | 17, 18, 21 | Backlog |
| 20 | MATH-US-20 (Rondas Intercaladas) | 18 | 19, 21 | Backlog |
| 21 | MATH-US-21 (Pistas Escalonadas) | 16 | 17, 18, 19 | Backlog |

---

## 3. Historias Completadas (Hito 1)

### [MATH-US-01] Limpieza de Base Legada y Renombrado Monorepo
- **Estado:** ✅ Done (2026-10-09)
- Monorepo renombrado a `mathcoach-sparring`. Purga de componentes y rutas legadas de DevCoach.

### [MATH-US-02] Modelo de Datos MathTopic y Motor SRS SM-2
- **Estado:** ✅ Done (2026-10-09)
- Modelo curricular inicial y motor matemático SM-2 en escala 0–5 con tests unitarios.

### [MATH-US-03] UI de Cero Fricción para Active Recall (MathVisionUploader.jsx)
- **Estado:** ✅ Done (2026-10-09)
- Captura WebRTC en vivo con selector de cámaras, fallback a subida de archivos y feedback visual.

### [MATH-US-04] Pipeline Evaluador Multimodal y Actualización SRS
- **Estado:** ✅ Done (2026-10-09)
- Endpoint inicial con Gemini 1.5 Pro y persistencia de calificaciones.

### [MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes
- **Estado:** ✅ Done (2026-10-09)
- Render KaTeX con `MathStatement.jsx`, eliminación de duplicidad de montado y purga de copy no matemático.

### [MATH-US-08] Modelo de Dominio Tema × Categoría × Dificultad + Purga Backend
- **Estado:** ✅ Done (2026-10-09)
- Cuatro modelos formales Mongoose: `MathTopic`, `Exercise`, `TopicTrack`, `Round`. Índices compuestos y purga total de código legado.

### [MATH-US-09] Catálogo Curado de Ejercicios (Seed 1.0)
- **Estado:** ✅ Done (2026-10-09)
- 4 temas universitarios con las 3 categorías × 3 dificultades. 132 ejercicios iniciales validados con suite de auditoría estricta (`catalog.test.js`).

### [MATH-US-10] Motor de Progresión Adaptativa (Dificultad + SRS por Pista)
- **Estado:** ✅ Done (2026-10-09)
- Lógica pura determinista en `progressionEngine.js`: promociones con score $\ge 4.0$ y passRate $\ge 0.8$, permanencia sin degradación y reinicio en fallos.

### [MATH-US-11] Constructor de Rondas de 15 min + API de Rondas
- **Estado:** ✅ Done (2026-10-09)
- `roundBuilder.js` con algoritmo de selección equitativa (`timesServed`, `lastServedAt`, `order`), snapshot inmutable de ejercicios y cola de repaso prioritario (`/api/rounds/queue`).

### [MATH-US-12] Evaluación Multimodal de Rondas + Progresión
- **Estado:** ✅ Done (2026-10-09)
- Evaluación multimodal en bloque (1–6 fotos de libreta) mediante Gemini con rúbricas rigurosas por categoría, respuesta 422 para ejercicios no localizados y persistencia atómica.

### [MATH-US-13] UI de Sesión de Ronda (RoundSession.jsx)
- **Estado:** ✅ Done (2026-10-09)
- Máquina de estados completa para la sesión de práctica: visualización ordenada de enunciados, cronómetro informativo, subida multifoto y desglose de resultados por ejercicio.

### [MATH-US-14] Dashboard por Tema y Categoría
- **Estado:** ✅ Done (2026-10-09)
- Panel de control universitario con matriz Tema × Categoría, métricas de pistas pendientes, botón de acción rápida "Entrenar ahora" y sección de áreas críticas.

### [MATH-US-15] Validación E2E Final + Documentación
- **Estado:** ✅ Done (2026-10-09)
- Suite Playwright completa, actualización de `ARCHITECTURE.md` y `USER_GUIDE.md`, y cierre exitoso del Hito 1.

---

## 4. Historias Pendientes (Hito 2: Backlog)

### [MATH-US-16] Calibración de Rondas a 30 Minutos (Técnica y Aplicación)
- **Dependencias:** MATH-US-15
- **Contexto:** Actualmente las rondas tienen un presupuesto de 15 min de tiempo experto (`ROUND_BUDGET_MIN = 15`). Para un entrenamiento más profundo y representativo de sesiones de estudio universitario en libreta, el presupuesto para las categorías **Técnica** y **Aplicación** se amplía a **30 minutos de tiempo experto**. Demostración se mantiene en 15 min (1 ejercicio reflexivo profundo).
- **Archivos esperados:** `server/src/config/progression.js`, `server/src/services/roundBuilder.js`, `server/tests/roundBuilder.test.js`, `server/tests/rounds.api.test.js`, `client/src/components/RoundSession.jsx`, `client/tests/RoundSession.test.jsx`.
- **Criterios de Aceptación (AC):**
  1. `server/src/config/progression.js` define presupuestos por categoría:
     - `ROUND_BUDGETS = { technique: 30, application: 30, proof: 15 }`.
     - `CATEGORY_LIMITS = { technique: { min: 6, max: 18 }, application: { min: 2, max: 6 }, proof: { min: 1, max: 1 } }`.
  2. `roundBuilder.js` (`selectExercisesForRound`) utiliza el presupuesto respectivo de la categoría (`ROUND_BUDGETS[category]`):
     - Para Técnica: acumula hasta sumar $\ge 30$ min de `expertMinutes` y al menos 6 ejercicios (hasta un máximo de 18).
     - Para Aplicación: acumula hasta sumar $\ge 30$ min de `expertMinutes` y al menos 2 ejercicios (hasta un máximo de 6).
     - Para Demostración: selecciona exactamente 1 ejercicio.
  3. Si la base no alcanza el mínimo requerido, se devuelven los ejercicios disponibles ($\ge 1$) con `warning: 'catalog_insufficient'`.
  4. La UI de `RoundSession.jsx` actualiza dinámicamente el mensaje informativo en `#round-header`:
     - Técnica y Aplicación: *"Un experto lo resuelve en ~30 min (N ejercicios)"*.
     - Demostración: *"Un experto lo resuelve en ~15 min (1 ejercicio)"*.
  5. Tests unitarios y de integración de backend y frontend actualizados y pasando al 100%.

### [MATH-US-17] Expansión Curricular: Cuatro Nuevos Temas Matemáticos
- **Dependencias:** MATH-US-16
- **Contexto:** Actualmente el catálogo cuenta con 4 temas (2 de álgebra y 2 de cálculo). Para ampliar el espectro de preparación universitaria, se incorporan 4 temas fundamentales adicionales, abarcando Álgebra, Trigonometría, Cálculo Integral y Geometría Analítica.
- **Nuevos Temas y Fuentes Curriculares:**
  1. **Ecuaciones y Sistemas Lineales** (`slug: 'ecuaciones-sistemas-lineales'`, `area: 'algebra'`, fuente: CONAMAT / Baldor): Ecuaciones lineales, cuadráticas por fórmula y factorización, sistemas 2×2 y 3×3, problemas de mezclas y cinemática.
  2. **Identidades y Ecuaciones Trigonométricas** (`slug: 'trigonometria-identidades'`, `area: 'trigonometria'`, fuente: Granville / CONAMAT): Identidades pitagóricas y cocientes, suma/resta de ángulos, ecuaciones trigonométricas en $[0, 2\pi)$ y modelado periódico.
  3. **Técnicas de Integración Indefinida** (`slug: 'tecnicas-integracion'`, `area: 'calculo'`, fuente: Stewart / Thomas): Integrales inmediatas y por sustitución algebraica, integración por partes y sustitución trigonométrica básica.
  4. **Geometría Analítica: Secciones Cónicas y Vectores** (`slug: 'geometria-analitica-conicas'`, `area: 'geometria'`, fuente: Lehmann / Larson): Ecuaciones canónicas y generales de circunferencia, parábola y elipse; vectores en $\mathbb{R}^2$ y producto punto.
- **Archivos esperados:** `server/seed-data/ecuaciones-sistemas-lineales.js`, `server/seed-data/trigonometria-identidades.js`, `server/seed-data/tecnicas-integracion.js`, `server/seed-data/geometria-analitica-conicas.js`, actualización de `server/seed-data/index.js`.
- **Criterios de Aceptación (AC):**
  1. Cada archivo exporta la estructura canónica con `slug`, `metadata` completo (`title`, `area`, `source`, `order`, `description`) y array `exercises`.
  2. Cada tema define sus 9 celdas (3 categorías × 3 dificultades).
  3. `curatedTopics` en `server/seed-data/index.js` incluye los 8 temas en total.
  4. `npm run seed` inserta idempotentemente los nuevos temas y genera sus 3 pistas (`TopicTrack`) por tema con dificultad 1 y `dueDate = now`.

### [MATH-US-18] Banco Curado Masivo de Ejercicios (Seed 2.0 y Auditoría)
- **Dependencias:** MATH-US-16, MATH-US-17
- **Contexto:** Para soportar rondas de 30 minutos sin repetición inmediata (respetando la regla de al menos 2 rondas disjuntas completas por celda adaptativa), el volumen de ejercicios curados debe crecer sustancialmente tanto en los 4 temas previos como en los 4 nuevos temas.
- **Cuotas mínimas por celda (Tema × Dificultad):**
  - **Técnica:** $\ge 60$ minutos acumulados de `expertMinutes` y $\ge 12$ ejercicios (rango 1–5 min por ejercicio).
  - **Aplicación:** $\ge 60$ minutos acumulados de `expertMinutes` y $\ge 4$ ejercicios (rango 6–15 min por ejercicio).
  - **Demostración:** $\ge 2$ demostraciones formales completas (rango 8–15 min por demostración).
- **Archivos esperados:** Actualización de los 8 archivos en `server/seed-data/`, actualización de `server/tests/catalog.test.js`.
- **Criterios de Aceptación (AC):**
  1. Todos los ejercicios cuentan con `externalKey` canónico único (`<slug>-(tech|app|proof)-d<1-3>-<order>`), `order` secuencial estricto sin saltos, enunciado en Markdown + KaTeX balanceado y `referenceSolution` exhaustiva paso a paso.
  2. Cada celda de los 8 temas cumple las nuevas cuotas de volumen (Técnica $\ge 60$ min y $\ge 12$ ejercicios; Aplicación $\ge 60$ min y $\ge 4$ ejercicios; Demostración $\ge 2$ ejercicios).
  3. `server/tests/catalog.test.js` simula la construcción de 2 rondas disjuntas completas de 30 min por cada celda de Técnica y valida la intersección vacía de ejercicios.
  4. `npm run seed` ejecuta de forma limpia e idempotente sin alterar el progreso SM-2 de pistas preexistentes.

### [MATH-US-19] Diagnóstico Quirúrgico de Errores y Prerrequisitos Rotos
- **Dependencias:** MATH-US-16
- **Contexto:** Al fallar un ejercicio en la libreta, la mayor causa de desmotivación es no saber si el error fue por no entender el tema o por arrastrar una deficiencia de álgebra básica. Esta historia enriquece la evaluación multimodal de Gemini con una taxonomía de errores que detecta lagunas de prerrequisitos y recomienda acciones de remediación.
- **Taxonomía de Errores Formativa:**
  - `prerequisite_algebra`: Tropezón en manipulación elemental (signos, leyes de exponentes, factorización básica, simplificación de fracciones).
  - `conceptual_topic`: Comprensión errónea de la regla o teorema central (ej. olvidar la regla de la cadena, aplicar mal L'Hôpital, confundir identidades).
  - `rigor_notation`: Omisión de condiciones de validez, cuantificadores, dominio, notación de límite o constantes $+C$.
- **Archivos esperados:** `server/src/services/geminiService.js`, `server/src/models/Round.js`, `client/src/components/RoundResults.jsx`, `client/src/components/Dashboard.jsx`.
- **Criterios de Aceptación (AC):**
  1. El prompt de evaluación multimodal en `geminiService.js` exige clasificar cualquier ejercicio con score $< 4$ con `error_type: 'prerequisite_algebra' | 'conceptual_topic' | 'rigor_notation' | 'none'`.
  2. El modelo `Round.results` almacena `error_type` por ejercicio.
  3. `RoundResults.jsx` muestra un badge visual distintivo por cada tipo de error junto a una explicación concisa.
  4. Si una ronda acumula 2 o más errores de tipo `prerequisite_algebra`, se presenta un banner inteligente sugiriendo una ronda rápida en el tema base (ej. "Recomendación: practica una ronda técnica de Factorización antes de tu próximo repaso de Derivadas").

### [MATH-US-20] Rondas Intercaladas ("Interleaving Mode" / Práctica Mixta Multitema)
- **Dependencias:** MATH-US-18
- **Contexto:** La ciencia del aprendizaje demuestra que la práctica en bloque (hacer solo derivadas) crea ilusión de competencia. En exámenes reales no se indica qué técnica usar. Esta historia implementa un modo de práctica intercalada (Interleaving) que selecciona ejercicios de temas diversos ya desbloqueados por el estudiante para entrenar la discriminación de problemas.
- **Archivos esperados:** `server/src/services/roundBuilder.js`, `server/src/routes/rounds.js`, `client/src/components/Dashboard.jsx`, `client/src/components/RoundSession.jsx`.
- **Criterios de Aceptación (AC):**
  1. Endpoint `POST /api/rounds/interleaved`: genera una ronda combinando ejercicios de al menos 2 temas que tengan dificultad $\ge 1$.
  2. Distribución equilibrada de ejercicios respetando el presupuesto de 30 minutos de tiempo experto.
  3. La evaluación multimodal califica cada ejercicio y actualiza de manera atómica el SRS y las estadísticas de cada pista correspondiente.
  4. En el Dashboard se agrega un botón accesible *"Ronda Intercalada (Desafío Multitema)"*.

### [MATH-US-21] Sistema de Pistas Escalonadas Socráticas (3-Tier Hint Scaffolding)
- **Dependencias:** MATH-US-16
- **Contexto:** En una sesión de libreta de 30 minutos, quedarse atascado en un paso suele llevar a abandonar la sesión o buscar la respuesta completa. Un sistema de pistas escalonadas bajo demanda permite al estudiante desbloquearse preservando el esfuerzo cognitivo.
- **Niveles de Pista:**
  - Nivel 1 (Principio rector): Recuerda el teorema o identidad aplicable sin revelar el procedimiento.
  - Nivel 2 (Primer paso clave): Sugiere el cambio de variable o la descomposición inicial.
  - Nivel 3 (Estrategia global): Esquematiza el camino de resolución en 3 viñetas.
- **Archivos esperados:** `server/src/models/Exercise.js`, `client/src/components/RoundSession.jsx`, tests en backend y frontend.
- **Criterios de Aceptación (AC):**
  1. Cada ejercicio en el catálogo puede incluir `hints: [tier1, tier2, tier3]`.
  2. En `RoundSession.jsx`, cada ejercicio tiene un acordeón colapsable con confirmación explícita para revelar pistas progresivas.
  3. Se registra en la ronda si se solicitaron pistas para ese ejercicio (`hintsUsed: number`).
  4. La evaluación de Gemini toma en cuenta las pistas consultadas como factor formativo.
