# [US-10] Coding Playground Interactivo (Monaco + Sandbox Runner + Test Cases)

- **Estado:** En Progreso
- **Rama:** `feature/US-10-coding-playground`
- **Fecha de Inicio:** 2026-10-03
- **Fecha de Cierre:** -

## 1. Descripción

Incorporar un **Coding Playground** estilo LeetCode/HackerRank como cuarta pestaña de la app. El usuario elige un reto de código (filtrado por nivel Junior/Mid/Senior), lo resuelve en un editor Monaco con tema oscuro, lo ejecuta **en el navegador** dentro de un Web Worker aislado contra `testCases` definidos en MongoDB y ve resultados por test y logs de consola. Al enviar, el backend audita la solución con Gemini (legibilidad, nombres, Big-O) **solo si todos los tests pasaron**, emite un score 1-5 y reprograma el repaso con el motor SRS existente (`calculateNextReview`).

**Principios:** TDD estricto (tests en rojo primero), cero sobreingeniería, contratos defensivos. Se reutilizan los patrones existentes de `practice.js` (validación → `Topic.findById` → servicio IA → SRS → `history.push` → `SessionLog.create`).

> **Refinamiento de arquitecto vs. `graph.md`:** se añaden dos campos obligatorios al subdocumento `codingChallenge` que el grafo no listaba: `functionName` (el runner necesita saber qué función invocar) y `description` (el panel izquierdo necesita el enunciado; `Topic` no tiene campo descripción).

---

## 2. Criterios de Aceptación (AC)

### - [x] AC-1: Dependencias Frontend

- Instalar en el workspace `client`: `npm install @monaco-editor/react monaco-editor --workspace=client`.
- **Monaco debe cargarse localmente (sin CDN)** para que los E2E sean deterministas offline. Crear `client/src/utils/monacoSetup.js`:

```js
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });
```

- `monacoSetup.js` se importa **una sola vez** al tope de `CodingPlayground.jsx` (`import '../utils/monacoSetup';`).
- Root `package.json`: cambiar `"test": "npm run test:server"` → `"test": "npm run test:server && npm run test:client"` para que los unit tests del cliente formen parte de la evidencia.

### - [x] AC-2: Subdocumento `codingChallenge` en `server/src/models/Topic.js`

Contrato exacto del schema (añadir sobre `topicSchema`, sin alterar campos existentes):

```js
const testCaseSchema = new mongoose.Schema(
  {
    // Lista de argumentos posicionales: fn(...input). Ej: [[1,2,3]] => fn([1,2,3])
    input: { type: [mongoose.Schema.Types.Mixed], default: [] },
    expected: {
      type: mongoose.Schema.Types.Mixed,
      validate: { validator: (v) => v !== undefined, message: 'expected is required' },
    },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const codingChallengeSchema = new mongoose.Schema(
  {
    functionName: {
      type: String,
      required: true,
      trim: true,
      match: /^[A-Za-z_$][\w$]*$/, // identificador JS válido
    },
    description: { type: String, required: true },
    starterCode: { type: String, required: true },
    testCases: {
      type: [testCaseSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1,
        message: 'codingChallenge requires at least one test case',
      },
    },
    constraints: { type: [String], default: [] },
  },
  { _id: false }
);

// dentro de topicSchema:
codingChallenge: { type: codingChallengeSchema, required: false, default: undefined },
```

- Un `Topic` sin `codingChallenge` sigue siendo válido (retrocompatibilidad con los 62 tópicos actuales).
- `codingChallenge` con `functionName` inválido (ej. `'1abc'`, `'my func'`) → `ValidationError`.
- `codingChallenge` con `testCases: []` → `ValidationError`.

### - [x] AC-3: Motor de Ejecución en Navegador

Dos piezas separadas para que el núcleo sea testeable en Node (Vitest) y el aislamiento real ocurra en el navegador:

**3.a — Núcleo puro `client/src/utils/codeRunner.js`** (sin APIs de DOM; exporta funciones puras):

```js
/**
 * @param {Object} params
 * @param {string} params.code          Código del usuario
 * @param {string} params.functionName  Función a invocar
 * @param {Array<{input: any[], expected: any, isHidden?: boolean}>} params.testCases
 * @returns {RunReport}
 */
export function executeTests({ code, functionName, testCases }) { ... }

/** Igualdad estructural: arrays sensibles al orden, objetos insensibles al orden de claves. */
export function deepEqual(a, b) { ... }

/** Ejecuta en Web Worker con timeout. Solo navegador. */
export function runCodeInWorker({ code, functionName, testCases, timeoutMs = 3000 }) { ... } // => Promise<RunReport>
```

**Contrato `RunReport`:**

```ts
type RunReport = {
  status: 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';
  passedCount: number;
  totalCount: number;           // = testCases.length
  executionTimeMs: number;      // total, redondeado a 2 decimales, >= 0
  logs: Array<{ level: 'log' | 'info' | 'warn' | 'error'; message: string }>;
  results: Array<{
    index: number;
    status: 'PASSED' | 'FAILED';
    input: any[];
    expected: any;
    actual: any;              // undefined si lanzó error
    isHidden: boolean;
    executionTimeMs: number;
    error?: string;           // "TypeError: x is not a function"
  }>;
  error?: { type: 'SyntaxError' | 'ReferenceError' | 'TimeoutError'; message: string };
};
```

**Reglas de ejecución (obligatorias):**

1. Compilación: `new Function('console', '"use strict";\n' + code + '\n;return typeof ' + functionName + " === 'function' ? " + functionName + ' : undefined;')`.
   - Si el constructor lanza `SyntaxError` → `status: 'ERROR'`, `error.type: 'SyntaxError'`, `results: []`, `passedCount: 0`.
2. Si la función no existe tras compilar → `status: 'ERROR'`, `error: { type: 'ReferenceError', message: 'La función "<functionName>" no está definida' }`, `results: []`.
3. Se pasa un `console` falso que captura `log/info/warn/error` en `logs` (orden de llamada). Serialización: strings tal cual; otros valores `JSON.stringify` con fallback a `String(v)`; múltiples args unidos con espacio. Máximo **200** entradas (las siguientes se descartan).
4. Cada test recibe `structuredClone(testCase.input)` (un test no puede contaminar al siguiente) y se invoca `fn(...input)`.
5. Error en runtime dentro de un test → ese test `FAILED` con `error: "<Name>: <message>"`; **los demás tests siguen ejecutándose**.
6. Comparación con `deepEqual(actual, expected)`.
7. Tiempo con `performance.now()` (disponible en Node ≥16 y en workers).
8. `status` global: `PASSED` si `passedCount === totalCount`, si no `FAILED`.

**3.b — Worker `client/src/workers/codeRunner.worker.js`:**

- `self.onmessage = ({ data }) => self.postMessage(executeTests(data));` (importa `executeTests` de `../utils/codeRunner.js`).
- `runCodeInWorker` lo instancia con `new Worker(new URL('../workers/codeRunner.worker.js', import.meta.url), { type: 'module' })`.
- Si no responde en `timeoutMs` → `worker.terminate()` y resuelve `{ status: 'TIMEOUT', passedCount: 0, totalCount, executionTimeMs: timeoutMs, logs: [], results: [], error: { type: 'TimeoutError', message: 'La ejecución superó 3000 ms (¿bucle infinito?)' } }`.
- Se crea un worker **nuevo por ejecución** y se termina siempre al finalizar (evita estado residual).

### - [x] AC-4: Endpoint de listado `GET /api/practice/coding/challenges`

Nuevo router `server/src/routes/codingPractice.js` montado en `app.js` con `app.use('/api/practice', codingPracticeRouter);`.

- **Query:** `?level=junior|mid|senior` (opcional; valor inválido se ignora, igual que `/api/topics/due`).
- **Filtro:** `{ codingChallenge: { $exists: true } }` + nivel.
- **Orden:** `junior → mid → senior`, luego `nextReviewAt` ascendente.
- **Response 200:**

```json
[
  {
    "_id": "674c...",
    "title": "Reto de Código: Suma de Números Pares",
    "level": "junior",
    "srsStage": 0,
    "nextReviewAt": "2026-10-03T22:00:00.000Z",
    "isDue": true,
    "codingChallenge": {
      "functionName": "sumEvenNumbers",
      "description": "Implementa una función que reciba un array de números y devuelva la suma de los pares.",
      "starterCode": "function sumEvenNumbers(numbers) {\n  // tu código aquí\n}\n",
      "constraints": ["No mutar el array de entrada", "Usar métodos de arrays (filter/reduce)"],
      "testCases": [{ "input": [[1, 2, 3, 4]], "expected": 6, "isHidden": false }]
    }
  }
]
```

- `isDue = nextReviewAt <= now`.
- **Nota de diseño (trade-off aceptado):** los tests ocultos se envían al cliente porque la ejecución es client-side; la UI enmascara sus datos. Es una app de entrenamiento personal, no un juez competitivo.
- **Errores:** 500 `{ "error": "Internal Server Error" }`.

### - [x] AC-5: Endpoint de evaluación `POST /api/practice/coding/evaluate`

**Request body:**

```json
{
  "topicId": "674c11112222333344445555",
  "code": "function sumEvenNumbers(numbers) { return numbers.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0); }",
  "testResults": {
    "passedCount": 4,
    "totalCount": 4,
    "executionTimeMs": 1.42,
    "results": [{ "index": 0, "status": "PASSED" }]
  }
}
```

**Validaciones (en este orden, mensajes exactos):**

| Condición | Status | Body |
| --- | --- | --- |
| Falta `topicId` | 400 | `{ "error": "topicId is required" }` |
| `code` no es string, vacío o solo espacios | 400 | `{ "error": "code is required" }` |
| `code.length > 20000` | 400 | `{ "error": "code exceeds 20000 characters" }` |
| `testResults` ausente, o `passedCount`/`totalCount` no son enteros ≥ 0, o `passedCount > totalCount` | 400 | `{ "error": "testResults is invalid" }` |
| Topic no existe | 404 | `{ "error": "Topic not found" }` |
| Topic sin `codingChallenge` | 422 | `{ "error": "Topic has no coding challenge" }` |
| `testResults.totalCount !== topic.codingChallenge.testCases.length` | 400 | `{ "error": "testResults do not match challenge test cases" }` |
| Excepción no controlada | 500 | `{ "error": "Internal Server Error" }` |

**Lógica:**

1. `allTestsPassed = passedCount === totalCount && totalCount > 0`.
2. Si `allTestsPassed` → `evaluateCodingSolution({ topic, code, testResults })` (Gemini). `aiReviewed: true`.
3. Si **no** → **NO se llama a Gemini**. Score determinista: `passedCount === 0 ? 1 : 2`. Feedback: `"<passed>/<total> tests pasaron. Corrige los casos fallidos antes de la auditoría de calidad."`. `complexity: null`, `aiReviewed: false`, `strengths: []`, `improvements: ['Hacer pasar todos los test cases']`.
4. SRS idéntico a `hard-skill/evaluate`: `calculateNextReview(topic.srsStage, topic.easeFactor, score, topic.intervalDays)` → actualizar `srsStage`, `easeFactor`, `intervalDays`, `nextReviewAt`.
5. `topic.history.push({ score, userInput: code, aiFeedback: feedback, reviewedAt: new Date() })` y `topic.save()`.
6. `SessionLog.create({ topicId, challenge: topic.codingChallenge.description, userSolution: code, score, feedback, strengths, missingTradeoffs: improvements, reviewedAt })`.

**Response 200:**

```json
{
  "score": 4,
  "feedback": "Solución correcta y legible...",
  "allTestsPassed": true,
  "aiReviewed": true,
  "passedCount": 4,
  "totalCount": 4,
  "complexity": { "time": "O(n)", "space": "O(1)" },
  "readability": "Código conciso con encadenamiento claro.",
  "naming": "Nombres descriptivos.",
  "strengths": ["Uso idiomático de filter/reduce"],
  "improvements": ["Considerar validación de entrada"],
  "nextReviewAt": "2026-10-09T22:00:00.000Z",
  "srsStage": 1,
  "intervalDays": 1,
  "sessionLogId": "674c..."
}
```

### - [x] AC-6: Servicio IA `evaluateCodingSolution` en `server/src/services/geminiService.js`

- Firma: `export async function evaluateCodingSolution({ topic, code, testResults })` → `Promise<{ score, feedback, complexity: { time, space }, readability, naming, strengths: string[], improvements: string[] }>`.
- `config: { systemInstruction, responseMimeType: 'application/json' }`, modelo `DEFAULT_MODEL`, mismo `getClient()`.
- `systemInstruction` **estratificado por `topic.level`** (coherente con US-09); debe contener la palabra `Evaluador de Código`:
  - **Junior:** prioriza corrección, legibilidad y nombres descriptivos. Big-O se **reporta de forma informativa y no penaliza**. Prohibido exigir internals de V8, concurrencia o arquitectura. No debe contener `Staff Engineer`, `Principal`, `concurrencia masiva`.
  - **Mid:** legibilidad + modularidad/funciones puras + no mutación. Big-O subóptimo resta máximo 1 punto.
  - **Senior:** Big-O óptimo requerido para score 5, análisis espacio/tiempo, edge cases y robustez.
- Prompt incluye: `TEMA`, `NIVEL`, `ENUNCIADO` (`codingChallenge.description`), `RESTRICCIONES` (constraints unidos con `\n- `), `RESULTADOS: <passed>/<total> tests, <executionTimeMs> ms`, `CÓDIGO`.
- **Parseo defensivo:** limpiar fences ```` ```json ````; `score` clampeado a entero 1-5 (default 3); arrays por defecto `[]`; `complexity` por defecto `{ time: 'No determinado', space: 'No determinado' }`.
- **Fallback offline** (sin `GEMINI_API_KEY` o si Gemini lanza error): `{ score: 4, feedback: 'Todos los tests pasaron. Auditoría IA no disponible (modo offline).', complexity: { time: 'No determinado (offline)', space: 'No determinado (offline)' }, readability: '', naming: '', strengths: ['Solución funcional que supera todos los test cases'], improvements: [] }`.

### - [x] AC-7: Componente `client/src/components/CodingPlayground.jsx` (Split-Screen)

**Integración en `App.jsx`:**

- Nuevo botón de pestaña `id="tab-coding-playground"` con icono `Code2` (lucide), texto `Coding Playground`, activo `bg-emerald-600`.
- Render: `{activeTab === 'coding-playground' && <CodingPlayground />}`.
- Cuando `activeTab === 'coding-playground'` el `<main>` usa `max-w-7xl` en vez de `max-w-5xl` (el split-screen necesita ancho).

**Layout:** `<section id="coding-playground-section">` con `grid grid-cols-1 lg:grid-cols-2 gap-4`.

**Barra superior:**

| Elemento | ID | Comportamiento |
| --- | --- | --- |
| Selector de nivel | `coding-level-selector` (botones `coding-level-junior`, `coding-level-mid`, `coding-level-senior`) | Default `junior`. Al cambiar → `GET /api/practice/coding/challenges?level=<lvl>` |
| Selector de reto | `coding-challenge-selector` (`<select>`) | Opciones = retos del nivel; al cambiar carga `starterCode` en el editor y limpia consola/evaluación |
| Estado vacío | `coding-empty-state` | Visible si el nivel no tiene retos: "No hay retos de código para este nivel. Ejecuta `npm run seed`." |

**Panel izquierdo `coding-problem-panel`:**

- `coding-problem-title` (título), `coding-problem-level-badge` (`NIVEL JUNIOR|MID|SENIOR`, mismos colores que badges de US-09), `coding-problem-description`, `coding-constraints-list` (`<ul>`, un `<li>` por constraint).
- Ejemplos visibles: lista de test cases **no ocultos** (`input → expected`) en `coding-examples-list`.
- `btn-coding-audio` (opcional): lee `description` con `window.speechSynthesis` en `es-ES`; **no se renderiza** si `!('speechSynthesis' in window)`.

**Panel derecho superior — editor:**

- Contenedor `coding-editor-container`; `<Editor height="420px" language="javascript" theme="vs-dark" value={code} onChange={setCode} options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, scrollBeyondLastLine: false, tabSize: 2 }} />`.
- `btn-reset-code`: restaura `starterCode`.
- `btn-run-code` ("Run Code"): llama `runCodeInWorker`, deshabilitado mientras corre (spinner), activa pestaña de tests.
- `btn-submit-code` ("Submit & Evaluate"): **siempre re-ejecuta los tests primero** (evita resultados obsoletos), luego `POST /api/practice/coding/evaluate` con `{ topicId, code, testResults: { passedCount, totalCount, executionTimeMs, results: results.map(({ index, status }) => ({ index, status })) } }`. Si el run da `ERROR`/`TIMEOUT`, envía `passedCount: 0`.

**Panel derecho inferior — consola `coding-console`:**

- Pestañas `console-tab-tests` ("Resultados de Tests") y `console-tab-logs` ("Logs de Consola").
- `test-results-summary`: texto exacto `"<passed>/<total> tests pasaron"` + `execution-time` (`"<ms> ms"`).
- Por test: `test-result-item-<index>` con atributo `data-status="PASSED|FAILED"`, icono verde/rojo.
  - Visible: `Entrada`, `Esperado`, `Obtenido` (`JSON.stringify`), y `error` si lo hay.
  - Oculto (`isHidden`): solo `"Test oculto #<n> — PASSED|FAILED"`, sin datos.
- `coding-error-banner`: visible para `ERROR`/`TIMEOUT`, muestra `"<error.type>: <error.message>"`.
- `console-logs-output`: logs con color por nivel (`warn` ámbar, `error` rojo); placeholder "Sin salida de consola." si vacío.

**Panel de evaluación `coding-evaluation-panel`** (debajo del grid, tras submit):

- `coding-eval-score` (`<score>/5`), `coding-eval-feedback`, `coding-eval-complexity-time`, `coding-eval-complexity-space` (solo si `complexity`), `coding-eval-strengths`, `coding-eval-improvements`, `coding-next-review-date` (fecha local).
- Si `aiReviewed === false`, badge `coding-eval-no-ai` con texto "Auditoría IA omitida: tests fallidos".

**Estados de error de red:** banner `coding-api-error` con el mensaje del backend.

### - [x] AC-8: Seeding de 6 retos (`server/src/scripts/seed.js`)

- Añadir **6 nuevos tópicos** (`category: 'hard_skill'`, `type: 'practice'`) con `codingChallenge` → total `SEED_TOPICS` pasa de **62 a 68**.
- `seedTopics()`: incluir `codingChallenge` en `$set` **solo si el tópico lo define** (para que una BD existente reciba/actualice los retos sin tocar SRS ni history):

```js
$set: {
  level: t.level || 'junior',
  category: t.category,
  type: t.type,
  ...(t.codingChallenge ? { codingChallenge: t.codingChallenge } : {}),
},
```

**Catálogo exacto** (recordatorio: `input` = lista de argumentos):

| # | Nivel | Título | `functionName` | Test cases (`input` → `expected`) | Constraints |
| --- | --- | --- | --- | --- | --- |
| 1 | junior | Reto de Código: Suma de Números Pares | `sumEvenNumbers(numbers)` | `[[1,2,3,4]]→6` · `[[]]→0` · `[[-2,-3,5]]→-2` · 🔒 `[[10,15,20,25]]→30` | No mutar el array de entrada · Usar métodos de arrays (filter/reduce) |
| 2 | junior | Reto de Código: Capitalizar Palabras | `capitalizeWords(sentence)` | `["hola mundo"]→"Hola Mundo"` · `[""]→""` · `["jAVAsCRIPT es genial"]→"Javascript Es Genial"` · 🔒 `["a b c"]→"A B C"` | Primera letra mayúscula y el resto minúsculas · Palabras separadas por un espacio |
| 3 | mid | Reto de Código: Agrupar por Propiedad | `groupBy(items, key)` | `[[{"type":"a","v":1},{"type":"b","v":2},{"type":"a","v":3}],"type"]→{"a":[{"type":"a","v":1},{"type":"a","v":3}],"b":[{"type":"b","v":2}]}` · `[[],"type"]→{}` · 🔒 `[[{"role":"dev","n":"Ana"},{"role":"qa","n":"Luis"},{"role":"dev","n":"Eva"}],"role"]→{"dev":[{"role":"dev","n":"Ana"},{"role":"dev","n":"Eva"}],"qa":[{"role":"qa","n":"Luis"}]}` | Función pura sin mutar `items` · Una sola pasada O(n) |
| 4 | mid | Reto de Código: Paréntesis Balanceados | `isBalanced(str)` | `["()[]{}"]→true` · `["([)]"]→false` · `[""]→true` · 🔒 `["{[()()]}"]→true` · 🔒 `["(("]→false` | Tiempo O(n) · Usar una pila (stack) |
| 5 | senior | Reto de Código: Two Sum en O(n) | `twoSum(nums, target)` (retorna `[i, j]`, `i < j`) | `[[2,7,11,15],9]→[0,1]` · `[[3,2,4],6]→[1,2]` · `[[3,3],6]→[0,1]` · 🔒 `[[1,5,9,13],22]→[2,3]` | Tiempo O(n) · Prohibido doble bucle anidado |
| 6 | senior | Reto de Código: Merge de Intervalos | `mergeIntervals(intervals)` | `[[[1,3],[2,6],[8,10],[15,18]]]→[[1,6],[8,10],[15,18]]` · `[[[1,4],[4,5]]]→[[1,5]]` · `[[]]→[]` · 🔒 `[[[5,7],[1,2],[2,4]]]→[[1,4],[5,7]]` | Tiempo O(n log n) · No mutar el array de entrada |

🔒 = `isHidden: true`.

- `starterCode` de cada reto: firma de la función + comentario JSDoc con parámetros y retorno + `// tu código aquí` (sin solución).
- `description`: 2-4 frases en español con al menos un ejemplo en texto.

### - [x] AC-9: Tests Automatizados (TDD — escribir primero, en rojo)

**9.a — `client/src/utils/codeRunner.test.js`** (Vitest, entorno Node; solo `executeTests` y `deepEqual`):

1. Código correcto → `status: 'PASSED'`, `passedCount === totalCount`, `executionTimeMs` número ≥ 0.
2. Resultado incorrecto → test `FAILED` con `expected` y `actual` correctos; `status: 'FAILED'`.
3. Código con error de sintaxis (`function f( {`) → `status: 'ERROR'`, `error.type: 'SyntaxError'`, `results: []`.
4. Función inexistente → `status: 'ERROR'`, `error.type: 'ReferenceError'`, mensaje contiene el `functionName`.
5. `throw` en un solo caso → ese test `FAILED` con `error` que contiene el mensaje; los demás se ejecutan y pasan.
6. `console.log('a', 1)` y `console.warn({x:1})` → `logs` = `[{level:'log',message:'a 1'},{level:'warn',message:'{"x":1}'}]` en orden.
7. Límite de 200 logs respetado.
8. `isHidden` se propaga a `results[i].isHidden`.
9. Aislamiento: código que muta su input (`arr.push(99)`) no afecta al siguiente test que usa el mismo objeto de referencia.
10. `deepEqual`: `{a:1,b:2}` == `{b:2,a:1}` → true; `[1,2]` vs `[2,1]` → false; `[[1,6]]` vs `[[1,6]]` → true; `0` vs `false` → false; `null` vs `undefined` → false.

**9.b — `server/tests/codingPractice.test.js`** (Supertest + MongoMemoryServer; mock de `@google/genai` con `vi.mock` y `geminiCallHistory`, mismo patrón que `practice.test.js`):

- `GET /coding/challenges`: solo devuelve tópicos con `codingChallenge`; `?level=mid` filtra; `?level=foo` ignora filtro; cada item incluye `isDue` y `codingChallenge.functionName`.
- `POST /coding/evaluate`: un test por cada fila de la tabla de validaciones (400 ×5, 404, 422, 400 mismatch).
- Todos los tests pasados → Gemini invocado **exactamente 1 vez**, `aiReviewed: true`, `complexity.time` presente, `srsStage` incrementa, `nextReviewAt > now`, `history.length === 1` con `userInput === code`, `SessionLog` creado.
- Tests parciales (2/4) → `geminiCallHistory.length === 0`, `score === 2`, `aiReviewed: false`, `complexity === null`.
- Cero tests (0/4) → `score === 1`.
- Prompt Junior: `systemInstruction` contiene `Evaluador de Código` y **no** contiene `Staff Engineer` ni `concurrencia masiva`; prompt Senior sí exige Big-O óptimo.
- Fallback sin `GEMINI_API_KEY` (borrar env en ese test y restaurar) → 200 con `score: 4` y `complexity.time` contiene `offline`.
- Modelo: `Topic` sin `codingChallenge` válido; `functionName: '1abc'` → `ValidationError`; `testCases: []` → `ValidationError`.

**9.c — Actualizar `server/tests/seed.test.js`:**

- Totales `62 → 68` (todas las aserciones de conteo/upsert/idempotencia).
- `juniorHard 10 → 12`, `midHard 6 → 8`, `seniorHard 15 → 17`; soft skills sin cambios.
- Exactamente 6 tópicos con `codingChallenge`, 2 por nivel.
- **Integridad del seed:** implementar en el test las 6 soluciones de referencia y verificar que cada una pasa todos los `testCases` de su reto (comparación con `JSON.stringify` normalizado / deepEqual local). Garantiza que los `expected` sembrados son correctos.
- Re-seed sobre BD existente añade `codingChallenge` a un tópico previamente sembrado sin él, preservando `srsStage` y `history`.

**9.d — E2E `tests/e2e/coding-playground.spec.js`** (Playwright, APIs mockeadas con `page.route` para determinismo):

1. **Happy path:** mock de `**/api/practice/coding/challenges**` con un reto junior `sumEvenNumbers` cuyo `starterCode` **ya es una solución válida** que además hace `console.log('debug-e2e')` (evita escribir en Monaco). Pasos: `goto('/')` → click `#tab-coding-playground` → esperar `.monaco-editor` visible → click `#btn-run-code` → `#test-results-summary` contiene `4/4 tests pasaron` → todos los `[id^="test-result-item-"]` tienen `data-status="PASSED"` → el test oculto muestra "Test oculto" → click `#console-tab-logs` → `#console-logs-output` contiene `debug-e2e`.
2. **Submit:** mock de `**/api/practice/coding/evaluate` (devuelve score 5 y complejidad `O(n)`) → click `#btn-submit-code` → `#coding-eval-score` contiene `5/5` y `#coding-eval-complexity-time` contiene `O(n)`; verificar que el body enviado tiene `testResults.passedCount === 4`.
3. **Syntax error:** `starterCode: 'function sumEvenNumbers(numbers) {'` → Run → `#coding-error-banner` contiene `SyntaxError`.
4. **Escritura en editor:** click en `.monaco-editor` → `Control+A` → `page.keyboard.insertText('function sumEvenNumbers(n){ return 0; }')` → Run → al menos un `data-status="FAILED"`.

- La suite E2E existente (16 tests) debe seguir en verde: total esperado **≥ 20 passed**.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `Topic`, `reviewHistorySchema`, `practiceRouter`, `calculateNextReview()`, `evaluateHardSkillSolution()` (patrón de referencia), `getClient()`, `seedTopics()`, `SEED_TOPICS`, `SessionLog`, `app`, `App()`, `HardSkillTrainer()` (patrón de badges/fetch)
- **Archivos a crear:**
  - `client/src/components/CodingPlayground.jsx` — UI split-screen
  - `client/src/utils/codeRunner.js` — núcleo puro `executeTests`, `deepEqual`, wrapper `runCodeInWorker`
  - `client/src/workers/codeRunner.worker.js` — aislamiento en Web Worker
  - `client/src/utils/monacoSetup.js` — Monaco local sin CDN
  - `server/src/routes/codingPractice.js` — `GET /coding/challenges`, `POST /coding/evaluate`
  - `client/src/utils/codeRunner.test.js`, `server/tests/codingPractice.test.js`, `tests/e2e/coding-playground.spec.js`
- **Archivos a modificar:**
  - `server/src/models/Topic.js` — subdocumento `codingChallenge`
  - `server/src/services/geminiService.js` — `evaluateCodingSolution()`
  - `server/src/app.js` — montar `codingPracticeRouter`
  - `server/src/scripts/seed.js` — 6 retos + `$set` condicional de `codingChallenge`
  - `server/tests/seed.test.js` — conteos 68 e integridad de retos
  - `client/src/App.jsx` — pestaña `tab-coding-playground` y ancho dinámico
  - `client/package.json` — `@monaco-editor/react`, `monaco-editor`
  - `package.json` (root) — `test` incluye `test:client`

> **Limitación conocida (fuera de alcance):** los 6 tópicos de código también aparecen en la cola de Hard Skills/Dashboard como tópicos `practice` (Gemini generará un reto textual sobre ellos). Redirigir "Entrenar Ahora" al Playground para tópicos con `codingChallenge` queda como candidato para una US futura.

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```text
✓ tests/dashboard.test.js (6 tests) 1933ms
✓ tests/practice.test.js (9 tests) 2090ms
✓ tests/srsCalculator.test.js (11 tests) 14ms
✓ tests/health.test.js (1 test) 1653ms
✓ tests/hint.test.js (11 tests) 16958ms
✓ tests/codingPractice.test.js (13 tests)
✓ tests/seed.test.js (7 tests)
✓ src/utils/codeRunner.test.js (13 tests)

Test Files  10 passed (10)
     Tests  100 passed (100)
```

### Tests E2E (Playwright)

```text
Running 20 tests using 2 workers

  ✓ 1 Happy path: Run Code ejecuta los 4 tests y muestra logs (9.3s)
  ✓ 2 Submit: evalúa con el backend y muestra el panel de auditoría (7.2s)
  ✓ 3 Syntax error: muestra banner de SyntaxError en la consola (3.4s)
  ✓ 4 Escritura en editor: al modificar código la prueba falla (3.7s)
  ✓ 16 otros tests E2E existentes (Dashboard, Hard Skills, Soft Skills, Catalog, Scaffolding)

  20 passed (43.8s)
```

## 5. Commit de Cierre en dev

`9448d19eee7d34fe013124982158851c1e157666`
