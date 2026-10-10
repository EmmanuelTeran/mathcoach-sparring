# [MATH-US-10] Motor de Progresión Adaptativa (Dificultad + SRS por Pista)

- **Estado:** Verificado
- **Rama:** `feature/MATH-US-10-progression-engine`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** 2026-10-09

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Arquitectónico y Razón de Cambio

Tras la culminación de [[MATH-US-08] Modelo de Dominio](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-08-domain-model.md) y [[MATH-US-09] Catálogo Curado de Ejercicios](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-09-curated-catalog.md), el ecosistema de **MathCoach Sparring** cuenta con un modelo de datos limpio y un catálogo con más de 132 ejercicios categorizados.

El siguiente paso crítico en la arquitectura es gobernar el progreso del estudiante mediante una lógica adaptativa de alta fidelidad. Para evitar el acoplamiento temprano entre las reglas pedagógicas y la capa de transporte HTTP (Express) o la capa de persistencia (Mongoose) o las llamadas a modelos de IA (Gemini Vision en [MATH-US-12](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md#L209-L224)), esta historia implementa el **Motor de Progresión Adaptativa** como un **módulo funcional puro**:

1. **Diseño Funcional Puro (Functional Core):** El motor no tiene efectos secundarios (side effects), no interactúa con bases de datos ni con endpoints de Express, y es 100% determinista, lo que facilita pruebas unitarias exhaustivas con TDD y tiempo de ejecución casi instantáneo.
2. **Centralización de Reglas de Negocio (§1.2 y §1.3):** Unifica los umbrales de promoción, cuotas de tiempo y parámetros de repetición espaciada en un archivo de configuración dedicado ([server/src/config/progression.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/config/progression.js)).
3. **Acoplamiento Preciso con SM-2 por Pista:** Determina simultáneamente la nueva dificultad (1, 2 o 3) y el nuevo estado de repetición espaciada (`repetition`, `interval`, `efactor`, `dueDate`) para la pista evaluada ([TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js)), garantizando que el material nuevo tras una promoción se repase pronto (`PROMOTION_INTERVAL_DAYS = 3`).

---

### 1.2 Configuración Centralizada de Constantes (`server/src/config/progression.js`)

Se crea el archivo [server/src/config/progression.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/config/progression.js) como la única fuente de verdad para los parámetros numéricos de progresión y composición de rondas:

```javascript
/**
 * Constantes y umbrales de progresión adaptativa y composición de rondas.
 * Fuente de verdad: .antigravity/graph.md (§1.1, §1.2, §1.3).
 */

/** Puntuación promedio mínima de ronda para aspirar a promoción (escala 0-5). */
export const PROMOTION_MIN_SCORE = 4.0;

/** Tasa mínima de aprobación (ejercicios con score >= 3) para aspirar a promoción. */
export const PROMOTION_MIN_PASS_RATE = 0.8;

/** Intervalo fijo de días para el primer repaso tras ascender de dificultad. */
export const PROMOTION_INTERVAL_DAYS = 3;

/** Presupuesto de tiempo experto en minutos por ronda de práctica. */
export const ROUND_BUDGET_MIN = 15;

/** Score mínimo considerado como ejercicio aprobado individualmente. */
export const EXERCISE_PASS_SCORE = 3;

/** Score mínimo considerado como ronda aprobada globalmente (evita reinicio SM-2). */
export const ROUND_PASS_SCORE = 3.0;

/** Dificultad mínima en el sistema. */
export const MIN_DIFFICULTY = 1;

/** Dificultad máxima en el sistema (tope adaptativo). */
export const MAX_DIFFICULTY = 3;

/** Límites de cantidad de ejercicios por categoría en una ronda (§1.1). */
export const CATEGORY_LIMITS = {
  technique: { min: 3, max: 10 },
  application: { min: 1, max: 3 },
  proof: { min: 1, max: 1 },
};
```

---

### 1.3 Contrato Funcional Estricto de `progressionEngine.js`

El módulo [server/src/utils/progressionEngine.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/utils/progressionEngine.js) exporta la función principal `computeRoundOutcome`:

```javascript
/**
 * Evalúa el resultado de una ronda y computa la nueva dificultad y el nuevo estado SRS.
 *
 * @param {Object} params
 * @param {number[]} params.scores - Calificaciones individuales de cada ejercicio en la ronda (rango 0 a 5).
 * @param {Object} params.track - Estado actual de la pista (TopicTrack).
 * @param {number} params.track.difficulty - Dificultad actual (1, 2 o 3).
 * @param {number} [params.track.repetition=0] - Repeticiones consecutivas previas.
 * @param {number} [params.track.interval=0] - Intervalo previo en días.
 * @param {number} [params.track.efactor=2.5] - Factor de facilidad SM-2 previo (mínimo 1.3).
 * @param {Date|number} [params.now=new Date()] - Instante base para el cómputo de dueDate (inyección para testing).
 * @returns {RoundOutcome}
 */
export function computeRoundOutcome({ scores, track, now = new Date() }) {
  // ... lógica pura ...
}
```

#### Estructura del Retorno (`RoundOutcome`):
```typescript
interface RoundOutcome {
  roundScore: number;        // Promedio aritmético redondeado a 1 decimal (ej. 4.3)
  passRate: number;          // Proporción de ejercicios con score >= 3 (ej. 0.857)
  promoted: boolean;         // true si asciende de dificultad para el próximo repaso
  newDifficulty: number;     // Nueva dificultad (1, 2 o 3; nunca menor a track.difficulty)
  srs: {
    repetition: number;      // Nueva etapa de repetición (0 en fallo, 1 en promoción, o SM-2 estándar)
    interval: number;        // Nuevo intervalo en días (1 en fallo, 3 en promoción, o SM-2 estándar)
    efactor: number;         // Factor de facilidad actualizado (>= 1.3)
    dueDate: Date;           // Fecha exacta del próximo repaso
  };
}
```

---

### 1.4 Lógica de Progresión y Adaptabilidad (§1.2 de `graph.md`)

1. **Validación Defensiva Exhaustiva:**
   - Si `scores` no es un arreglo o está vacío (`scores.length === 0`), se lanza `Error('scores must be a non-empty array of numbers')`.
   - Si algún elemento de `scores` no es numérico, es `NaN`, es menor que `0` o mayor que `5`, se lanza `Error('Each score must be a number between 0 and 5')`.
   - Si `track` no es un objeto o `track.difficulty` no pertenece al conjunto `{1, 2, 3}`, se lanza `Error('track.difficulty must be 1, 2, or 3')`.
2. **Cálculo de `roundScore`:**
   - Promedio de calificaciones redondeado formalmente a **1 decimal**:
     $$\text{roundScore} = \frac{\text{round}\left(\frac{\sum scores}{N} \times 10\right)}{10}$$
   - Casos frontera: `[4, 4, 4]` produce `4.0`; `[4, 4, 3]` produce `3.7`; `[4, 4, 5]` produce `4.3`.
3. **Cálculo de `passRate`:**
   - Proporción entre el número de ejercicios con `score >= 3` y el total de ejercicios:
     $$\text{passRate} = \frac{|\{s \in \text{scores} : s \ge 3\}|}{N}$$
4. **Regla de Promoción Estricta:**
   - Un usuario es promovido si y sólo si cumple las tres condiciones simultáneamente:
     $$\text{promoted} = (\text{track.difficulty} < 3) \land (\text{roundScore} \ge 4.0) \land (\text{passRate} \ge 0.8)$$
   - Si `track.difficulty === 3`, `promoted` es siempre `false` (tope de dificultad alcanzado).
5. **Regla de No-Degradación:**
   - La dificultad adaptativa **nunca disminuye** (`newDifficulty = promoted ? track.difficulty + 1 : track.difficulty`).
   - Un estudiante con dificultad 2 o 3 que obtenga calificaciones de 0 o 1 mantendrá su nivel de dificultad actual; la penalización ocurre en el intervalo y factor de facilidad de repetición espaciada (reinicio SM-2), no en un descenso de dificultad.

---

### 1.5 Acoplamiento Exacto con SM-2 por Pista (§1.3 de `graph.md`)

El motor integra y adapta el algoritmo SM-2 según la siguiente matriz de transiciones pedagógicas:

| Resultado de la Ronda | Condición Lógica | Efecto en Dificultad | Efecto en SRS (`srs`) | Justificación Pedagógica |
|---|---|---|---|---|
| **Fallo** | `roundScore < 3.0` | Se mantiene (`newDifficulty = track.difficulty`) | Reinicio SM-2: `repetition = 0`, `interval = 1` día, `dueDate = now + 1 día`. `efactor` ajustado con SM-2 sobre `Math.round(roundScore)`. | El concepto no fue retenido; requiere repaso correctivo al día siguiente. |
| **Aprobada sin Promoción** | `roundScore >= 3.0` y `!promoted` (p. ej. `roundScore < 4.0` o `passRate < 0.8`) | Se mantiene (`newDifficulty = track.difficulty`) | SM-2 estándar: delega a `calculateNextReview(track.repetition, track.efactor, Math.round(roundScore), track.interval)`. | El alumno progresa en la misma dificultad, espaciando repasos según su fluidez. |
| **Promoción** | `track.difficulty < 3` && `roundScore >= 4.0` && `passRate >= 0.8` | **Asciende:** `newDifficulty = track.difficulty + 1`, `promoted = true` | `repetition = 1`, `interval = PROMOTION_INTERVAL_DAYS` (3 días), `dueDate = now + 3 días`. `efactor` actualizado mediante SM-2 sobre `Math.round(roundScore)`. | Material nuevo en un nivel superior; requiere consolidación rápida inicial (3 días). Se preserva/premia el ease factor acumulado. |
| **Dificultad 3 con Alto Rendimiento** | `track.difficulty === 3` && `roundScore >= 4.0` | Se mantiene en tope (`newDifficulty = 3`, `promoted = false`) | SM-2 estándar: avanza a intervalos crecientes (6, 15, 30+ días) según su `efactor`. | El alumno domina el nivel máximo de la categoría; se consolidan intervalos largos de maestría. |

---

### 1.6 Mantenimiento y Saneamiento de `srsCalculator.js`

El archivo existente [server/src/utils/srsCalculator.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/utils/srsCalculator.js) funciona como motor SM-2 base. Esta historia incluye:
1. **Actualización de Documentación JSDoc:**
   - Garantizar que los parámetros y retorno estén tipados y documenten explícitamente el rango de notas `0–5`.
   - Documentar la equivalencia de propiedades retornadas (`repetition` / `srsStage`, `interval` / `intervalDays`, `efactor` / `easeFactor`, `dueDate` / `nextReviewAt`).
2. **Purga de Menciones Residuales a Prototipos Legados:**
   - Eliminar cualquier comentario residual o referencia histórica que aluda a "DevCoach".
3. **Preservación de Invariantes y Tests:**
   - Mantener total compatibilidad hacia atrás para que [server/tests/srsCalculator.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/srsCalculator.test.js) continúe ejecutándose 100% en verde.

---

## 2. Criterios de Aceptación (AC)

Los siguientes Criterios de Aceptación son los **estipulados textualmente en [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md)** para [MATH-US-10]:

### AC-1: Métricas de Ronda y Validación Defensiva
- [x] `roundScore` es igual al promedio aritmético de `scores`, redondeado estrictamente a 1 decimal.
- [x] `passRate` es igual a la proporción (entre 0.0 y 1.0) de ejercicios con calificación `score >= 3`.
- [x] Si `scores` es un arreglo vacío (`[]`), `null`, `undefined` o no es un arreglo, `computeRoundOutcome` lanza un `Error` descriptivo.
- [x] Si algún valor dentro de `scores` está fuera del rango numérico `[0, 5]` o no es un número finito, lanza un `Error` defensivo.
- [x] Si `track` no contiene una dificultad válida en `{1, 2, 3}`, lanza un `Error` defensivo.

### AC-2: Regla de Promoción Estricta y Casos Límite (§1.2)
- [x] Promueve a la siguiente dificultad (`promoted = true`, `newDifficulty = track.difficulty + 1`) si y sólo si:
  `track.difficulty < 3 && roundScore >= 4.0 && passRate >= 0.8`.
- [x] Caso límite exacto de borde: `roundScore = 4.0` y `passRate = 0.8` resultan en **promoción**.
- [x] Caso límite de rechazo por score: `roundScore = 3.9` con `passRate = 1.0` **no promueve** (`promoted = false`).
- [x] Caso límite de rechazo por passRate: `roundScore = 4.2` con `passRate = 0.75` **no promueve** (`promoted = false`).
- [x] Caso tope de dificultad: Si `track.difficulty === 3`, `promoted` es siempre `false` y `newDifficulty = 3`, aun con `roundScore = 5.0` y `passRate = 1.0`.

### AC-3: Acoplamiento SRS SM-2 por Pista (§1.3)
- [x] **Fallo de ronda (`roundScore < 3.0`):** La dificultad se mantiene, el SRS se reinicia con `repetition = 0`, `interval = 1` día y `dueDate = now + 1 día`.
- [x] **Promoción exitosa:** La dificultad sube en 1, `repetition = 1`, `interval = PROMOTION_INTERVAL_DAYS` (3 días) y `dueDate = now + 3 días`, preservando el `efactor` resultante del ajuste SM-2.
- [x] **Aprobada sin promoción (`roundScore >= 3.0` y `!promoted`):** La dificultad se mantiene y el cálculo delega al algoritmo SM-2 estándar según el historial de la pista.
- [x] **Dificultad 3 con score alto:** La dificultad se mantiene en 3 y el SRS aplica SM-2 estándar escalando intervalos a largo plazo.

### AC-4: Principio de No-Degradación
- [x] La dificultad devuelta (`newDifficulty`) nunca es inferior a la dificultad de entrada (`track.difficulty`), bajo ninguna combinación de notas (incluyendo rondas completas con scores de 0).

### AC-5: Cobertura de Pruebas Unitarias ≥ 95%
- [x] Se implementa la suite completa [server/tests/progressionEngine.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/progressionEngine.test.js) con Vitest.
- [x] La suite alcanza una cobertura de código (statements, branches, functions, lines) $\ge 95\%$ en el módulo `server/src/utils/progressionEngine.js` (17 pruebas exhaustivas pasando al 100%).
- [x] `npm test` en el backend ejecuta todas las suites (`progressionEngine.test.js`, `srsCalculator.test.js`, `models.test.js`, `catalog.test.js`, etc.) y permanece 100% en verde.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos Identificados en el Grafo de Conocimiento:**
  - `[MATH-US-10] Motor de Progresión Adaptativa (Dificultad + SRS por Pista)`
  - `server/src/config/progression.js`
  - `progressionEngine.js`, `computeRoundOutcome()`
  - `srsCalculator.js`, `calculateNextReview()`
  - `TopicTrack`, `TopicTrack.js`
  - `1.2 Score de ronda y progresión adaptativa`
  - `1.3 Acoplamiento con Spaced Repetition (SM-2 por pista)`
  - `server/tests/progressionEngine.test.js`
  - `server/tests/srsCalculator.test.js`

- **Archivos a Intervenir:**
  - **Nuevos:**
    - [server/src/config/progression.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/config/progression.js): Constantes centralizadas de progresión, rondas y límites por categoría.
    - [server/src/utils/progressionEngine.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/utils/progressionEngine.js): Motor funcional puro con `computeRoundOutcome`.
    - [server/tests/progressionEngine.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/progressionEngine.test.js): Suite unitaria exhaustiva con TDD.
  - **Modificados:**
    - [server/src/utils/srsCalculator.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/utils/srsCalculator.js): Saneamiento de JSDoc (rango 0–5) y eliminación de menciones residuales a prototipos legados.
    - [.antigravity/heartbeat.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/heartbeat.md): Actualización de rama activa y estado del ticket.

---

## 4. Estrategia de Pruebas TDD y Cobertura (≥ 95%)

### 4.1 Plan de Casos de Prueba Unitarios (`server/tests/progressionEngine.test.js`)

1. **Suite de Validación Defensiva:**
   - Llamada con `scores = []` → lanza `Error`.
   - Llamada con `scores = null`, `scores = undefined`, `scores = 'not-an-array'` → lanza `Error`.
   - Calificaciones fuera de rango: `scores = [-0.1]`, `scores = [5.1]`, `scores = [NaN]`, `scores = ['4']` → lanza `Error`.
   - Track ausente o incompleto: `track = null`, `track.difficulty = 0`, `track.difficulty = 4` → lanza `Error`.
2. **Suite de Cómputo de Métricas:**
   - Promedio exacto y redondeo: `[5, 5, 5] -> 5.0`; `[4, 4, 3] -> 3.7`; `[4, 4, 4, 4, 3] -> 3.8`.
   - Tasa de aprobación (`passRate`): `[5, 4, 3, 2, 1] -> 3/5 = 0.6`; `[3, 3, 3] -> 1.0`; `[2, 2] -> 0.0`.
3. **Suite de Promoción y Casos Límite:**
   - Frontera exacta de promoción: `roundScore = 4.0` (ej. `[4, 4, 4, 4, 4]`), `passRate = 1.0`, `difficulty = 1` → `promoted: true, newDifficulty: 2`.
   - Frontera exacta con `passRate = 0.8`: `[5, 5, 5, 5, 0]` (promedio 4.0, passRate 4/5 = 0.8) → `promoted: true`.
   - Rechazo por score a las puertas del umbral: promedio 3.9 (ej. `[4, 4, 4, 4, 3.5]`) → `promoted: false`.
   - Rechazo por passRate inferior: 3 aprobados de 4 (passRate 0.75) con promedio 4.25 → `promoted: false`.
   - Transiciones de dificultad:
     - De dificultad 1 a 2 con promoción.
     - De dificultad 2 a 3 con promoción.
     - En dificultad 3 con puntuación perfecta (`[5, 5, 5]`) → `promoted: false, newDifficulty: 3`.
4. **Suite de Acoplamiento SRS SM-2:**
   - **Caso Fallo (`roundScore < 3`):**
     - Desde `repetition = 4`, `interval = 15`: resultado `repetition: 0, interval: 1`, `dueDate` a 1 día de distancia.
     - `newDifficulty` permanece intacta.
   - **Caso Promoción:**
     - Resultado: `repetition: 1, interval: 3` (`PROMOTION_INTERVAL_DAYS`), `dueDate` a 3 días de distancia.
     - `efactor` actualizado positivamente por la buena nota.
   - **Caso Aprobado sin Promoción:**
     - En `repetition = 0`: avanza a `repetition: 1, interval: 1` (o según SM-2).
     - En `repetition = 1`: avanza a `repetition: 2, interval: 6`.
     - En `repetition = 2, interval = 6`: escala con `round(6 * efactor)`.
5. **Suite de No-Degradación:**
   - Dificultad 2 con scores en 0 (`[0, 0, 0]`) → `newDifficulty: 2`.
   - Dificultad 3 con scores en 0 (`[0]`) → `newDifficulty: 3`.

### 4.2 Comandos de Ejecución y Validación

```bash
# 1. Ejecutar tests unitarios del motor de progresión
npm --workspace=server test tests/progressionEngine.test.js

# 2. Ejecutar suite completa del backend
npm --prefix server test

# 3. Ejecutar suite completa de todo el monorepo
npm test
```

---

## 5. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios del Motor de Progresión (`server/tests/progressionEngine.test.js`)

```bash
$ npm --workspace=server test tests/progressionEngine.test.js

 RUN  v3.2.7 /home/teran/proyectos/mathcoach-sparring/server
 ✓ tests/progressionEngine.test.js (17 tests) 13ms
   ✓ progressionEngine - computeRoundOutcome (TDD Suite) (17)
     ✓ AC-1: Métricas de Ronda y Validación Defensiva (5)
       ✓ lanza error si scores no es un arreglo no vacío 3ms
       ✓ lanza error si algún score no es un número finito entre 0 y 5 2ms
       ✓ lanza error si track o track.difficulty es inválido 2ms
       ✓ calcula roundScore como promedio aritmético redondeado estrictamente a 1 decimal 1ms
       ✓ calcula passRate como proporción de ejercicios con score >= 3 0ms
     ✓ AC-2: Regla de Promoción Estricta y Casos Límite (§1.2) (5)
       ✓ promueve a dificultad 2 si difficulty=1, roundScore=4.0 y passRate=0.8 (caso frontera exacto) 1ms
       ✓ promueve de dificultad 2 a 3 cuando cumple las tres condiciones 0ms
       ✓ no promueve si roundScore < 4.0 aunque passRate = 1.0 (caso rechazo por score) 0ms
       ✓ no promueve si passRate < 0.8 aunque roundScore >= 4.0 (caso rechazo por passRate) 0ms
       ✓ en dificultad 3 nunca promueve (tope adaptativo) aun con puntuación perfecta 0ms
     ✓ AC-3: Acoplamiento SRS SM-2 por Pista (§1.3) (5)
       ✓ caso Fallo (roundScore < 3.0): reinicia SRS (repetition=0, interval=1, dueDate=+1d) y mantiene dificultad 0ms
       ✓ caso Promoción: repetition=1, interval=3, dueDate=+3d y efactor actualizado según nota redondeada 0ms
       ✓ caso Aprobada sin Promoción (roundScore >= 3.0 y !promoted): delega a SM-2 estándar 0ms
       ✓ usa valores por defecto para track cuando repetition, interval o efactor no se proveen 0ms
       ✓ funciona cuando now no se especifica explícitamente (usa Date.now()) 0ms
     ✓ AC-4: Principio de No-Degradación (2)
       ✓ mantiene dificultad 2 aunque todas las notas sean 0 0ms
       ✓ mantiene dificultad 3 aunque la nota sea 0 0ms

 Test Files  1 passed (1)
      Tests  17 passed (17)
```

### Suite Completa del Backend y Frontend (`npm test`)

```bash
$ npm test

> mathcoach-sparring@1.0.0 test
> npm run test:server && npm run test:client

> @mathcoach-sparring/server@1.0.0 test
> vitest run

 ✓ tests/topics.test.js (2 tests) 1481ms
 ✓ tests/models.test.js (19 tests) 1951ms
 ✓ tests/catalog.test.js (9 tests) 3083ms
 ✓ tests/srsCalculator.test.js (11 tests) 12ms
 ✓ tests/progressionEngine.test.js (17 tests) 23ms
 ✓ tests/practice.test.js (7 tests) 1257ms
 ✓ tests/health.test.js (1 test) 1063ms

 Test Files  7 passed (7)
      Tests  66 passed (66)

> @mathcoach-sparring/client@1.0.0 test
> vitest run

 ✓ tests/App.test.jsx (3 tests)
 ✓ tests/MathVisionUploader.test.jsx (11 tests)

 Test Files  2 passed (2)
      Tests  14 passed (14)
```

---

## 6. Commit de Cierre en dev

- **Estado:** Verificado (Listo para Merge)
- Rama de feature: `feature/MATH-US-10-progression-engine`

