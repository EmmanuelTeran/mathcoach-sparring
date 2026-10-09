# [MATH-US-04] Pipeline Evaluador Multimodal (Gemini 1.5 Pro) y Actualización SRS

- **Estado:** Verificado
- **Rama:** `feature/MATH-US-04-multimodal-pipeline`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** -

## 1. Descripción

Construir e integrar el pipeline evaluador multimodal para **MathCoach Sparring** a través del endpoint `POST /api/evaluate-math`. 

Cuando el estudiante resuelve un ejercicio de matemáticas a mano en su libreta y captura la foto con el componente de Active Recall (`MathVisionUploader.jsx`), la imagen es enviada en formato Base64 JPEG junto al identificador del problema (`problemId`). El backend debe procesar esta solicitud orquestando tres etapas críticas:

1. **Inspección Visual y Razonamiento con IA Multimodal:** Invocar el modelo `gemini-1.5-pro` mediante el SDK oficial `@google/genai`. El análisis pedagógico debe ser guiado por un *System Prompt* adaptado rigurosamente al nivel del ejercicio:
   - **Nivel 1 (Computacional / Mecánico - CONAMAT):** Enfoque en álgebra elemental, aritmética, jerarquía de operaciones, factorización y exactitud en el cómputo paso a paso.
   - **Nivel 2 (Modelado y Cálculo Aplicado - Stewart):** Enfoque en planteamiento analítico, aplicación de teoremas de cálculo, derivación/integración y consistencia física/geométrica.
   - **Nivel 3 (Rigor Formal y Demostraciones - Spivak):** Enfoque en validez deductiva, cuantificadores ($\epsilon$-$\delta$), completitud de hipótesis y justificación de axiomas lógicos.
2. **Estructura JSON Forzada:** Garantizar mediante `responseMimeType: 'application/json'` y parsing defensivo que la IA responda únicamente un JSON estricto con:
   ```json
   {
     "score": 0, // entero entre 0 y 5
     "feedback_paso_a_paso": "Desglose exhaustivo por pasos de la resolución...",
     "hint": "Pista socrática o recomendación metodológica sin dar la respuesta final..."
   }
   ```
3. **Cálculo SRS SM-2 y Persistencia Atómica:** Tomar el `score` obtenido (escala 0 a 5) y alimentar la función matemática pura existente `calculateNextReview(currentStage, easeFactor, score, previousInterval)`. Actualizar en MongoDB mediante Mongoose (`MathTopic`) los nuevos metadatos de repaso espaciado (`repetition`, `interval`, `efactor`, `dueDate`), e incorporar el intento con su imagen, retroalimentación y calificación en el subdocumento `history`.

---

## 2. Criterios de Aceptación (AC)

### AC-1: Endpoint `POST /api/evaluate-math` y Validación Defensiva de Entrada
- [x] **Ruta y Control:** Registrar la ruta `POST /api/evaluate-math` en Express (dentro de `server/src/routes/practice.js` / `practiceRouter.js`, montada adecuadamente en `/api` o accesible como `/api/evaluate-math`).
- [x] **Recepción de Campos Obligatorios:** El body JSON debe contener:
  - `problemId`: Cadena alfanumérica o `ObjectId` de MongoDB válido correspondiente al ejercicio en `MathTopic`.
  - `image`: Cadena Base64 con o sin prefijo Data URL (`data:image/jpeg;base64,...` o base64 plano).
- [x] **Validación y Errores 400 (Bad Request):**
  - Si falta `problemId` o está vacío, responder `400 Bad Request` con `{ error: 'problemId is required' }`.
  - Si falta `image` o no es un string Base64 válido, responder `400 Bad Request` con `{ error: 'image must be a valid base64 string' }`.
- [x] **Validación y Errores 404 (Not Found):**
  - Si el `problemId` no existe en la colección `MathTopic` (o el ID es sintácticamente inválido para Mongoose), responder `404 Not Found` con `{ error: 'Math problem not found' }`.

### AC-2: Inferencia Multimodal con Gemini 1.5 Pro y Prompts Estratificados por Nivel
- [x] **Cliente `@google/genai`:** Utilizar la instancia configurada del SDK `@google/genai` (empleando la variable de entorno `GEMINI_API_KEY`).
- [x] **Extracción y Formato de Imagen:** Sanitizar la cadena Base64 removiendo cualquier encabezado data URI (`data:image/...;base64,`) y construir el objeto `inlineData` para el SDK:
  ```javascript
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: sanitizedBase64
    }
  }
  ```
- [x] **Modelo y Parámetros:** Invocar el modelo `gemini-1.5-pro` configurando `temperature: 0.2` para máxima consistencia y fidelidad evaluativa.
- [x] **System Prompts Estratificados por `level`:**
  - **Nivel 1 (Computacional):** Actuar como profesor de álgebra/aritmética riguroso pero claro. Evaluar orden algebraico, manipulación de signos, simplificación y exactitud del resultado final. Puntuación basada en detección precisa del paso exacto con error algebraico.
  - **Nivel 2 (Modelado):** Actuar como profesor de cálculo y matemáticas aplicadas. Evaluar planteamiento analítico de funciones, tasas de cambio, límites, derivadas, integrales y justificación geométrica/conceptual del problema.
  - **Nivel 3 (Demostración):** Actuar como catedrático de análisis matemático riguroso. Evaluar la validez de la demostración lógica formal (directa, inducción, contradicción, $\epsilon$-$\delta$). No perdonar saltos lógicos injustificados ni hipótesis no declaradas.
- [x] **Contexto del Enunciado:** Proporcionar en el prompt el título del tema, nivel, fuente y el enunciado original (`problemStatement`) para que el modelo verifique si lo resuelto corresponde exactamente a lo solicitado.

### AC-3: Salida JSON Estricta Forzada con `responseMimeType`
- [x] **Configuración de MimeType:** Establecer `responseMimeType: 'application/json'` en la configuración de la llamada a Gemini.
- [x] **Estructura Obligatoria del Payload JSON retornado por la IA:**
  ```json
  {
    "score": 4,
    "feedback_paso_a_paso": "Paso 1: Planteamiento y factorización correctos...",
    "hint": "Recuerda que..."
  }
  ```
- [x] **Normalización y Sanitización del Score:**
  - Garantizar que `score` sea un número entero acotado entre `0` y `5` (en caso de decimales o valores fuera de rango, redondear y aplicar `Math.max(0, Math.min(5, Math.round(score)))`).
- [x] **Tolerancia a Bloques de Código Markdown:** Si la respuesta de la IA viene envuelta en bloques ` ```json ... ``` `, extraer y parsear de manera limpia antes de propagar.

### AC-4: Motor SRS SM-2 y Persistencia Atómica en `MathTopic`
- [x] **Invocación de `calculateNextReview`:**
  - Pasar el `score` resultante junto al estado previo del documento:
    ```javascript
    const srsResult = calculateNextReview(
      problem.repetition,
      problem.efactor,
      score,
      problem.interval
    );
    ```
- [x] **Actualización de Metadatos SRS en Mongoose:**
  - `problem.repetition = srsResult.repetition;` (o alias `srsStage`)
  - `problem.interval = srsResult.interval;` (o alias `intervalDays`)
  - `problem.efactor = srsResult.efactor;` (o alias `easeFactor`)
  - `problem.dueDate = srsResult.dueDate;` (o alias `nextReviewAt`)
- [x] **Registro en Historial (`history`):**
  - Añadir un nuevo subdocumento al arreglo `problem.history` con:
    ```javascript
    {
      score,
      feedback_paso_a_paso: aiResult.feedback_paso_a_paso,
      hint: aiResult.hint,
      imageUrl: image.length > 500 ? image.substring(0, 100) + '...[truncated]' : image,
      evaluatedAt: new Date()
    }
    ```
- [x] **Persistencia:** Ejecutar `await problem.save()` asegurando consistencia de datos.

### AC-5: Formato de Respuesta Exitosa (200 OK)
- [x] Responder con código HTTP `200 OK` y el siguiente cuerpo JSON:
  ```json
  {
    "success": true,
    "score": 4,
    "feedback_paso_a_paso": "Paso 1: Correcto...",
    "hint": "Revisa...",
    "srs": {
      "repetition": 2,
      "interval": 6,
      "efactor": 2.6,
      "dueDate": "2026-10-15T13:45:00.000Z"
    }
  }
  ```

### AC-6: Resiliencia, Fallbacks y Manejo Robusto de Errores
- [x] **Fallo de API Externa de Gemini (502 / 500):** Si la API de Google falla (cuota excedida, error 503, red o timeout), capturar la excepción y responder `502 Bad Gateway` o `500 Internal Server Error` con `{ error: 'AI evaluation service unavailable', details: error.message }` sin crashear el servidor Express.
- [x] **Fallback Offline para Tests y Desarrollo Local:** Si `GEMINI_API_KEY` no está configurada en el entorno, contar con un fallback determinista que evalúe la entrada y retorne un resultado coherente para permitir la ejecución de tests unitarios y CI sin requerir credenciales de producción.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `practiceRouter`, `server/src/routes/practice.js`, `server/src/services/geminiService.js`, `MathTopic`, `srsCalculator`, `POST /api/evaluate-math`.
- **Archivos a intervenir:**
  - `server/src/services/geminiService.js`: Implementación de la función `evaluateMathVisionSolution({ topic, imageBase64 })` con soporte multimodal en `@google/genai`, selección de modelo `gemini-1.5-pro`, system prompt estratificado por niveles 1, 2 y 3, `responseMimeType: 'application/json'` y fallback offline defensivo.
  - `server/src/routes/practice.js`: Implementación del endpoint `POST /api/evaluate-math`, validación de entrada, cálculo de SRS y persistencia en `MathTopic`.
  - `server/src/app.js`: Asegurar que el router o ruta responda directamente a `POST /api/evaluate-math` (alineado con la llamada del frontend y pruebas E2E).
  - `server/tests/practice.test.js`: Suite completa de pruebas con Vitest y Supertest cubriendo casos de éxito, validaciones 400/404, parsing de Gemini, actualización de SRS e historial de Mongoose.

---

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
> @mathcoach-sparring/server@1.0.0 test
> vitest run tests/practice.test.js tests/mathTopic.test.js tests/srsCalculator.test.js tests/health.test.js

 RUN  v3.2.7 /home/teran/proyectos/mathcoach-sparring/server

 ✓ tests/mathTopic.test.js (5 tests) 1018ms
 ✓ tests/health.test.js (1 test) 1073ms
 ✓ tests/srsCalculator.test.js (11 tests) 10ms
 ✓ tests/practice.test.js (17 tests) 1483ms
   ✓ Practice Hard Skills API Integration Tests > POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2) > AC-1: retorna 400 Bad Request si falta problemId o está vacío
   ✓ Practice Hard Skills API Integration Tests > POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2) > AC-1: retorna 400 Bad Request si falta image o está vacía
   ✓ Practice Hard Skills API Integration Tests > POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2) > AC-1: retorna 404 Not Found si el problemId no existe en MathTopic
   ✓ Practice Hard Skills API Integration Tests > POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2) > AC-1: retorna 404 Not Found si el problemId no es un ObjectId válido
   ✓ Practice Hard Skills API Integration Tests > POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2) > AC-2, AC-3, AC-4 & AC-5: evalúa con éxito ejercicio Nivel 1 (CONAMAT), usa gemini-1.5-pro, actualiza SRS e historial
   ✓ Practice Hard Skills API Integration Tests > POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2) > AC-2: evalúa con prompt estratificado de Cálculo en Nivel 2 (Stewart)
   ✓ Practice Hard Skills API Integration Tests > POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2) > AC-2: evalúa con prompt de Rigor Formal y Demostraciones en Nivel 3 (Spivak)
   ✓ Practice Hard Skills API Integration Tests > POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2) > AC-6: maneja fallo de la API de Gemini retornando 502 Bad Gateway sin crashear

 Test Files  4 passed (4)
      Tests  34 passed (34)
   Duration  2.86s
```

```bash
> @mathcoach-sparring/client@1.0.0 test
> vitest run

 RUN  v3.2.7 /home/teran/proyectos/mathcoach-sparring/client

 ✓ src/utils/codeRunner.test.js (13 tests) 14ms
 ✓ tests/MathVisionUploader.test.jsx (9 tests) 854ms

 Test Files  2 passed (2)
      Tests  22 passed (22)
   Duration  3.64s
```

### Tests E2E (Playwright)

El harness E2E en `tests/e2e/math-vision.spec.js` valida el flujo completo de Active Recall desde el componente `MathVisionUploader.jsx`, interceptando `POST /api/evaluate-math` con respuesta 200 OK determinista.

---

## 5. Commit de Cierre en dev

`<!-- PENDIENTE: Commit generado tras verificación y merge -->`

