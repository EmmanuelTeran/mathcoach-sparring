# [MATH-US-11] Constructor de Rondas de 15 min + API de Rondas

- **Estado:** Completado
- **Rama:** `feature/MATH-US-11-round-builder`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** 2026-10-09

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Arquitectónico y Razón de Cambio

Tras la culminación de [[MATH-US-08] Modelo de Dominio](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-08-domain-model.md), [[MATH-US-09] Catálogo Curado de Ejercicios](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-09-curated-catalog.md) y [[MATH-US-10] Motor de Progresión Adaptativa](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-10-progression-engine.md), **MathCoach Sparring** cuenta con un modelo de entidades desacoplado ([MathTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js), [TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js), [Exercise](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Exercise.js), [Round](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js)), un catálogo curado con más de 130 ejercicios graduados y un motor funcional puro de cómputo adaptativo y repetición espaciada SM-2.

El siguiente paso crítico en la arquitectura es transformar el flujo de entrenamiento del estudiante:
1. **Superación del flujo legado atómico ("un ejercicio = una foto"):** El entrenamiento matemático universitario deliberado no se realiza problema a problema con fricción constante de captura. En su lugar, el estudiante realiza **bloques de trabajo concentrado en papel (~15 minutos de tiempo experto)**, resolviendo un lote de ejercicios continuos antes de cualquier interacción con la IA.
2. **La Ronda de Práctica como Unidad Atómica de Entrenamiento:** Una ronda representa una sesión formal de práctica para una pista específica (*Tema × Categoría*, gestionada por [TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js)) en su dificultad activa (`difficulty` 1, 2 o 3).
3. **Inmutabilidad y Consistencia Evaluativa (Snapshot Pattern):** Al instanciar una ronda, los ejercicios seleccionados se congelan como un *snapshot* inmutable dentro del documento [Round](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js). Si el catálogo de ejercicios sufre ediciones posteriores, la ronda preserva exactamente los enunciados y tiempos expertos originales con los que el estudiante practicó.
4. **Preparación para la Evaluación Multimodal ([MATH-US-12](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md#L209-L224)):** La API de rondas expuesta en esta historia proporcionará los endpoints para consultar la cola diaria de repasos vencidos (`GET /api/rounds/queue`), generar o retomar rondas activas (`POST /api/rounds`), y consultar el detalle de cualquier ronda existente (`GET /api/rounds/:id`).

---

### 1.2 Reglas de Negocio de Composición de Rondas (`ROUND_BUDGET_MIN = 15`) (§1.1 de `graph.md`)

El servicio [server/src/services/roundBuilder.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/roundBuilder.js) gobernará la composición algorítmica de rondas respetando el presupuesto temporal de tiempo experto y las cuotas de cada categoría establecidas en [server/src/config/progression.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/config/progression.js):

| Categoría | Clave Interna | Mín. ejercicios | Máx. ejercicios | Regla de Composición Temporal |
|---|---|---|---|---|
| **Técnica** | `technique` | 3 | 10 | Acumular `expertMinutes` hasta alcanzar $\ge 15$ minutos o llegar al máximo de 10 ejercicios. Si se alcanza $\ge 15$ min con menos de 3 ejercicios, se continúa agregando hasta cumplir el mínimo de 3. |
| **Aplicación** | `application` | 1 | 3 | Acumular `expertMinutes` hasta alcanzar $\ge 15$ minutos o llegar al tope de 3 ejercicios (ej. un problema largo de 15 min es suficiente; si son de 5–8 min, se combinan 2 o 3). |
| **Demostración** | `proof` | 1 | 1 | Siempre exactamente **un único ejercicio** por ronda, independientemente de su duración estimada. |

#### Manejo de Catálogo Insuficiente:
- Si el número de ejercicios disponibles en catálogo para la dificultad activa de la pista no alcanza el mínimo requerido por categoría, se sirve la totalidad de lo disponible ($\ge 1$) y la ronda se genera con la advertencia `warning: 'catalog_insufficient'`.
- Si el catálogo se encuentra completamente vacío (0 ejercicios disponibles para esa combinación tema/categoría/dificultad), se aborta la creación con un error explicativo (HTTP 422 Unprocessable Entity).

---

### 1.3 Algoritmo Estricto de Selección, Priorización y Ordenamiento

Para garantizar una experiencia pedagógica variada, prevenir la fatiga de enunciados repetidos y entregar los ejercicios en una secuencia didáctica óptima, `roundBuilder.js` implementa un algoritmo en dos fases:

```
[Catálogo de Ejercicios]
          │
          ▼ 1. Filtrado Estricto por Dificultad
[Ejercicios donde topicId, category y difficulty == track.difficulty]
          │
          ▼ 2. Priorización de Selección (Rotación Justa)
   timesServed ASC (menos servidos primero)
   └──> lastServedAt ASC (nulls/más antiguos primero)
        └──> order ASC (desempate determinista)
          │
          ▼ 3. Recorte por Presupuesto Temporal (ROUND_BUDGET_MIN = 15)
   Acumulación secuencial respetando [min, max] por categoría
          │
          ▼ 4. Orden Final de Entrega al Estudiante
   order ASC (complejidad creciente para la sesión de práctica)
```

1. **Filtrado Estricto por Dificultad Actual:**
   - La consulta selecciona exclusivamente ejercicios cuya `difficulty` coincida exactamente con la dificultad actual de la pista (`track.difficulty`). **Bajo ninguna circunstancia se mezclan ejercicios de distinta dificultad en una misma ronda.**
2. **Prioridad de Selección (Rotación Justa y Balanceada):**
   - **Criterio 1 (`timesServed` ASC):** Se priorizan los ejercicios que hayan sido presentados la menor cantidad de veces en rondas previas.
   - **Criterio 2 (`lastServedAt` ASC):** En caso de empate en `timesServed`, se priorizan aquellos que nunca han sido servidos (`lastServedAt === null`) o cuya última entrega fue hace más tiempo (fecha más remota).
   - **Criterio 3 (`order` ASC):** En caso de empate en frecuencia y antigüedad, se desempata por el número de orden catalogado.
3. **Orden Final de Entrega al Estudiante:**
   - Una vez seleccionado el subconjunto de ejercicios que componen la ronda, la lista devuelta al estudiante se ordena de forma **ascendente por `order` (`order` ASC)**. Esto garantiza que dentro de la sesión de práctica los ejercicios se presenten en orden de complejidad pedagógica creciente.

---

### 1.4 Mutación de Estado y Snapshot Inmutable en `Round`

Al instanciar una nueva ronda de práctica:
1. **Congelación de Snapshot en [Round](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js):**
   - Se crea y almacena el documento `Round` con `status: 'pending'`, guardando los datos de la pista (`trackId`, `topicId`, `category`, `difficulty`) y la sumatoria `totalExpertMinutes`.
   - Cada ejercicio seleccionado se incrusta en el array `exercises` como un subdocumento snapshot independiente:
     ```javascript
     {
       exerciseId: exercise._id,
       order: exercise.order,
       statement: exercise.statement,
       expertMinutes: exercise.expertMinutes
     }
     ```
2. **Actualización Atómica de Historial en [Exercise](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Exercise.js):**
   - Para cada uno de los ejercicios seleccionados, se ejecuta una actualización atómica:
     - Se incrementa el contador: `timesServed = timesServed + 1`.
     - Se actualiza la marca temporal: `lastServedAt = new Date()`.
   - Este efecto colateral asegura que en las solicitudes subsiguientes de rondas para esa misma pista, el algoritmo de rotación servirá ejercicios alternativos o más antiguos.

---

### 1.5 Contratos Formales de la API HTTP (`server/src/routes/rounds.js`)

Se expone el enrutador en [server/src/routes/rounds.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/rounds.js), montado en `/api/rounds` dentro de [server/src/app.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/app.js):

#### 1. `GET /api/rounds/queue` — Cola de Pistas Vencidas para Repaso
- **Propósito:** Lista las pistas que requieren repaso inmediato según el calendario SM-2 (`dueDate <= now`).
- **Criterio de Ordenamiento Estricto:**
  1. **Menor `lastRoundScore` (ascendente, con `null` primero):** Las pistas nunca practicadas o que tuvieron calificaciones reprobatorias (fallos previos) tienen prioridad máxima de repaso.
  2. **Mayor retraso (`dueDate` ascendente):** A igualdad de score, las pistas cuya fecha de vencimiento esté más lejana en el pasado (mayor retraso acumulado) se presentan primero.
- **Respuesta:** `200 OK`
  ```json
  [
    {
      "trackId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "topic": {
        "_id": "65f1a2b3c4d5e6f7a8b9c000",
        "title": "Fracciones Algebraicas",
        "slug": "fracciones-algebraicas"
      },
      "category": "technique",
      "difficulty": 1,
      "dueDate": "2026-10-08T12:00:00.000Z",
      "lastRoundScore": null
    }
  ]
  ```

#### 2. `POST /api/rounds` — Creación o Reutilización de Ronda
- **Body:**
  ```json
  {
    "topicId": "65f1a2b3c4d5e6f7a8b9c000",
    "category": "technique"
  }
  ```
- **Comportamiento Idempotente:**
  - Si ya existe una ronda en estado `pending` (`status: 'pending'`) asociada a la pista correspondiente (`trackId`), el endpoint **no genera una ronda nueva ni duplica ejercicios**: reutiliza la existente y responde con código `200 OK`.
  - Si no existe ninguna ronda pendiente para esa pista, ejecuta `roundBuilder.buildRound(track)`, persiste el snapshot, muta `timesServed` / `lastServedAt` en los ejercicios y responde con `201 Created`.
- **Respuesta (200 OK o 201 Created):**
  ```json
  {
    "roundId": "6601f2e3d4c5b6a708192837",
    "topic": {
      "_id": "65f1a2b3c4d5e6f7a8b9c000",
      "title": "Fracciones Algebraicas",
      "slug": "fracciones-algebraicas"
    },
    "category": "technique",
    "difficulty": 1,
    "exercises": [
      {
        "exerciseId": "65f2b3c4d5e6f7a8b9c00101",
        "order": 1,
        "statement": "Simplifica la expresión algebraica $\\frac{x^2 - 4}{x - 2}$.",
        "expertMinutes": 3
      },
      {
        "exerciseId": "65f2b3c4d5e6f7a8b9c00102",
        "order": 2,
        "statement": "Efectúa la suma: $\\frac{2}{x+1} + \\frac{3}{x-1}$.",
        "expertMinutes": 5
      },
      {
        "exerciseId": "65f2b3c4d5e6f7a8b9c00103",
        "order": 3,
        "statement": "Multiplica y simplifica: $\\frac{x^2 - 1}{x^2 + 2x + 1} \\cdot \\frac{x + 1}{x - 1}$.",
        "expertMinutes": 7
      }
    ],
    "totalExpertMinutes": 15,
    "warning": "catalog_insufficient" // Solo presente si no se alcanzó la cuota mínima de la categoría
  }
  ```

#### 3. `GET /api/rounds/:id` — Consulta de Ronda Existente
- **Propósito:** Retorna la información completa de una ronda por su identificador.
- **Respuesta:** `200 OK` con el documento completo de `Round` (incluyendo `exercises`, `status`, y los resultados `results`, `roundScore`, `passRate`, `promoted` si la ronda ya fue evaluada).
- **Respuesta de Error:** `404 Not Found` si el ID no existe en la base de datos; `400 Bad Request` si el ID no es un ObjectId válido.

---

### 1.6 Manejo Defensivo de Errores y Validaciones

- **Validación de Tema (`404 Not Found`):** Si el `topicId` enviado no corresponde a un documento existente en [MathTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js), se responde `404 { error: 'Topic not found' }`.
- **Validación de Categoría (`400 Bad Request`):** Si la `category` no pertenece a `['technique', 'application', 'proof']`, se responde `400 { error: 'Invalid category' }`.
- **Validación de Parámetros (`400 Bad Request`):** Si faltan parámetros requeridos (`topicId` o `category`), o si los identificadores no cumplen el formato hexadecimal de MongoDB (ObjectId).
- **Catálogo Insuficiente (`warning: 'catalog_insufficient'`):** Cuando la categoría exige al menos $N$ ejercicios y el catálogo sólo dispone de $K < N$ (con $K \ge 1$), se retornan los $K$ ejercicios acompañados de la advertencia.
- **Catálogo Vacío (`422 Unprocessable Entity`):** Si el catálogo cuenta con 0 ejercicios para la dificultad actual de la pista, se retorna `422 { error: 'No exercises available for this track' }`.

---

## 2. Criterios de Aceptación (AC)

> [!IMPORTANT]
> Los siguientes Criterios de Aceptación corresponden exactamente a las directrices establecidas para **[MATH-US-11]** en [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md#L194-L208).

### AC-1: Composición de Rondas bajo Presupuesto y Cuotas de Categoría
- [x] `buildRound(track)` respeta rigurosamente los mínimos y máximos por categoría y el presupuesto de tiempo experto `ROUND_BUDGET_MIN = 15`:
  - **Técnica:** Mínimo 3, máximo 10. Acumula `expertMinutes` hasta alcanzar $\ge 15$ min. Con ejercicios cortos (1–2 min) se detiene al llegar a 10 ejercicios; con ejercicios largos (5 min) se detiene al cumplir el mínimo de 3 ejercicios (sumando 15 min).
  - **Aplicación:** Mínimo 1, máximo 3. Acumula hasta alcanzar $\ge 15$ min. Un ejercicio largo de 15 min compone una ronda completa de 1 solo ejercicio. Con ejercicios de 6–8 min acumula 2 o 3.
  - **Demostración:** Exactamente **1 ejercicio** por ronda sin importar los minutos estimados.
- [x] Se implementan pruebas con fixtures calibrados que validan estos cuatro escenarios límite.

### AC-2: Selección por Dificultad Actual y Orden Ascendente
- [x] La selección de candidatos filtra exclusivamente por la dificultad actual de la pista (`difficulty === track.difficulty`). No se incluyen ejercicios de niveles inferiores ni superiores.
- [x] La prioridad de selección sigue estrictamente el orden:
  1. `timesServed` ascendente (menos veces servido primero).
  2. `lastServedAt` ascendente (`null` primero, luego los de fecha más antigua).
  3. `order` ascendente (desempate determinista).
- [x] Los ejercicios seleccionados se devuelven ordenados por `order` ascendente (complejidad pedagógica creciente dentro de la ronda).

### AC-3: Mutación y Rotación Justa de Ejercicios
- [x] Al instanciar y persistir una ronda, se incrementa atómicamente `timesServed` en 1 y se actualiza `lastServedAt = new Date()` para cada uno de los ejercicios incluidos.
- [x] Se verifica mediante pruebas automáticas que dos solicitudes sucesivas de rondas para una misma pista rotan los ejercicios disponibles en el catálogo en lugar de servir repetidamente los mismos enunciados.
- [x] La ronda persiste un snapshot inmutable en el campo `exercises` de [Round](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js) (`exerciseId`, `order`, `statement`, `expertMinutes`).

### AC-4: Catálogo Insuficiente y Errores Defensivos de API
- [x] Si los ejercicios disponibles en catálogo son menores al mínimo estipulado para la categoría (pero $\ge 1$), la respuesta incluye `warning: 'catalog_insufficient'` y entrega los ejercicios existentes.
- [x] Si `topicId` no existe en la base de datos o es inválido, `POST /api/rounds` responde con status `404 Not Found`.
- [x] Si `category` no es una categoría válida (`technique`, `application`, `proof`), responde con status `400 Bad Request`.
- [x] Si ya existe una ronda en estado `pending` para la pista, `POST /api/rounds` la reutiliza retornando status `200 OK` (evitando duplicaciones).

### AC-5: Verificación Automatizada (Supertest + MongoMemoryServer)
- [x] Todas las pruebas de integración en `server/tests/rounds.api.test.js` y pruebas de servicio en `server/tests/roundBuilder.test.js` se ejecutan sobre MongoDB en memoria (`MongoMemoryServer`) y Supertest.
- [x] La cola `GET /api/rounds/queue` devuelve sólo pistas vencidas (`dueDate <= now`) correctamente ordenadas por menor `lastRoundScore` (`null` primero) y mayor retraso (`dueDate` ASC).
- [x] El comando `npm test` en el backend ejecuta la suite completa en verde sin advertencias ni regresiones en los 66 tests preexistentes.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos Identificados en el Grafo de Conocimiento:**
  - `[MATH-US-11] Constructor de Rondas de 15 min + API de Rondas`
  - `server/src/services/roundBuilder.js` (`buildRound()`)
  - `server/src/routes/rounds.js` (`roundsRouter`, `queue`, `createRound`, `getRound`)
  - `Round`, `roundSchema`, `roundExerciseSnapshotSchema` ([server/src/models/Round.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js))
  - `Exercise`, `exerciseSchema` ([server/src/models/Exercise.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Exercise.js))
  - `TopicTrack`, `topicTrackSchema` ([server/src/models/TopicTrack.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js))
  - `MathTopic` ([server/src/models/MathTopic.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js))
  - `trackService.js` ([server/src/services/trackService.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/trackService.js))
  - `server/src/config/progression.js` (`ROUND_BUDGET_MIN`, `CATEGORY_LIMITS`)
  - `server/src/config/categories.js` (`VALID_CATEGORIES`)
  - `app.js` ([server/src/app.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/app.js))

- **Archivos a Intervenir:**
  - **Nuevos:**
    - [server/src/services/roundBuilder.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/roundBuilder.js): Lógica de selección, cuotas, presupuesto y mutación de ejercicios para conformar rondas.
    - [server/src/routes/rounds.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/rounds.js): Endpoints de API para cola vencida (`/queue`), creación/reutilización (`POST /`), y consulta (`GET /:id`).
    - [server/tests/roundBuilder.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/roundBuilder.test.js): Pruebas unitarias de composición bajo fixtures y límites temporales.
    - [server/tests/rounds.api.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/rounds.api.test.js): Pruebas de integración HTTP con Supertest y MongoMemoryServer.
  - **Modificados:**
    - [server/src/app.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/app.js): Montaje de la ruta `app.use('/api/rounds', roundsRouter)`.
    - [.antigravity/heartbeat.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/heartbeat.md): Actualización de historia activa y estado a En Progreso.

---

## 4. Estrategia de Pruebas y Cobertura

### 4.1 Plan de Pruebas Unitarias de `roundBuilder.js` (`server/tests/roundBuilder.test.js`)

1. **Pruebas de Presupuesto y Límites por Categoría (Fixtures):**
   - **Técnica con ejercicios cortos (2 min c/u):** Selecciona ejercicios hasta acumular $\ge 15$ min (ej. 8 ejercicios = 16 min, cumpliendo $3 \le N \le 10$).
   - **Técnica con ejercicios de 1 min c/u:** Se detiene en el tope de 10 ejercicios (10 min acumulados).
   - **Técnica con ejercicios largos (5 min c/u):** Se detiene exactamente en 3 ejercicios al cumplir 15 min.
   - **Aplicación con ejercicio de 15 min:** Genera ronda de 1 solo ejercicio ($1 \le N \le 3$).
   - **Aplicación con ejercicios medianos (6 min c/u):** Acumula 3 ejercicios (18 min).
   - **Demostración:** Con 5 candidatos disponibles de 10 min c/u, toma exactamente 1 solo ejercicio.
2. **Pruebas de Filtrado y Rotación Justa:**
   - Exclusión de dificultades distintas a `track.difficulty`.
   - Priorización de candidatos con menor `timesServed`.
   - Priorización de candidatos con `lastServedAt === null` sobre los que ya tienen fecha registrada.
   - Priorización de fecha más remota cuando ambos tienen `lastServedAt`.
   - Desempate por `order` ascendente.
3. **Pruebas de Orden Final de Presentación:**
   - Comprobación de que la lista devuelta en `exercises` posee siempre `order` monótonamente creciente.
4. **Pruebas de Catálogo Insuficiente / Vacío:**
   - Si se solicitan ejercicios de Técnica y sólo existen 2 en catálogo, retorna los 2 ejercicios con el indicador `warning: 'catalog_insufficient'`.
   - Si existen 0 ejercicios para la pista, lanza error apropiado.

---

### 4.2 Plan de Pruebas de Integración de API HTTP (`server/tests/rounds.api.test.js`)

1. **Suite `GET /api/rounds/queue`:**
   - Excluye pistas futuras (`dueDate > now`).
   - Incluye pistas vencidas (`dueDate <= now`).
   - Ordena primero por menor `lastRoundScore`, tratando `null` como prioritario (antepuesto a valores numéricos como 1.0, 2.5, 4.0).
   - Desempata pistas con igual score colocando primero la de mayor retraso (`dueDate` más antiguo en el pasado).
   - Estructura de respuesta con proyección `{ trackId, topic, category, difficulty, dueDate, lastRoundScore }`.
2. **Suite `POST /api/rounds`:**
   - Creación exitosa (201): crea documento en BD con `status: 'pending'` y snapshot de enunciados.
   - Reutilización idempotente (200): si ya existe una ronda pendiente para esa pista, la retorna sin crear otra ni alterar contadores.
   - Mutación confirmada: incrementa `timesServed` y fija `lastServedAt` en la colección `Exercise`.
   - Rotación confirmada: una segunda ronda creada tras completar la primera sirve ejercicios alternativos.
   - Catálogo insuficiente: retorna 201 con `warning: 'catalog_insufficient'` cuando hay menos ejercicios que el mínimo.
   - Validaciones: `404` si `topicId` no existe; `400` si `category` no es válida; `400` si faltan parámetros.
3. **Suite `GET /api/rounds/:id`:**
   - Retorna 200 con el documento de ronda completo.
   - Retorna 404 si el ID no corresponde a ninguna ronda.
   - Retorna 400 si el parámetro `:id` es un ObjectId malformado.

---

## 5. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
> @mathcoach-sparring/server@1.0.0 test
> vitest run

 ✓ tests/catalog.test.js (9 tests)
 ✓ tests/rounds.api.test.js (13 tests)
 ✓ tests/progressionEngine.test.js (17 tests)
 ✓ tests/practice.test.js (7 tests)
 ✓ tests/roundBuilder.test.js (15 tests)
 ✓ tests/models.test.js (19 tests)
 ✓ tests/topics.test.js (2 tests)
 ✓ tests/srsCalculator.test.js (11 tests)
 ✓ tests/health.test.js (1 test)

 Test Files  9 passed (9)
      Tests  94 passed (94)
```

Suite monorepo completa (`npm test`):
- Backend: 9 suites, 94 tests pasados.
- Frontend: 2 suites, 14 tests pasados.
- Total: 108 tests pasados, 0 regresiones.

### Tests E2E (Playwright)

N/A en este ticket de backend/servicios (las pruebas E2E de interfaz de ronda corresponden a MATH-US-13 y MATH-US-15).

---

## 6. Commit de Cierre en dev

Pendiente de merge / commit final en `feature/MATH-US-11-round-builder`.
