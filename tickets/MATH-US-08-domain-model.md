# [MATH-US-08] Modelo de Dominio Tema × Categoría × Dificultad + Purga de Backend Legado

- **Estado:** En Progreso
- **Rama:** `feature/MATH-US-08-domain-model`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** -

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Arquitectónico y Razón de Cambio

Actualmente, el backend de `mathcoach-sparring` conserva una arquitectura híbrida con una grave deuda técnica y conceptual:
1. **Acoplamiento de Entidades en `MathTopic.js`:** La entidad `MathTopic` confunde el concepto abstracto de "Tema" curricular con el de "Ejercicio" individual, forzando campos de ejecución (`problemStatement`, `level`, `repetition`, `interval`, `efactor`, `dueDate`) en un único documento. Esto impide que un mismo tema pueda ser ejercitado en diferentes niveles taxonómicos y dificultades adaptativas.
2. **Vestigios del Prototipo Legado (DevCoach):** El sistema retiene modelos obsoletos (`Topic.js`, `SessionLog.js`), rutas de entrenamiento de software (`routes/softSkillPractice.js`, `routes/codingPractice.js`), servicios de diálogo (`services/softSkillSparringService.js`) y endpoints legados en `practice.js` y `geminiService.js`. Asimismo, el controlador de dashboard (`dashboardController.js`) calcula métricas sobre roles `junior / mid / senior` y categorías `hard_skill / soft_skill`.
3. **Decisión de Producto Aprobada (2026-10-09):** Desacoplar formalmente el dominio en **Tema (`MathTopic`)**, **Pista de Progreso (`TopicTrack`)**, **Ejercicio Curado (`Exercise`)** y **Ronda de Entrenamiento (`Round`)**, organizados bajo la matriz multidimensional **Tema × Categoría × Dificultad**.

> [!IMPORTANT]
> **Sin migración de datos:** El proyecto se encuentra en fase activa de desarrollo previa a producción. Los esquemas y colecciones legadas se purgan de raíz sin scripts de migración retroactiva; la base de datos se poblará de forma limpia e idempotente con el catálogo curado en la historia sucesora **MATH-US-09**.

---

### 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de `graph.md`)

| Entidad | Descripción de Dominio | Responsabilidad |
|---|---|---|
| **`MathTopic`** | Unidad de contenido curricular (ej. *"Factorización de Polinomios"*, *"Límites y Continuidad"*). | Agrupador conceptual con `slug`, `title`, `area`, `source`, `order`, `description`. |
| **`Exercise`** | Problema concreto de libreta formulado en Markdown + LaTeX. | Contiene `statement`, `referenceSolution`, `expertMinutes` (> 0), `order` (complejidad creciente), `timesServed`, `lastServedAt` y `externalKey`. |
| **`TopicTrack`** | Pista de progreso adaptativo para el par único *(Tema × Categoría)*. | Mantiene el estado SRS (SM-2: `repetition`, `interval`, `efactor`, `dueDate`) y la `difficulty` actual (1, 2 o 3). Cada tema posee exactamente 3 pistas. |
| **`Round`** | Sesión de práctica (~15 min de tiempo experto acumulado). | Snapshot inmutable de ejercicios asignados para una pista en su dificultad actual. Registra el estado de resolución y la evaluación (`pending` \| `evaluated`). |

---

### 1.3 Esquemas de Base de Datos Mongoose Exactos

#### A. Modelo `MathTopic` (`server/src/models/MathTopic.js`)
```javascript
import mongoose from 'mongoose';

const mathTopicSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      enum: ['algebra', 'trigonometria', 'geometria', 'calculo', 'analisis'],
      index: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'CONAMAT',
    },
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const MathTopic = mongoose.models.MathTopic || mongoose.model('MathTopic', mathTopicSchema);
export default MathTopic;
```

#### B. Modelo `Exercise` (`server/src/models/Exercise.js`)
```javascript
import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MathTopic',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['technique', 'application', 'proof'],
    },
    difficulty: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },
    order: {
      type: Number,
      required: true, // Complejidad creciente dentro de la categoría y dificultad
    },
    statement: {
      type: String,
      required: true,
      trim: true, // Markdown + notación LaTeX ($...$ / $$...$$)
    },
    referenceSolution: {
      type: String,
      default: '',
      trim: true, // Solución técnica / criterios para el evaluador IA
    },
    expertMinutes: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return typeof v === 'number' && v > 0;
        },
        message: 'expertMinutes debe ser un número mayor a 0',
      },
    },
    source: {
      type: String,
      trim: true,
      default: 'CONAMAT',
    },
    timesServed: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastServedAt: {
      type: Date,
      default: null,
    },
    externalKey: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Clave única determinista para seed idempotente (ej. 'alg-frac-tech-d1-01')
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para selección y ordenamiento óptimo de rondas
exerciseSchema.index({ topicId: 1, category: 1, difficulty: 1, order: 1 });

export const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);
export default Exercise;
```

#### C. Modelo `TopicTrack` (`server/src/models/TopicTrack.js`)
```javascript
import mongoose from 'mongoose';

const topicTrackSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MathTopic',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['technique', 'application', 'proof'],
    },
    difficulty: {
      type: Number,
      required: true,
      default: 1,
      enum: [1, 2, 3],
    },
    repetition: {
      type: Number,
      default: 0,
      min: 0,
    },
    interval: {
      type: Number,
      default: 0,
      min: 0,
    },
    efactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    dueDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastRoundScore: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },
    roundsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Cada tema tiene exactamente una pista por categoría (3 pistas por tema)
topicTrackSchema.index({ topicId: 1, category: 1 }, { unique: true });

export const TopicTrack = mongoose.models.TopicTrack || mongoose.model('TopicTrack', topicTrackSchema);
export default TopicTrack;
```

#### D. Modelo `Round` (`server/src/models/Round.js`)
```javascript
import mongoose from 'mongoose';

const roundExerciseSnapshotSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    statement: {
      type: String,
      required: true,
    },
    expertMinutes: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const roundResultSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    feedback_paso_a_paso: {
      type: String,
      default: '',
    },
    hint: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const roundSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TopicTrack',
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MathTopic',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['technique', 'application', 'proof'],
    },
    difficulty: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },
    exercises: {
      type: [roundExerciseSnapshotSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Una ronda debe contener al menos un ejercicio.',
      },
    },
    totalExpertMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'evaluated'],
      default: 'pending',
      index: true,
    },
    results: {
      type: [roundResultSchema],
      default: [],
    },
    roundScore: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },
    passRate: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },
    promoted: {
      type: Boolean,
      default: false,
    },
    previousDifficulty: {
      type: Number,
      enum: [1, 2, 3],
      default: null,
    },
    newDifficulty: {
      type: Number,
      enum: [1, 2, 3],
      default: null,
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Round = mongoose.models.Round || mongoose.model('Round', roundSchema);
export default Round;
```

---

### 1.4 Mapeo de Categorías y Servicio Idempotente `ensureTracksForTopic`

- **Archivos de Configuración:**
  - `server/src/config/categories.js` y `client/src/constants/categories.js`:
    ```javascript
    export const CATEGORIES = {
      technique: 'Técnica',
      application: 'Aplicación',
      proof: 'Demostración',
    };
    export const VALID_CATEGORIES = Object.keys(CATEGORIES);
    ```
- **Servicio `server/src/services/trackService.js`:**
  - Función `ensureTracksForTopic(topicId)`:
    - Valida que `topicId` exista o sea un ObjectId válido.
    - Recorre las 3 categorías fijas (`technique`, `application`, `proof`).
    - Utiliza `TopicTrack.findOneAndUpdate` con `$setOnInsert` para inicializar atómicamente:
      - `difficulty: 1`
      - `repetition: 0`
      - `interval: 0`
      - `efactor: 2.5`
      - `dueDate: new Date()` (disponible de inmediato para práctica)
      - `lastRoundScore: null`
      - `roundsCompleted: 0`
    - Es 100 % idempotente: no duplica pistas ni reinicia el progreso de pistas preexistentes.
    - Retorna el array de las 3 pistas resultantes.

---

### 1.5 Contratos API

#### A. `GET /api/topics` (`server/src/routes/topics.js`)
Reescritura completa del endpoint de temas.
- **Respuesta (200 OK):**
  ```json
  [
    {
      "_id": "674c11112222333344440001",
      "slug": "fracciones-algebraicas",
      "title": "Fracciones Algebraicas",
      "area": "algebra",
      "source": "CONAMAT",
      "order": 1,
      "description": "Simplificación, operaciones racionales y descomposición.",
      "tracks": [
        {
          "_id": "674c11112222333344440101",
          "category": "technique",
          "difficulty": 1,
          "dueDate": "2026-10-09T23:00:00.000Z",
          "lastRoundScore": null,
          "roundsCompleted": 0
        },
        {
          "_id": "674c11112222333344440102",
          "category": "application",
          "difficulty": 1,
          "dueDate": "2026-10-09T23:00:00.000Z",
          "lastRoundScore": null,
          "roundsCompleted": 0
        },
        {
          "_id": "674c11112222333344440103",
          "category": "proof",
          "difficulty": 1,
          "dueDate": "2026-10-09T23:00:00.000Z",
          "lastRoundScore": null,
          "roundsCompleted": 0
        }
      ]
    }
  ]
  ```

#### B. Stub Compatible `GET /api/dashboard/summary` (`server/src/controllers/dashboardController.js`)
- Retorna un objeto compatible con `client/src/components/Dashboard.jsx` sin referencias a DevCoach:
  ```json
  {
    "dueCount": 0,
    "criticalTopics": [],
    "recommendedNext": null
  }
  ```
  Evita romper la interfaz de usuario mientras llega el rediseño integral de **MATH-US-14**.

---

## 2. Criterios de Aceptación (AC)

### AC-1: Modelos Mongoose Defensivos (`MathTopic`, `Exercise`, `TopicTrack`, `Round`)
- [ ] Los 4 modelos existen y están exportados en `server/src/models/`.
- [ ] Validaciones defensivas de esquema comprobadas:
  - `MathTopic`: rechaza áreas inválidas fuera de `['algebra', 'trigonometria', 'geometria', 'calculo', 'analisis']`; `slug` y `title` requeridos; `slug` único.
  - `Exercise`: rechaza categorías no permitidas, dificultades fuera del rango `[1, 2, 3]`, `expertMinutes <= 0`, o ausencia de `statement` / `externalKey`.
  - `TopicTrack`: enforce del índice único `{ topicId, category }` impidiendo duplicidad de pista para un mismo tema; rechaza categorías o dificultades inválidas.
  - `Round`: `exercises` no puede ser un array vacío; `status` sólo admite `'pending'` o `'evaluated'`; valida tipos en snapshots y resultados.

### AC-2: Servicio Idempotente `ensureTracksForTopic(topicId)`
- [ ] Existe la función `ensureTracksForTopic(topicId)` en `server/src/services/trackService.js`.
- [ ] Inicializa exactamente las 3 pistas (`technique`, `application`, `proof`) con `difficulty: 1`, `dueDate` actual y valores SM-2 por defecto (`repetition: 0, interval: 0, efactor: 2.5`).
- [ ] Ejecutar la función múltiples veces sobre el mismo `topicId` no duplica pistas ni sobreescribe el avance de pistas ya existentes.

### AC-3: Endpoint `GET /api/topics` Enriquecido con Pistas
- [ ] `GET /api/topics` devuelve código 200 y una lista de temas ordenados.
- [ ] Cada tema devuelto incluye la propiedad `tracks` conteniendo sus 3 pistas asociadas (`technique`, `application`, `proof`).
- [ ] Si un tema aún no tiene pistas creadas en BD, el endpoint las inicializa vía `ensureTracksForTopic` antes de responder.

### AC-4: Purga Absoluta del Backend Legado
- [ ] Se eliminan completamente los siguientes archivos:
  - `server/src/models/Topic.js`
  - `server/src/models/SessionLog.js`
  - `server/src/routes/softSkillPractice.js`
  - `server/src/routes/codingPractice.js`
  - `server/src/services/softSkillSparringService.js`
  - `server/tests/softSkillPractice.test.js`
  - `server/tests/codingPractice.test.js`
  - `server/tests/hint.test.js`
  - `server/tests/dashboard.test.js` (legado)
  - `server/tests/topics.test.js` (legado)
  - `tests/e2e/hard-skills.spec.js`
  - `tests/e2e/soft-skills.spec.js`
  - `tests/e2e/stratified-prompts.spec.js`
  - `tests/e2e/multilevel-catalog.spec.js`
  - `tests/e2e/scaffolding.spec.js`
  - `tests/e2e/dashboard.spec.js` (legado)
- [ ] En `server/src/routes/practice.js` se eliminan los endpoints `/hard-skill/generate`, `/hard-skill/evaluate` y `/hard-skill/hint`, conservando únicamente `/evaluate-math`.
- [ ] En `server/src/services/geminiService.js` se eliminan `generateHardSkillChallenge`, `evaluateHardSkillSolution`, `generateHint` y `evaluateCodingSolution`, conservando únicamente `evaluateMathVisionSolution` y el cliente GenAI.
- [ ] En `server/src/app.js` se desvinculan los routers `softSkillPracticeRouter` y `codingPracticeRouter`.

### AC-5: Cero Residuos Legados en Backend (Auditoría Defensiva)
- [ ] La ejecución del comando de auditoría:
  ```bash
  grep -ri "junior\|senior\|soft_skill\|hard_skill\|SessionLog" server/src
  ```
  no devuelve ningún resultado (código de salida 1).
- [ ] Ningún archivo en `server/src` importa `Topic.js` ni `SessionLog.js`.
- [ ] `dashboardController.js` queda reducido a un stub sin referencias obsoletas.

### AC-6: Suite de Pruebas Automatizadas en Verde
- [ ] La nueva suite `server/tests/models.test.js` prueba exhaustivamente los 4 modelos y el servicio `ensureTracksForTopic`.
- [ ] La nueva suite `server/tests/topics.test.js` prueba el contrato `GET /api/topics`.
- [ ] `npm --prefix server test` pasa al 100% sin tests obsoletos fallando.
- [ ] `npm --prefix client test` y las pruebas E2E no eliminadas (`tests/e2e/math-vision.spec.js`) se mantienen en verde.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos Identificados:**
  - `MathTopic`, `MathTopic.js`, `Topic`, `Topic.js`, `SessionLog`, `SessionLog.js`
  - `Exercise`, `Exercise.js`, `TopicTrack`, `TopicTrack.js`, `Round`, `Round.js`
  - `ensureTracksForTopic()`, `trackService.js`, `categories.js`
  - `topicsRouter`, `topics.js`, `practiceRouter`, `practice.js`, `dashboardController.js`, `app.js`
  - `geminiService.js`, `evaluateMathVisionSolution()`
  - `softSkillSparringService.js`, `softSkillPractice.js`, `codingPractice.js`

- **Archivos a Intervenir:**
  - **Crear:**
    - `server/src/models/Exercise.js`: Modelo de ejercicio individual con Markdown + LaTeX, orden y tiempo experto.
    - `server/src/models/TopicTrack.js`: Modelo de pista Tema × Categoría con dificultad (1–3) y estado SRS.
    - `server/src/models/Round.js`: Modelo de ronda con snapshots de ejercicios, tiempo total y resultados.
    - `server/src/config/categories.js`: Diccionario de categorías válidas en backend (`technique`, `application`, `proof`).
    - `client/src/constants/categories.js`: Constantes de categorías para el frontend.
    - `server/src/services/trackService.js`: Servicio con función idempotente `ensureTracksForTopic`.
    - `server/tests/models.test.js`: Suite TDD para validaciones de los 4 modelos y `ensureTracksForTopic`.
  - **Modificar / Reescribir:**
    - `server/src/models/MathTopic.js`: Reescribir esquema puro de tema (`slug`, `title`, `area`, `source`, `order`, `description`).
    - `server/src/routes/topics.js`: Reescribir con endpoint `GET /api/topics` enriquecido con las pistas de cada tema.
    - `server/src/controllers/dashboardController.js`: Reducir a stub compatible con métricas seguras.
    - `server/src/routes/practice.js`: Purgar endpoints `/hard-skill/*`, manteniendo `/evaluate-math`.
    - `server/src/services/geminiService.js`: Purgar funciones legadas de DevCoach, manteniendo `evaluateMathVisionSolution`.
    - `server/src/app.js`: Desmontar routers de soft skills y coding practice.
    - `server/src/utils/srsCalculator.js`: Limpiar comentarios y JSDoc legados.
    - `server/tests/practice.test.js`: Purgar tests de `/hard-skill/*`, preservando las pruebas de `/evaluate-math`.
    - `server/tests/topics.test.js`: Reescribir para validar el nuevo contrato `GET /api/topics`.
  - **Eliminar:**
    - `server/src/models/Topic.js`
    - `server/src/models/SessionLog.js`
    - `server/src/routes/softSkillPractice.js`
    - `server/src/routes/codingPractice.js`
    - `server/src/services/softSkillSparringService.js`
    - `server/tests/softSkillPractice.test.js`
    - `server/tests/codingPractice.test.js`
    - `server/tests/hint.test.js`
    - `server/tests/dashboard.test.js`
    - `tests/e2e/hard-skills.spec.js`
    - `tests/e2e/soft-skills.spec.js`
    - `tests/e2e/stratified-prompts.spec.js`
    - `tests/e2e/multilevel-catalog.spec.js`
    - `tests/e2e/scaffolding.spec.js`
    - `tests/e2e/dashboard.spec.js`

---

## 4. Estrategia de Pruebas TDD y Evidencia de Verificación

### 4.1 Casos de Prueba TDD para `server/tests/models.test.js`
1. **`MathTopic` Model Tests:**
   - Creación exitosa con campos válidos y slug único.
   - Rechazo si `area` no pertenece a `['algebra', 'trigonometria', 'geometria', 'calculo', 'analisis']`.
   - Rechazo si falta `slug` o `title`.
   - Falla por duplicidad de `slug`.
2. **`Exercise` Model Tests:**
   - Creación exitosa asociado a un `topicId`.
   - Rechazo de `category` no válida (ej. `'random'`).
   - Rechazo de `difficulty` fuera de `[1, 2, 3]` (ej. `0` o `4`).
   - Rechazo de `expertMinutes <= 0` o no numérico.
   - Rechazo si falta `statement` o `externalKey`.
   - Falla por duplicidad de `externalKey`.
3. **`TopicTrack` Model Tests:**
   - Creación exitosa con valores por defecto (`difficulty: 1`, `repetition: 0`, `interval: 0`, `efactor: 2.5`).
   - Rechazo por violación del índice único `{ topicId, category }` (no pueden existir dos pistas de la misma categoría en un mismo tema).
   - Rechazo de dificultad o categoría inválida.
4. **`Round` Model Tests:**
   - Creación exitosa en estado `pending` con lista de snapshots de ejercicios.
   - Rechazo si `exercises` está vacío (`[]`).
   - Rechazo si `status` no es `'pending'` o `'evaluated'`.
   - Persistencia correcta de resultados con scores de 0 a 5.
5. **`ensureTracksForTopic` Service Tests:**
   - Genera exactamente 3 pistas (`technique`, `application`, `proof`) con `difficulty: 1` y `dueDate` fijado a ahora.
   - Es idempotente: al llamarse por segunda vez no altera los documentos ni duplica registros.

### 4.2 Casos de Prueba para `server/tests/topics.test.js`
1. `GET /api/topics` retorna 200 y array vacío si no hay temas.
2. `GET /api/topics` retorna la lista de temas con sus 3 pistas (`tracks`) embebidas y ordenadas.

### 4.3 Comandos de Verificación Exactos
```bash
# 1. Auditoría estricta de cero residuos legados en backend
grep -ri "junior\|senior\|soft_skill\|hard_skill\|SessionLog" server/src

# 2. Comprobación de que no hay referencias a modelos eliminados
grep -rn "Topic\.js" server/src
grep -rn "SessionLog\.js" server/src

# 3. Ejecución de suite de backend
npm --prefix server test

# 4. Ejecución de suite de cliente
npm --prefix client test

# 5. Ejecución de test E2E activo
LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" npx playwright test tests/e2e/math-vision.spec.js
```

---

## 5. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración Backend (Vitest / Supertest)
`[Pendiente de ejecución en verify-user-story]`

### Tests de Auditoría Grep
`[Pendiente de ejecución en verify-user-story]`

### Tests E2E (Playwright)
`[Pendiente de ejecución en verify-user-story]`

---

## 6. Commit de Cierre en dev

`Pendiente de implementación y validación en feature/MATH-US-08-domain-model`
