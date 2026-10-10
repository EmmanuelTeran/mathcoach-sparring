# [MATH-US-12] Evaluación Multimodal de Rondas + Progresión

- **Estado:** Done
- **Rama:** `feature/MATH-US-12-round-evaluation`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** 2026-10-09

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Arquitectónico y Razón de Cambio

Tras haber implementado el [Catálogo Curado de Ejercicios](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-09-curated-catalog.md), el [Motor de Progresión Adaptativa](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-10-progression-engine.md) ([computeRoundOutcome](file:///home/teran/proyectos/mathcoach-sparring/server/src/utils/progressionEngine.js#L47-L149)) y el [Constructor de Rondas de 15 min](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-11-round-builder.md) ([buildRound](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/roundBuilder.js#L106-L142)), **MathCoach Sparring** cuenta con la capacidad de servir sesiones de práctica graduadas e inmutables para cada pista (*Tema × Categoría*) en su dificultad activa.

No obstante, el flujo evaluativo actual heredado de [[MATH-US-04]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-04-multimodal-pipeline.md) (`POST /api/evaluate-math`) presenta limitaciones insalvables:
1. **Flujo atómico y fragmentado:** Asume la captura y evaluación individual de un único ejercicio en una sola imagen, interrumpiendo el flujo cognitivo de resolución deliberada en papel.
2. **Desconexión con la estructura de ronda:** El estudiante resuelve en su libreta una ronda completa de práctica (~15 minutos de tiempo experto con 1 a 10 ejercicios según la categoría) que suele ocupar entre 1 y varias páginas.
3. **Falta de contexto de referencia:** El evaluador de IA previo no recibía soluciones de referencia calibradas ni rúbricas especializadas por categoría matemática (**Técnica**, **Aplicación**, **Demostración**).
4. **Desacoplamiento del motor adaptativo de pista:** Evaluaba contra un modelo legado monoclase [MathTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js), sin actualizar el estado adaptativo de la pista ([TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js)) ni persistir los resultados de la sesión en [Round](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js).

Esta historia de usuario formaliza el pipeline integral de evaluación multimodal para rondas completas:
- Generaliza el servicio de visión con Gemini 1.5 Pro ([geminiService.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/geminiService.js)) a través de la función `evaluateRoundSolutions`, admitiendo de 1 a 6 fotografías de la libreta y auditando concurrentemente todos los ejercicios de la ronda.
- Expone el endpoint `POST /api/rounds/:id/evaluate` en [server/src/routes/rounds.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/rounds.js).
- Implementa persistencia atómica en MongoDB integrando [computeRoundOutcome](file:///home/teran/proyectos/mathcoach-sparring/server/src/utils/progressionEngine.js#L47-L149) para mutar tanto la ronda como la pista (dificultad y programación SRS).
- Elimina de forma definitiva el endpoint legado `POST /api/evaluate-math` y limpia las dependencias y pruebas legadas en cliente y servidor.

---

### 1.2 Reglas de Negocio de Progresión y SRS (§1.2 y §1.3 de `graph.md`)

La evaluación de una ronda desencadena el cómputo adaptativo definido en [server/src/config/progression.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/config/progression.js) y ejecutado por [computeRoundOutcome](file:///home/teran/proyectos/mathcoach-sparring/server/src/utils/progressionEngine.js#L47-L149):

#### Métricas de Ronda:
- **Calificación por ejercicio:** Escala continua entera de $0$ a $5$.
- **Score de ronda (`roundScore`):** Promedio aritmético de los scores individuales, redondeado formalmente a 1 decimal ($\text{roundScore} = \text{round}(\frac{1}{N} \sum s_i, 1)$).
- **Tasa de aprobación (`passRate`):** Proporción de ejercicios que obtuvieron calificación aprobatoria ($\ge 3$):
  $$\text{passRate} = \frac{\#\{s_i \mid s_i \ge 3\}}{N}$$

#### Criterio de Promoción (§1.2):
- **Condición de ascenso de dificultad:**
  $$\text{track.difficulty} < 3 \quad \land \quad \text{roundScore} \ge 4.0 \quad \land \quad \text{passRate} \ge 0.8$$
- **Permanencia:** Si no se cumplen ambas metas o si ya se encuentra en dificultad 3, la dificultad se mantiene.
- **Sin degradación:** **Bajo ninguna circunstancia disminuye la dificultad de una pista.**

#### Acoplamiento con Spaced Repetition SM-2 (§1.3):

| Resultado de la Ronda | Efecto en Dificultad | Efecto en Repetición Espaciada (SRS) |
|---|---|---|
| **Fallo** (`roundScore < 3.0`) | Se mantiene | **Reinicio SM-2:** `repetition = 0`, intervalo fijo de **1 día**. |
| **Aprobada sin promoción** (`roundScore >= 3.0` pero no promueve) | Se mantiene | **SM-2 estándar:** `calculateNextReview` utilizando $\text{round}(\text{roundScore})$ como grado de calidad. |
| **Promoción** (`roundScore >= 4.0` y `passRate >= 0.8` con $d < 3$) | $\text{difficulty} + 1$ | **Salto a nuevo nivel:** `repetition = 1`, intervalo fijo `PROMOTION_INTERVAL_DAYS` (**3 días** — material nuevo requiere repaso pronto). El `efactor` se conserva del cómputo SM-2. |
| **Dificultad 3 con alto desempeño** | Se mantiene en 3 (tope) | **SM-2 estándar:** consolida intervalos largos de dominio. |

---

### 1.3 Generalización del Servicio de IA Multimodal (`geminiService.js`)

Se transforma y generaliza el servicio de inferencia en [server/src/services/geminiService.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/geminiService.js), sustituyendo la función `evaluateMathVisionSolution` por `evaluateRoundSolutions`:

```javascript
/**
 * Evalúa las soluciones manuscritas de una ronda completa de ejercicios a partir de 1 a 6 imágenes.
 *
 * @param {Object} params
 * @param {Object} params.round - Datos de la ronda (topicTitle, category, difficulty)
 * @param {Array<{ order: number, statement: string, referenceSolution: string }>} params.exercises - Lista de ejercicios
 * @param {string[]} params.imagesBase64 - Array de 1 a 6 cadenas Base64 (JPEG)
 * @returns {Promise<{
 *   exercises: Array<{ order: number, found: boolean, score: number, feedback_paso_a_paso: string, hint: string }>,
 *   overall_feedback: string
 * }>}
 */
export async function evaluateRoundSolutions({ round, exercises, imagesBase64 })
```

#### Características del Servicio de Inferencia:
1. **Soporte Multi-imagen (1 a 6 imágenes):**
   - Acepta entre 1 y 6 imágenes en Base64 (sanitizando prefijos `data:image/...;base64,`).
   - Cada imagen se empaqueta como una parte inline (`inlineData: { mimeType: 'image/jpeg', data }`).
   - Permite que los ejercicios de la ronda estén repartidos en distintas páginas o agrupados en una sola libreta.

2. **Inyección Estructurada de Enunciados y Soluciones de Referencia:**
   - Para cada ejercicio de la ronda se incluye explícitamente en el prompt:
     - `order`: Número ordinal del ejercicio dentro de la ronda.
     - `statement`: Enunciado original en Markdown + notación LaTeX.
     - `referenceSolution`: Guía canónica de solución, teoremas requeridos y criterios clave del catálogo.

3. **Rúbricas Pedagógicas Especializadas por Categoría y Dificultad:**
   - **Técnica (`technique`):** Audita la precisión del cómputo algebraico, manipulación de signos, jerarquía de operaciones, factorizaciones y simplificación analítica.
     - *Dificultad 1:* Operaciones básicas y aritméticas; tolerancia cero a errores de signo.
     - *Dificultad 2:* Manipulaciones compuestas y combinadas.
     - *Dificultad 3:* Expresiones analíticas extensas y álgebra avanzada.
   - **Aplicación (`application`):** Audita el planteamiento y modelado analítico, la formulación de relaciones geométricas o físicas, y la correcta aplicación de teoremas de cálculo (TFC, regla de la cadena, optimización, tasas de cambio relacionadas).
     - *Dificultad 1:* Identificación directa de variables y aplicación inmediata de teoremas.
     - *Dificultad 2:* Modelado en múltiples pasos y justificación de hipótesis del teorema.
     - *Dificultad 3:* Problemas de optimización y modelado no trivial con análisis cualitativo.
   - **Demostración (`proof`):** Audita el rigor deductivo formal, la validez lógica de cada implicación, el uso estricto de cuantificadores ($\forall, \exists$), la verificación explícita de hipótesis y la fundamentación axiomática. Penaliza saltos injustificados y razonamientos circulares.
     - *Dificultad 1:* Demostraciones directas y propiedades algebraicas fundamentales.
     - *Dificultad 2:* Inducción matemática y demostraciones por contradicción.
     - *Dificultad 3:* Rigor épsilon-delta y deducciones analíticas avanzadas (Spivak).

4. **Detección de Cobertura y Ejercicios No Localizados (`found: false`):**
   - El modelo debe buscar cada ejercicio por su numeración o contenido en el lote de fotos.
   - Si un ejercicio no aparece resuelto en las páginas provistas o la imagen está cortada/ilegible, el modelo debe retornar obligatoriamente `"found": false`, score $0$ y reportar qué ocurrió en el feedback.

5. **Salida Forzada en JSON con Configuración Estricta:**
   - Uso de `responseMimeType: 'application/json'` con `temperature: 0.2` en la configuración de Gemini 1.5 Pro (`@google/genai`).
   - Formato de salida estipulado:
     ```json
     {
       "exercises": [
         {
           "order": 1,
           "found": true,
           "score": 5,
           "feedback_paso_a_paso": "Paso 1: Planteamiento correcto. Paso 2: Factorización impecable...",
           "hint": "Revisa los signos intermedios antes de simplificar."
         }
       ],
       "overall_feedback": "Buen dominio general de la técnica algebraica en esta ronda."
     }
     ```

6. **Parsing Defensivo y Normalización:**
   - Limpieza de bloques markdown (````json ... ````) y extracción defensiva por expresiones regulares si el JSON contiene delimitadores externos.
   - Normalización de calificaciones al rango entero $[0, 5]$.
   - Manejo de entorno offline: Si `GEMINI_API_KEY` no está configurada, provee una respuesta determinista simulada para permitir pruebas unitarias sin dependencias externas.

---

### 1.4 Contrato Formal de la API HTTP (`POST /api/rounds/:id/evaluate`)

El endpoint se ubica en [server/src/routes/rounds.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/rounds.js):

#### Endpoint: `POST /api/rounds/:id/evaluate`

#### Request:
- **Parámetro URL:** `:id` (ObjectId válido de MongoDB correspondiente a la ronda).
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "images": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "/9j/4AAQSkZJRg..."
    ]
  }
  ```

#### Respuestas:

##### `200 OK` — Evaluación Exitosa y Persistencia Completada
```json
{
  "roundScore": 4.3,
  "passRate": 1.0,
  "promoted": true,
  "previousDifficulty": 1,
  "newDifficulty": 2,
  "nextReviewAt": "2026-10-12T19:30:00.000Z",
  "results": [
    {
      "exerciseId": "65f2b3c4d5e6f7a8b9c00101",
      "order": 1,
      "score": 5,
      "feedback_paso_a_paso": "Paso 1: Factorización de diferencia de cuadrados $(x-2)(x+2)$ correcta. Paso 2: Cancelación válida.",
      "hint": "Excelente dominio."
    },
    {
      "exerciseId": "65f2b3c4d5e6f7a8b9c00102",
      "order": 2,
      "score": 4,
      "feedback_paso_a_paso": "Paso 1: Denominador común bien obtenido. Paso 2: Error menor de signo en la suma del numerador.",
      "hint": "Ten cuidado con los signos al expandir el numerador."
    },
    {
      "exerciseId": "65f2b3c4d5e6f7a8b9c00103",
      "order": 3,
      "score": 4,
      "feedback_paso_a_paso": "Paso 1: Factorización de trinomio cuadrado perfecto correcta. Paso 2: Simplificación adecuada.",
      "hint": "Continúa verificando las restricciones de dominio."
    }
  ],
  "overall_feedback": "Ronda solventada con solvencia. Promovido a Dificultad 2 para el próximo repaso."
}
```

##### `422 Unprocessable Entity` — Ejercicios No Encontrados en las Fotos
Si el análisis de Gemini determina que uno o más ejercicios de la ronda no aparecen en las imágenes (`found: false` o falta en la respuesta):
- **Efecto en Base de Datos:** **No se muta la base de datos.** La ronda permanece en `status: 'pending'`, los resultados previos no se alteran y el `TopicTrack` no se modifica.
- **Respuesta:**
  ```json
  {
    "error": "exercises_not_found",
    "missing": [2, 3]
  }
  ```
- **Propósito:** Permitir a la interfaz de usuario informar al estudiante qué ejercicios faltan para que capture páginas adicionales de su libreta y reintente la evaluación.

##### `409 Conflict` — Ronda Ya Evaluada
Si la ronda se encuentra en estado `status === 'evaluated'`:
```json
{
  "error": "Round already evaluated"
}
```

##### `400 Bad Request` — Payload Inválido o ID Inválido
- Si `:id` no es un ObjectId válido de Mongoose (`{ error: 'Invalid round ID' }`).
- Si falta `images`, no es un array, o su longitud está fuera del rango $[1, 6]$ (`{ error: 'images must be an array of 1 to 6 base64 strings' }`).
- Si alguno de los elementos del array no es una cadena Base64 válida o está vacío (`{ error: 'Invalid image data' }`).

##### `404 Not Found` — Ronda Inexistente
Si no existe ninguna ronda con el `:id` provisto (`{ error: 'Round not found' }`).

##### `502 Bad Gateway` — Falla en Proveedor de IA o Respuesta Malformada
Si la llamada al SDK de Gemini falla por red/cuota, o si la respuesta no pudo ser parseada ni corregida:
```json
{
  "error": "AI evaluation service unavailable",
  "details": "..."
}
```

---

### 1.5 Persistencia Atómica e Integración con `computeRoundOutcome`

Una vez obtenidas y validadas las evaluaciones individuales de los ejercicios:
1. **Mapeo de Ejercicios y Soluciones:**
   - La ronda almacena los identificadores `exerciseId` y `order`.
   - Se empareja cada resultado devuelto por Gemini con su respectivo `exerciseId` usando el campo `order`.
2. **Cálculo de Progresión:**
   - Se invoca la función funcional pura:
     ```javascript
     const outcome = computeRoundOutcome({
       scores: results.map((r) => r.score),
       track: topicTrack,
     });
     ```
3. **Persistencia Atómica en [Round](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js):**
   - `status = 'evaluated'`
   - `results = results.map(r => ({ exerciseId, score, feedback_paso_a_paso, hint }))`
   - `roundScore = outcome.roundScore`
   - `passRate = outcome.passRate`
   - `promoted = outcome.promoted`
   - `previousDifficulty = topicTrack.difficulty`
   - `newDifficulty = outcome.newDifficulty`
   - `evaluatedAt = new Date()`
4. **Persistencia Atómica en [TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js):**
   - `difficulty = outcome.newDifficulty`
   - `repetition = outcome.srs.repetition`
   - `interval = outcome.srs.interval`
   - `efactor = outcome.srs.efactor`
   - `dueDate = outcome.srs.dueDate`
   - `lastRoundScore = outcome.roundScore`
   - `roundsCompleted = topicTrack.roundsCompleted + 1`
5. **Garantía Transaccional / Consistencia Defensiva:**
   - Si ocurre un fallo en cualquiera de las actualizaciones, la ronda no queda parcialmente actualizada en estado inconsistente.

---

### 1.6 Deprecación y Purga Definitiva de `POST /api/evaluate-math`

Como parte de la evolución arquitectónica:
1. **Eliminación del Endpoint Legado:**
   - Se elimina la ruta `POST /api/evaluate-math` de [server/src/routes/practice.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/practice.js).
   - Se retira `practiceRouter` de [server/src/app.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/app.js) si queda sin rutas adicionales, eliminando los montajes `/api` y `/api/practice`.
2. **Migración de Pruebas:**
   - Se sustituye el archivo [server/tests/practice.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/practice.test.js) por la nueva suite exhaustiva [server/tests/roundEvaluation.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/roundEvaluation.test.js).
3. **Limpieza en el Cliente y Referencias:**
   - Se eliminan o migran las referencias a `/api/evaluate-math` en [client/src/components/MathVisionUploader.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/MathVisionUploader.jsx), [client/tests/MathVisionUploader.test.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/tests/MathVisionUploader.test.jsx) y [tests/e2e/math-vision.spec.js](file:///home/teran/proyectos/mathcoach-sparring/tests/e2e/math-vision.spec.js).
   - Al finalizar, `grep -rn "/api/evaluate-math" server/src client/src` debe retornar 0 resultados.

---

## 2. Criterios de Aceptación (AC)

> [!IMPORTANT]
> Los siguientes Criterios de Aceptación (AC-1 al AC-4) corresponden de forma exacta a los estipulados en [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md#L219-L224) para **[MATH-US-12]**.

### AC-1: Validaciones de Entrada y Códigos de Error según Contrato
- [x] `POST /api/rounds/:id/evaluate` valida rigurosamente los parámetros de entrada:
  - Retorna `400 Bad Request` si el parámetro `:id` no es un ObjectId válido de MongoDB.
  - Retorna `400 Bad Request` si `images` no es provisto, no es un array, o su longitud está fuera del rango de 1 a 6 (`images.length < 1 || images.length > 6`).
  - Retorna `400 Bad Request` si algún elemento de `images` no es un string Base64 válido o está vacío.
  - Retorna `404 Not Found` si la ronda con el identificador `:id` no existe en la base de datos.
  - Retorna `409 Conflict` si la ronda ya tiene estado `status === 'evaluated'`, impidiendo evaluaciones duplicadas.
  - Retorna `422 Unprocessable Entity` con el cuerpo `{ error: 'exercises_not_found', missing: [order...] }` si Gemini no localiza uno o más ejercicios en las imágenes provistas. **En este caso, la base de datos no sufre mutaciones** (`Round` continúa `pending` y `TopicTrack` no se altera).
  - Retorna `502 Bad Gateway` ante fallos de conexión con el proveedor de IA o respuestas ininteligibles que no puedan corregirse.

### AC-2: Persistencia Atómica post-Evaluación con `computeRoundOutcome`
- [x] Tras una evaluación satisfactoria por parte de la IA, se actualiza atómicamente la entidad [Round](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js):
  - `status`: `'evaluated'`
  - `results`: Array con los resultados de cada ejercicio (`exerciseId`, `score`, `feedback_paso_a_paso`, `hint`).
  - `roundScore`: Promedio aritmético a 1 decimal devuelto por `computeRoundOutcome`.
  - `passRate`: Tasa de aprobación calculada por el motor.
  - `promoted`: Booleano determinando si asciende de dificultad.
  - `previousDifficulty`: Dificultad previa de la pista.
  - `newDifficulty`: Dificultad actualizada resultante del motor adaptativo.
  - `evaluatedAt`: Marca temporal de la evaluación.
- [x] Se actualiza atómicamente la entidad [TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js):
  - `difficulty`: Nueva dificultad (`newDifficulty`).
  - `repetition`: Nuevo valor SM-2 calculado por `computeRoundOutcome`.
  - `interval`: Nuevo intervalo de días calculado.
  - `efactor`: Factor de facilidad SM-2 actualizado.
  - `dueDate`: Nueva fecha de repaso programada según las reglas de SRS (§1.3).
  - `lastRoundScore`: Score obtenido en esta ronda.
  - `roundsCompleted`: Incrementado en 1 (`roundsCompleted + 1`).
- [x] La respuesta HTTP `200 OK` retorna `{ roundScore, passRate, promoted, previousDifficulty, newDifficulty, nextReviewAt, results, overall_feedback }`.

### AC-3: Cobertura Automatizada con Gemini Mockeado
- [x] Se implementa la suite de pruebas [server/tests/roundEvaluation.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/roundEvaluation.test.js) utilizando Supertest y MongoMemoryServer, con el SDK de Gemini (`@google/genai`) mockeado adecuadamente.
- [x] Se cubren los siguientes escenarios de negocio fundamentales:
  1. **Promoción Adaptativa:** Ronda con `roundScore >= 4.0` y `passRate >= 0.8` en dificultad 1 o 2: asciende a `difficulty + 1`, establece `repetition = 1` e intervalo de `PROMOTION_INTERVAL_DAYS` (3 días).
  2. **Permanencia Aprobada:** Ronda aprobada que no alcanza los umbrales de promoción o ya está en dificultad 3: mantiene dificultad y avanza el intervalo según la fórmula SM-2 estándar.
  3. **Fallo de Ronda:** Ronda con `roundScore < 3.0`: mantiene dificultad y reinicia el calendario SRS (`repetition = 0`, intervalo de 1 día).
  4. **Ejercicio No Encontrado (HTTP 422):** Simulación de libreta incompleta donde Gemini reporta `found: false` para uno o más ejercicios: responde con la lista `missing` y verifica que ni `Round` ni `TopicTrack` fueron mutados.
  5. **Manejo de Errores de IA (HTTP 502):** Simulación de error de API o JSON irrecuperable: responde 502 sin corromper el estado de la base de datos.

### AC-4: Eliminación Definitiva de `/api/evaluate-math`
- [x] El endpoint legado `/api/evaluate-math` queda eliminado de los enrutadores de Express.
- [x] Se purga el enrutador [server/src/routes/practice.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/practice.js) y se remueve su montaje en [server/src/app.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/app.js).
- [x] Se retiran o actualizan todas las pruebas que dependían del endpoint legado ([server/tests/practice.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/practice.test.js), pruebas unitarias de cliente y fixtures E2E).
- [x] Se verifica mediante `grep` que no restan referencias activas a `/api/evaluate-math` en `server/src` ni en `client/src`.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos Identificados en el Grafo de Conocimiento:**
  - `[MATH-US-12] Evaluación Multimodal de Rondas + Progresión`
  - `geminiService.js` ([server/src/services/geminiService.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/geminiService.js)) (`evaluateRoundSolutions`, `getClient`)
  - `rounds.js` ([server/src/routes/rounds.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/rounds.js)) (`roundsRouter`, `POST /:id/evaluate`)
  - `computeRoundOutcome` ([server/src/utils/progressionEngine.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/utils/progressionEngine.js))
  - `Round` ([server/src/models/Round.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js))
  - `TopicTrack` ([server/src/models/TopicTrack.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js))
  - `Exercise` ([server/src/models/Exercise.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Exercise.js))
  - `MathTopic` ([server/src/models/MathTopic.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js))
  - `app.js` ([server/src/app.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/app.js))
  - `server/src/routes/practice.js` (Eliminado)
  - `server/tests/practice.test.js` (Reemplazado por `roundEvaluation.test.js`)
  - `server/tests/roundEvaluation.test.js` (Nueva suite de integración)

- **Archivos Intervenidos:**
  - **Nuevos:**
    - [server/tests/roundEvaluation.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/roundEvaluation.test.js): Suite exhaustiva de pruebas HTTP para `POST /api/rounds/:id/evaluate` con mocks de Gemini y MongoMemoryServer.
  - **Modificados:**
    - [server/src/services/geminiService.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/geminiService.js): Implementación de `evaluateRoundSolutions` con soporte de 1 a 6 imágenes, inyección de `statement` y `referenceSolution`, y rúbricas por categoría y dificultad.
    - [server/src/routes/rounds.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/rounds.js): Incorporación del endpoint `POST /:id/evaluate`, orquestación con Gemini y actualización atómica en base de datos.
    - [server/src/app.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/app.js): Eliminación de la importación y montaje de `practiceRouter`.
    - [client/src/components/MathVisionUploader.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/MathVisionUploader.jsx): Limpieza de llamada legada a `/api/evaluate-math`.
    - [client/tests/MathVisionUploader.test.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/tests/MathVisionUploader.test.jsx): Actualización de mocks y tests relacionados con la evaluación.
    - [tests/e2e/math-vision.spec.js](file:///home/teran/proyectos/mathcoach-sparring/tests/e2e/math-vision.spec.js): Ajuste de intercepciones de rutas hacia `/api/rounds/*/evaluate`.
    - [docs/ARCHITECTURE.md](file:///home/teran/proyectos/mathcoach-sparring/docs/ARCHITECTURE.md): Actualización de sección 7.5 y árbol de archivos.
    - [.antigravity/heartbeat.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/heartbeat.md): Actualización del estado a `Done`.
  - **Eliminados:**
    - `server/src/routes/practice.js`: Eliminación completa de la ruta legada `/evaluate-math`.
    - `server/tests/practice.test.js`: Reemplazado formalmente por `roundEvaluation.test.js`.

---

## 4. Estrategia de Pruebas y Cobertura

### 4.1 Plan de Pruebas en `server/tests/roundEvaluation.test.js`

1. **Validaciones HTTP y Sanitización de Entrada:**
   - `:id` no válido como ObjectId $\rightarrow$ `400 Bad Request`.
   - Ronda no encontrada en BD $\rightarrow$ `404 Not Found`.
   - `images` ausente o no es array $\rightarrow$ `400 Bad Request`.
   - `images` con 0 elementos o más de 6 elementos $\rightarrow$ `400 Bad Request`.
   - `images` con strings vacíos o tipos no válidos $\rightarrow$ `400 Bad Request`.
   - Ronda ya evaluada (`status === 'evaluated'`) $\rightarrow$ `409 Conflict`.

2. **Detección de Ejercicios Incompletos (HTTP 422):**
   - Ronda de 3 ejercicios de Técnica. Gemini reporta `found: false` para el ejercicio de orden 2.
   - Respuesta esperada: `422 { error: 'exercises_not_found', missing: [2] }`.
   - Verificación de no-mutación: `Round.findById` sigue en `status: 'pending'`, `results` vacío, y `TopicTrack` mantiene exactamente sus valores de dificultad y fechas previas.

3. **Escenario de Promoción Adaptativa:**
   - Pista en dificultad 1 con 3 ejercicios.
   - Gemini mockeado otorga scores $[5, 4, 4]$ ($\text{roundScore} = 4.3$, $\text{passRate} = 1.0$).
   - Respuesta esperada: `200 OK` con `promoted: true`, `previousDifficulty: 1`, `newDifficulty: 2`, y `nextReviewAt` a 3 días en el futuro (`PROMOTION_INTERVAL_DAYS`).
   - Verificación en MongoDB: `TopicTrack.difficulty` asciende a 2, `TopicTrack.repetition` es 1, `roundsCompleted` incrementa en 1, y `Round.status` es `'evaluated'`.

4. **Escenario de Permanencia Aprobada:**
   - Pista en dificultad 1 con 3 ejercicios. Scores $[3, 3, 4]$ ($\text{roundScore} = 3.3$, $\text{passRate} = 1.0$). No cumple umbral de 4.0.
   - Respuesta esperada: `200 OK` con `promoted: false`, `previousDifficulty: 1`, `newDifficulty: 1`.
   - Verificación en MongoDB: `TopicTrack.difficulty` se mantiene en 1 y se aplica el cálculo estándar de SM-2.

5. **Escenario de Fallo de Ronda:**
   - Pista en dificultad 2 con 3 ejercicios. Scores $[1, 2, 2]$ ($\text{roundScore} = 1.7$, $\text{passRate} = 0.0$).
   - Respuesta esperada: `200 OK` con `promoted: false`, `newDifficulty: 2`.
   - Verificación en MongoDB: `TopicTrack.difficulty` permanece en 2 (sin degradación), pero SM-2 se reinicia (`repetition = 0`, intervalo de 1 día).

6. **Manejo de Errores Externos e Inestabilidad de IA:**
   - Error de red o rechazo de API por parte de `@google/genai` $\rightarrow$ `502 Bad Gateway`.
   - Gemini retorna texto plano o JSON sintácticamente corrupto que no puede recuperarse $\rightarrow$ `502 Bad Gateway`.
   - Ningún error de IA deja la ronda en estado corrupto.

7. **Verificación de Purga de Código Legado:**
   - Test que verifica que solicitudes a `POST /api/evaluate-math` o `POST /api/practice/evaluate-math` retornan `404 Not Found`.

---

## 5. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
> mathcoach-sparring@1.0.0 test
> npm run test:server && npm run test:client

> mathcoach-sparring@1.0.0 test:server
> npm --workspace=server test
> vitest run

 ✓ tests/roundEvaluation.test.js (13 tests) 2226ms
 ✓ tests/catalog.test.js (9 tests) 2584ms
 ✓ tests/rounds.api.test.js (13 tests) 2110ms
 ✓ tests/models.test.js (19 tests) 1890ms
 ✓ tests/topics.test.js (7 tests) 1400ms
 ✓ tests/progressionEngine.test.js (11 tests) 25ms
 ✓ tests/srsCalculator.test.js (11 tests) 14ms
 ✓ tests/roundBuilder.test.js (15 tests) 10ms
 ✓ tests/health.test.js (2 tests) 8ms

 Test Files  9 passed (9)
      Tests  100 passed (100)
   Duration  6.69s

> mathcoach-sparring@1.0.0 test:client
> npm --workspace=client test
> vitest run

 ✓ tests/MathVisionUploader.test.jsx (11 tests) 1432ms
 ✓ tests/App.test.jsx (3 tests) 850ms

 Test Files  2 passed (2)
      Tests  14 passed (14)
   Duration  4.76s

Total: 114 tests pasados con 100% de éxito en servidor y cliente.
```

### Verificación de Purga del Endpoint Legado

```bash
$ grep -ri "evaluate-math" server/src || echo "PULCRITUD CONFIRMADA: Endpoint legado retirado"
PULCRITUD CONFIRMADA: Endpoint legado retirado
```

---

## 6. Commit de Cierre en dev

`Pendiente de commit`
