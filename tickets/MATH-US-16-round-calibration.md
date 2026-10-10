# [MATH-US-16] Calibración de Rondas a 30 Minutos (Técnica y Aplicación)

- **Estado:** En Progreso
- **Rama:** `feature/MATH-US-16-round-calibration`
- **Fecha de Inicio:** 2026-10-10
- **Fecha de Cierre:** -

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Arquitectónico y Razón de Cambio (Apertura del Hito 2)

Durante el **Hito 1**, MathCoach Sparring implementó el modelo de dominio adaptativo (*Tema × Categoría × Dificultad*), el motor de repetición espaciada SM-2, la evaluación multimodal multifoto con Gemini 1.5 Pro y una suite E2E completa. En dicha etapa, las rondas de práctica contaban con un presupuesto uniforme de 15 minutos de tiempo experto (`ROUND_BUDGET_MIN = 15`) para todas las categorías.

Para el **Hito 2**, la investigación pedagógica y el diseño instruccional del entrenamiento deliberado para carreras STEM requieren elevar la profundidad cognitiva y la representatividad de las sesiones en libreta física:
1. **Representatividad de la Sesión de Estudio Universitario:** Resolver 3 problemas de cálculo o álgebra elemental en 15 minutos resulta insuficiente para consolidar fluidez procedimental. Las sesiones reales de estudio en biblioteca/escritorio suelen estructurarse en bloques de ~30 a 45 minutos de concentración continua.
2. **Diferenciación de Categorías por Densidad Cognitiva:**
   - **Técnica:** Requiere repetición intensiva de patrones (drill deliberado). Con ejercicios de 1 a 5 minutos, un bloque de **30 minutos de tiempo experto** permite resolver entre **6 y 18 ejercicios**, logrando automatización motriz y reconocimiento de patrones.
   - **Aplicación:** Problemas contextualizados y modelos verbales de dificultad media/alta (5 a 15 min por problema). Un presupuesto de **30 minutos de tiempo experto** permite resolver entre **2 y 6 problemas estructurados** de forma balanceada.
   - **Demostración:** Mantiene su naturaleza de análisis reflexivo formal profundo: exactamente **1 demostración formal (15 min)** para evitar sobrecarga o fatiga deductiva.

---

### 1.2 Nuevas Reglas de Presupuesto y Límites por Categoría

En [server/src/config/progression.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/config/progression.js), se reemplaza la constante escalar fija `ROUND_BUDGET_MIN` como única fuente de verdad por un diccionario explícito por categoría `ROUND_BUDGETS`, actualizando además `CATEGORY_LIMITS`:

```javascript
/** Presupuestos de tiempo experto en minutos por categoría (§1.1 de graph.md). */
export const ROUND_BUDGETS = {
  technique: 30,
  application: 30,
  proof: 15,
};

/** Límites de cantidad de ejercicios por categoría en una ronda (§1.1 de graph.md). */
export const CATEGORY_LIMITS = {
  technique: { min: 6, max: 18 },
  application: { min: 2, max: 6 },
  proof: { min: 1, max: 1 },
};
```

*(Nota de retrocompatibilidad: se preserva `export const ROUND_BUDGET_MIN = 15;` para no romper referencias accesorias o consumidores legados).*

---

### 1.3 Adaptación Algorítmica de Selección (`roundBuilder.js`)

El servicio puro [server/src/services/roundBuilder.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/roundBuilder.js) adapta su método `selectExercisesForRound(candidates, category)` para evaluar la acumulación temporal con respecto al presupuesto específico `ROUND_BUDGETS[category]`:

1. **Priorización previa inalterada:**
   - Se mantiene el orden de selección justa por `timesServed ASC` $\to$ `lastServedAt ASC` (`null` primero) $\to$ `order ASC`.
2. **Criterios de parada por categoría:**
   - **Demostración (`proof`):** Exactamente **1 ejercicio** profundo. La iteración se detiene tras incorporar el primer ejercicio seleccionado.
   - **Aplicación (`application`):** Acumula ejercicios hasta sumar $\ge 30$ minutos de `expertMinutes` **Y** alcanzar al menos el mínimo de 2 ejercicios. El tope absoluto es de 6 ejercicios (`limits.max = 6`).
   - **Técnica (`technique`):** Acumula ejercicios hasta sumar $\ge 30$ minutos de `expertMinutes` **Y** alcanzar al menos el mínimo de 6 ejercicios. El tope absoluto es de 18 ejercicios (`limits.max = 18`).
3. **Orden final de entrega:**
   - Los ejercicios seleccionados se devuelven ordenados ascendentemente por `order ASC` para garantizar progresión didáctica continua.
4. **Resiliencia ante Catálogo Insuficiente (`catalog_insufficient`):**
   - Si la cantidad de ejercicios disponibles para la categoría y dificultad actual es menor al mínimo requerido (`selected.length < limits.min`), pero existe al menos 1 ejercicio ($\ge 1$), se retornan los ejercicios disponibles acompañados del metadato `warning: 'catalog_insufficient'`.
   - Si no existe ningún candidato (0 ejercicios), se mantiene el lanzamiento de error HTTP 422 (`No exercises available for this track`).

---

### 1.4 Adaptación de la Experiencia de Usuario en `RoundSession.jsx`

En [client/src/components/RoundSession.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/RoundSession.jsx), el encabezado `#round-header` comunica con claridad la expectativa de tiempo y carga de trabajo al estudiante antes de comenzar a escribir en su libreta:

- **Lógica condicional del mensaje informativo:**
  - Para **Técnica** y **Aplicación**:  
    `"Un experto lo resuelve en ~30 min (N ejercicios)"` (donde $N$ es `roundData.exercises.length`).
  - Para **Demostración**:  
    `"Un experto lo resuelve en ~15 min (1 ejercicio)"` (con concordancia gramatical singular exacta `"1 ejercicio"`).

---

### 1.5 Estrategia de Pruebas Unitarias y de Integración

1. **Backend Unitario ([server/tests/roundBuilder.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/roundBuilder.test.js)):**
   - Actualizar fixtures y aserciones para Técnica: acumulación hasta $\ge 30$ min y mínimo de 6 ejercicios; detención en tope de 18 ejercicios con problemas de 1 min.
   - Actualizar fixtures y aserciones para Aplicación: acumulación hasta $\ge 30$ min y mínimo de 2 ejercicios; tope de 6 ejercicios.
   - Validar Demostración: se mantiene en 1 ejercicio y ~15 min.
   - Validar advertencia `catalog_insufficient` con conteos inferiores a 6 (Técnica) y 2 (Aplicación).
2. **Backend Integración ([server/tests/rounds.api.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/rounds.api.test.js)):**
   - Adaptar los tests de `POST /api/rounds` que crean fixtures en memoria para sembrar al menos 6 ejercicios de técnica y validar `round.exercises.length >= 6`, `totalExpertMinutes >= 30` sin advertencia.
   - Validar caso de `catalog_insufficient` sembrando 2 ejercicios en técnica (menor al nuevo mínimo de 6).
3. **Frontend Componente ([client/tests/RoundSession.test.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/tests/RoundSession.test.jsx)):**
   - Actualizar mocks de ronda para reflejar 30 minutos y verificar que `#round-header` renderice el texto dinámico esperado para rondas técnicas (`~30 min`) y de demostración (`~15 min (1 ejercicio)`).

---

## 2. Criterios de Aceptación (AC)

> [!IMPORTANT]
> Los siguientes Criterios de Aceptación corresponden fielmente a las directrices estipuladas para **[MATH-US-16]** en [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md#L163-L176).

### AC-1: Presupuestos y Límites por Categoría en `server/src/config/progression.js`
- [x] `server/src/config/progression.js` define:
  - `ROUND_BUDGETS = { technique: 30, application: 30, proof: 15 }`.
  - `CATEGORY_LIMITS = { technique: { min: 6, max: 18 }, application: { min: 2, max: 6 }, proof: { min: 1, max: 1 } }`.
- [x] Se mantiene `ROUND_BUDGET_MIN = 15` para preservar compatibilidad con referencias secundarias.

### AC-2: Adaptación del Algoritmo en `server/src/services/roundBuilder.js`
- [x] `selectExercisesForRound(candidates, category)` utiliza el presupuesto respectivo `ROUND_BUDGETS[category]`:
  - **Técnica:** Acumula hasta sumar $\ge 30$ min de `expertMinutes` y al menos 6 ejercicios (hasta un máximo de 18).
  - **Aplicación:** Acumula hasta sumar $\ge 30$ min de `expertMinutes` y al menos 2 ejercicios (hasta un máximo de 6).
  - **Demostración:** Selecciona exactamente 1 ejercicio (presupuesto nominal de 15 min).
- [x] La selección mantiene la rotación justa (`timesServed ASC`, `lastServedAt ASC`, `order ASC`) y devuelve la ronda ordenada por `order ASC`.

### AC-3: Manejo Resiliente de Inventario Insuficiente (`catalog_insufficient`)
- [x] Si la base de datos o lista de candidatos no alcanza el mínimo requerido de la categoría (menos de 6 en Técnica o menos de 2 en Aplicación), se devuelven todos los ejercicios disponibles ($\ge 1$) acompañados del metadato `warning: 'catalog_insufficient'`.
- [x] Si no hay ningún ejercicio disponible (0 candidatos), se rechaza con error 422 (`No exercises available for this track`).

### AC-4: Actualización Dinámica del Encabezado en `client/src/components/RoundSession.jsx`
- [x] En la fase de práctica (`PRACTICING`), `#round-header` renderiza dinámicamente:
  - Para **Técnica** y **Aplicación**: `"Un experto lo resuelve en ~30 min (N ejercicios)"` (donde $N$ es la cantidad de ejercicios en la ronda).
  - Para **Demostración**: `"Un experto lo resuelve en ~15 min (1 ejercicio)"` (con singular estricto).

### AC-5: Verificación Automatizada (Tests Backend y Frontend al 100%)
- [x] `server/tests/roundBuilder.test.js` cubre exhaustivamente los nuevos umbrales de 30 min y cuotas mínimas/máximas para Técnica (6 a 18), Aplicación (2 a 6) y Demostración (1).
- [x] `server/tests/rounds.api.test.js` actualiza sus fixtures de integración con MongoDB en memoria para alinearse a las cuotas de 30 minutos y valida el comportamiento de `POST /api/rounds`.
- [x] `client/tests/RoundSession.test.jsx` valida que el encabezado `#round-header` muestre los textos calibrados correspondientes.
- [x] `npm test` en backend y `npm test` en frontend pasan al 100% sin advertencias ni regresiones.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos Identificados:**
  - `[MATH-US-16] Calibración de Rondas a 30 Minutos (Técnica y Aplicación)`
  - `server/src/config/progression.js` (`ROUND_BUDGETS`, `CATEGORY_LIMITS`, `ROUND_BUDGET_MIN`)
  - `server/src/services/roundBuilder.js` (`selectExercisesForRound`, `buildRound`)
  - `server/src/routes/rounds.js` (`createRound`, `getRound`, `queue`)
  - `client/src/components/RoundSession.jsx` (`#round-header`, `formatTime`, `RoundSession`)
  - `server/tests/roundBuilder.test.js`
  - `server/tests/rounds.api.test.js`
  - `client/tests/RoundSession.test.jsx`

- **Archivos a Intervenir:**
  - **Configuración y Backend:**
    - [server/src/config/progression.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/config/progression.js): Definición de `ROUND_BUDGETS` y nuevos límites en `CATEGORY_LIMITS`.
    - [server/src/services/roundBuilder.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/roundBuilder.js): Calibración del algoritmo de acumulación a 30 min y nuevas cuotas.
    - [server/tests/roundBuilder.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/roundBuilder.test.js): Adaptación y ampliación de casos de prueba unitarios.
    - [server/tests/rounds.api.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/rounds.api.test.js): Actualización de fixtures para pruebas de integración de API.
  - **Frontend:**
    - [client/src/components/RoundSession.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/RoundSession.jsx): Lógica condicional para mensaje dinámico en `#round-header`.
    - [client/tests/RoundSession.test.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/tests/RoundSession.test.jsx): Actualización de aserciones de texto del encabezado.
  - **Seguimiento y Control:**
    - [.antigravity/heartbeat.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/heartbeat.md): Registro de historia activa y cambio de estado a En Progreso.

---

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
# Backend unitario: roundBuilder.test.js
npm --prefix server test -- tests/roundBuilder.test.js
✓ tests/roundBuilder.test.js (17 tests) - 17 passed

# Backend integración: rounds.api.test.js
npm --prefix server test -- tests/rounds.api.test.js
✓ tests/rounds.api.test.js (13 tests) - 13 passed

# Frontend componente: RoundSession.test.jsx
npm --prefix client test -- tests/RoundSession.test.jsx
✓ tests/RoundSession.test.jsx (6 tests) - 6 passed

# Monorepo completo: npm test
Server: 11 test files passed | 109 tests passed
Client: 5 test files passed  | 30 tests passed
Total: 16 test files passed  | 139 tests passed (0 fallas)
```

### Tests E2E (Playwright)

```
N/A para calibración algorítmica y de encabezado de ronda (suite E2E se ejecuta en los cierres de hito).
```

---

## 5. Commit de Cierre en dev

```bash
feat(calibration): calibra presupuestos de rondas a 30 min para tecnica y aplicacion (#MATH-US-16)
```
