# [MATH-US-09] Catálogo Curado de Ejercicios (Seed Idempotente)

- **Estado:** Completado
- **Rama:** `feature/MATH-US-09-curated-catalog`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** 2026-10-09

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Arquitectónico y Razón de Cambio

Tras la culminación de [[MATH-US-08] Modelo de Dominio Tema × Categoría × Dificultad](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-08-domain-model.md), la base de datos de **MathCoach Sparring** cuenta con un modelo desacoplado y limpio constituido por [MathTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js), [TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js), [Exercise](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Exercise.js) y [Round](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Round.js).

Sin embargo, el sistema carece actualmente de contenido pedagógico real. El catálogo curado de ejercicios es la **materia prima fundamental** para:
1. **Composición de Rondas de Práctica (~15 min de tiempo experto):** Según las reglas globales de negocio (§1.1 de [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md)), cada ronda se compone a partir de ejercicios disponibles en la dificultad activa de la pista. El catálogo debe ofrecer holgura suficiente para generar **al menos 2 rondas distintas y disjuntas** por cada combinación de tema, categoría y dificultad.
2. **Evaluación Multimodal de Alta Precisión (Gemini Vision):** Para que la IA evalúe soluciones manuscritas con rigor pedagógico (en MATH-US-12), cada ejercicio debe poseer una formulación matemática formal en Markdown + LaTeX y una `referenceSolution` exhaustiva que sirva como patrón de corrección analítica.
3. **Poblado Idempotente y Desacoplado:** Al tratarse de un entorno en continuo desarrollo y pruebas automáticas, el proceso de siembra (*seeding*) debe ser modular, mantenible y estrictamente **idempotente** (ejecutarlo múltiples veces no duplica temas, ejercicios ni pistas, ni reinicia el progreso de repaso acumulado).

---

### 1.2 Modelo Mental y Glosario de Dominio (§0 y §1 de [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md))

| Entidad / Concepto | Descripción en el Sistema | Atributos Clave / Rol |
|---|---|---|
| **Tema (`MathTopic`)** | Unidad curricular estructurada (ej. *"Fracciones Algebraicas"*, *"Límites y Continuidad"*). | `slug` (único, clave de upsert), `title`, `area` (`algebra`, `calculo`, etc.), `source`, `order`, `description`. |
| **Pista (`TopicTrack`)** | Instancia de progreso adaptativo para el par único *(Tema × Categoría)*. Cada tema tiene exactamente 3 pistas. | `topicId`, `category` (`technique`, `application`, `proof`), `difficulty` (1..3), parámetros SM-2 (`repetition`, `interval`, `efactor`, `dueDate`), `lastRoundScore`, `roundsCompleted`. |
| **Ejercicio (`Exercise`)** | Enunciado atómico curado para libreta de notas, categorizado y calibrado. | `externalKey` (único, clave de upsert), `topicId`, `category`, `difficulty`, `order`, `statement` (Markdown+LaTeX), `referenceSolution`, `expertMinutes` (> 0), `source`, `timesServed`, `lastServedAt`. |
| **Tiempo Experto (`expertMinutes`)** | Minutos estimados que tarda un alumno competente o instructor en resolver el problema en papel. | Base fundamental para computar el presupuesto de ~15 minutos de la ronda (`ROUND_BUDGET_MIN = 15`). |
| **Ronda (`Round`)** | Sesión de práctica (~15 min de tiempo experto) que congela ejercicios para una pista en su dificultad actual. | Evaluada en bloque mediante fotografía manuscrita y visión por computadora. |

---

### 1.3 Arquitectura del Seed Modular y Scripts npm

Para garantizar mantenibilidad, evitar archivos monolíticos gigantescos y facilitar la incorporación colaborativa de nuevos temas matemáticos, el sistema de seed se estructura de forma estrictamente modular:

```text
server/
├── scripts/
│   └── seed.js                         # Orquestador ejecutable CLI / importable
├── seed-data/
│   ├── index.js                        # Registro y exportador de todos los datasets de temas
│   ├── fracciones-algebraicas.js       # Dataset: Álgebra (CONAMAT)
│   ├── factorizacion-polinomios.js     # Dataset: Álgebra (CONAMAT)
│   ├── limites-continuidad.js          # Dataset: Cálculo / Análisis (Stewart / Spivak)
│   └── derivadas-regla-cadena.js       # Dataset: Cálculo / Análisis (Stewart / Spivak)
└── tests/
    └── catalog.test.js                 # Suite de validación de cuotas, LaTeX y viabilidad de rondas
```

#### A. Contrato de Módulo de Datos (`server/seed-data/<topic-slug>.js`)
Cada archivo desacoplado en `server/seed-data/` exporta un objeto con la metadata del tema y la colección exhaustiva de ejercicios curados:

```javascript
export default {
  slug: 'fracciones-algebraicas',
  metadata: {
    title: 'Fracciones Algebraicas',
    area: 'algebra',
    source: 'CONAMAT',
    order: 1,
    description: 'Simplificación de fracciones algebraicas, operaciones fundamentales y fracciones complejas.',
  },
  exercises: [
    {
      externalKey: 'alg-frac-tech-d1-01',
      category: 'technique',
      difficulty: 1,
      order: 1,
      statement: 'Simplifica la siguiente expresión racional a su mínima expresión:\n\n$$\\frac{x^2 - 9}{x^2 + 6x + 9}$$',
      referenceSolution: '1. Factorizar numerador como diferencia de cuadrados: $(x-3)(x+3)$.\n2. Factorizar denominador como trinomio cuadrado perfecto: $(x+3)^2$.\n3. Cancelar el factor común $(x+3)$ para $x \\neq -3$.\nResultado: $\\frac{x-3}{x+3}$.',
      expertMinutes: 2,
      source: 'CONAMAT p. 142, Ej. 4',
    },
    // ...resto de ejercicios
  ],
};
```

#### B. Orquestador `server/scripts/seed.js`
- Diseñado como script CLI ejecutable directamente con `node scripts/seed.js` y compatible para ser invocado como función programática en tests o setups automáticos.
- Conecta a la base de datos mediante [connectDB](file:///home/teran/proyectos/mathcoach-sparring/server/src/db.js) (usando `MONGODB_URI` configurable con fallback a `mongodb://localhost:27017/mathcoach`).
- Itera sobre los archivos de [server/seed-data/](file:///home/teran/proyectos/mathcoach-sparring/server/seed-data/).
- Ejecuta las operaciones atómicas de upsert e invoca [ensureTracksForTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/trackService.js).
- Emite un resumen claro por consola (temas procesados, pistas inicializadas, ejercicios insertados/actualizados) y desconecta limpiamente mediante `disconnectDB()`.

#### C. Scripts npm en el Monorepo
- **`server/package.json`**:
  ```json
  "scripts": {
    "seed": "node scripts/seed.js"
  }
  ```
- **`package.json` (raíz)**:
  ```json
  "scripts": {
    "seed": "npm --workspace=server run seed"
  }
  ```

---

### 1.4 Lógica de Idempotencia Estricta y Servicio `ensureTracksForTopic`

El script de seed debe ser 100% idempotente y seguro ante fallos o reintentos:

1. **Upsert de Temas (`MathTopic`):**
   - Criterio de búsqueda: `{ slug: topicData.slug }`.
   - Modificador: `$set` con los campos de `metadata` (`title`, `area`, `source`, `order`, `description`).
   - Opciones: `{ upsert: true, new: true, setDefaultsOnInsert: true }`.
2. **Inicialización Idempotente de Pistas (`TopicTrack`):**
   - Tras obtener o actualizar el documento `topic._id`, se invoca inmediatamente `await ensureTracksForTopic(topic._id)`.
   - Como se definió en MATH-US-08, [ensureTracksForTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/trackService.js) utiliza `$setOnInsert` para inicializar las 3 pistas (`technique`, `application`, `proof`) con `difficulty: 1`, `dueDate: new Date()` y valores SM-2 base (`repetition: 0, interval: 0, efactor: 2.5`).
   - Si la pista ya existía y el alumno había acumulado progreso o repeticiones, sus datos quedan intactos.
3. **Upsert de Ejercicios (`Exercise`):**
   - Criterio de búsqueda: `{ externalKey: exerciseData.externalKey }`.
   - Modificador: `$set` con `{ ...exerciseData, topicId: topic._id }` asegurando la asociación foránea exacta.
   - Opciones: `{ upsert: true, new: true, setDefaultsOnInsert: true }`.
   - Preserva contadores de ejecución (`timesServed`, `lastServedAt`) mediante `$setOnInsert` para dichos contadores.
4. **Garantía de Duplicidad Cero:**
   - Ejecutar `npm run seed` 1 vez, 2 veces o 10 veces produce exactamente el mismo número total de documentos en la base de datos:
     $$\Delta N_{\text{MathTopic}} = 0, \quad \Delta N_{\text{TopicTrack}} = 0, \quad \Delta N_{\text{Exercise}} = 0$$

---

### 1.5 Especificación del Catálogo Curado (Temas, Categorías y Dificultades)

El catálogo semilla inicial comprende un mínimo de **4 temas matemáticos de alta relevancia curricular**, distribuidos equitativamente entre Álgebra y Cálculo / Análisis:

#### Temas Curriculares Mínimos
1. **Álgebra (Estilo CONAMAT - Colegio Nacional de Matemáticas):**
   - **Tema 1: Fracciones Algebraicas (`slug: 'fracciones-algebraicas'`):**
     - Área: `'algebra'`.
     - Contenido: Simplificación de expresiones racionales, suma, resta, producto y cociente de fracciones con denominadores monomios y polinomios, fracciones complejas y descomposición básica.
   - **Tema 2: Factorización de Polinomios (`slug: 'factorizacion-polinomios'`):**
     - Área: `'algebra'`.
     - Contenido: Factor común monomio y por agrupación, diferencia de cuadrados, trinomios cuadrados perfectos, trinomios de la forma $x^2 + bx + c$ y $ax^2 + bx + c$, suma y diferencia de cubos y factorización mediante regla de Ruffini.

2. **Cálculo y Análisis Matemático (Estilo James Stewart / Michael Spivak):**
   - **Tema 3: Límites y Continuidad (`slug: 'limites-continuidad'`):**
     - Área: `'calculo'`.
     - Contenido: Cálculo directo y algebraico de límites, indeterminaciones $\frac{0}{0}$ y $\frac{\infty}{\infty}$, límites al infinito y asíntotas, continuidad puntual y en intervalos, teorema del valor intermedio y demostraciones formales mediante definición $\varepsilon-\delta$.
   - **Tema 4: Derivadas y Regla de la Cadena (`slug: 'derivadas-regla-cadena'`):**
     - Área: `'calculo'`.
     - Contenido: Derivación por definición de límite, reglas del producto y cociente, regla de la cadena para funciones compuestas y trascendentes, problemas de razones de cambio relacionadas y optimización, demostraciones analíticas de diferenciabilidad.

#### Matriz de Cobertura Completa (36 Celdas)
Cada uno de los 4 temas cubre exhaustivamente las **3 categorías taxonómicas** en sus **3 dificultades adaptativas**:
$$4 \text{ temas} \times 3 \text{ categorías} \times 3 \text{ dificultades} = 36 \text{ celdas operativas}$$

---

### 1.6 Cuotas de Volumen y Presupuesto de Rondas (§1.1)

De acuerdo con la regla de negocio §1.1 de [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md), una sesión de entrenamiento ("Ronda") tiene un presupuesto de tiempo de **~15 minutos de tiempo experto acumulado** (`ROUND_BUDGET_MIN = 15`). 

Para permitir **al menos 2 rondas consecutivas totalmente distintas y disjuntas** (sin repetir ejercicios) dentro de la misma dificultad, se definen cuotas de volumen estrictas por cada terna `(tema, categoría, dificultad)`:

| Categoría | Presupuesto por Ronda (§1.1) | Cuota Mínima de Ejercicios por (Tema, Dificultad) | Cuota Mínima de Minutos por (Tema, Dificultad) | Justificación para 2 Rondas Distintas |
|---|---|---|---|---|
| **Técnica (`technique`)** | Min 3, Max 10 ejercicios hasta acumular $\ge 15$ min | **$\ge 6$ ejercicios** | **$\ge 30$ min acumulados** (`2 \times 15` min) | Permite formar una Ronda 1 con $\ge 3$ ejercicios y $\ge 15$ min, y una Ronda 2 disjunta con otros $\ge 3$ ejercicios y $\ge 15$ min. |
| **Aplicación (`application`)** | 1 a 3 ejercicios hasta acumular $\sim 15$ min (normalmente 1–2 problemas) | **$\ge 3$ ejercicios** | $\ge 20$ min acumulados | Permite componer una primera ronda (1–2 problemas de 7–15 min) y una segunda ronda con ejercicios diferentes. |
| **Demostración (`proof`)** | **Exactamente 1 ejercicio** por ronda (8–15 min) | **$\ge 2$ ejercicios** | $\ge 16$ min acumulados | Ronda 1 consume el primer ejercicio; Ronda 2 consume el segundo ejercicio de forma disjunta. |

#### Volumen Total Mínimo por Tema y en el Catálogo Global
- **Por cada Dificultad (1, 2 o 3):**
  - Técnica: $\ge 6$ ejercicios ($\ge 30$ min)
  - Aplicación: $\ge 3$ ejercicios
  - Demostración: $\ge 2$ ejercicios
  - **Subtotal por dificultad:** $\ge 11$ ejercicios.
- **Por cada Tema (3 dificultades):**
  - $11 \times 3 = \mathbf{33}$ **ejercicios mínimos por tema** (18 de técnica, 9 de aplicación, 6 de demostración).
- **Catálogo Global (4 temas):**
  - $33 \times 4 = \mathbf{132}$ **ejercicios curados mínimos en total**.

---

### 1.7 Calidad Pedagógica y Rigor de Datos

Cada ejercicio incorporado al catálogo debe cumplir con los siguientes estándares de calidad:

1. **Formulación en Markdown + LaTeX Riguroso:**
   - La notación matemática debe emplear delimitadores estándar KaTeX: `$...$` para fórmulas inline y `$$...$$` para expresiones en bloque.
   - Prohibido el uso de texto plano para fórmulas complejas (ej. no usar `x^2 / y`, sino `$$\frac{x^2}{y}$$`).
   - Caracteres de escape en cadenas de JavaScript correctamente gestionados (ej. `\\frac`, `\\lim_{x \\to 0}`, `\\int`, `\\sqrt`).
2. **`referenceSolution` Obligatoria y Exhaustiva:**
   - Ningún ejercicio puede tener `referenceSolution` vacía o trivial.
   - Debe detallar los pasos algebraicos de resolución, las factorizaciones intermedias, los teoremas aplicados (ej. Teorema del Valor Intermedio, Regla de L'Hôpital si procede, Regla de la Cadena) o la estructura de la demostración formal (hipótesis, paso deductivo, conclusión).
   - Servirá como la guía canónica (ground truth) para la evaluación multimodal con Gemini en MATH-US-12.
3. **Calibración Realista de `expertMinutes`:**
   - Los tiempos asignados deben corresponder a la resolución por parte de un matemático o estudiante avanzado:
     - **Técnica:** 1 a 5 minutos por ejercicio.
     - **Aplicación:** 5 a 15 minutos por ejercicio.
     - **Demostración:** 8 a 15 minutos por ejercicio.
   - En ningún caso `expertMinutes <= 0`.
4. **Complejidad Creciente Reflejada en `order`:**
   - El atributo `order` es un entero secuencial ($1, 2, 3, \dots$) asignado dentro de cada terna `(topicId, category, difficulty)`.
   - Refleja una curva pedagógica ascendente.
5. **Nomenclatura Canónica de `externalKey`:**
   - Estructura determinista y legible: `<slug-abreviado>-<categoria-abreviada>-d<dificultad>-<secuencia-2digitos>`.
   - Ejemplos:
     - `alg-frac-tech-d1-01` a `alg-frac-tech-d1-06`
     - `alg-frac-app-d2-01` a `alg-frac-app-d2-03`
     - `calc-lim-proof-d3-01` a `calc-lim-proof-d3-02`

---

## 2. Criterios de Aceptación (AC)

Los siguientes Criterios de Aceptación son los **estipulados textualmente en [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md)** para [MATH-US-09], enriquecidos con su lista de verificación de pruebas:

### AC-1: `npm run seed` Idempotente y Creación de Pistas
- [x] `npm run seed` (o `npm --workspace=server run seed`) ejecuta exitosamente el script de siembra conectándose a MongoDB.
- [x] Realiza upsert por `slug` en [MathTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js) y por `externalKey` en [Exercise](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/Exercise.js).
- [x] Invoca [ensureTracksForTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/trackService.js) para cada tema, creando exactamente sus 3 pistas (`technique`, `application`, `proof`) con `difficulty: 1` y `dueDate` inicial.
- [x] Ejecutar el comando dos o más veces consecutivas no crea registros duplicados de temas, ejercicios ni pistas ($\Delta N = 0$).
- [x] No sobrescribe ni reinicia el progreso de repaso SM-2 (`repetition`, `interval`, `efactor`, `dueDate`) de pistas preexistentes.

### AC-2: Cobertura Mínima de 4 Temas en Matriz 3 Categorías × 3 Dificultades
- [x] El catálogo contiene como mínimo **4 temas**:
  - $\ge 2$ temas de Álgebra estilo CONAMAT (`fracciones-algebraicas`, `factorizacion-polinomios`).
  - $\ge 2$ temas de Cálculo / Análisis estilo Stewart / Spivak (`limites-continuidad`, `derivadas-regla-cadena`).
- [x] Cada uno de los 4 temas incluye ejercicios para las **3 categorías** (`technique`, `application`, `proof`).
- [x] Cada categoría en cada tema cuenta con ejercicios para las **3 dificultades** (`1`, `2`, `3`).

### AC-3: Cuotas de Volumen Mínimo por (Tema, Categoría, Dificultad)
- [x] **Técnica (`technique`):** Cada combinación de `(tema, dificultad)` cuenta con $\ge 6$ ejercicios y un tiempo acumulado de `expertMinutes` $\ge 30$ minutos ($2 \times 15$ min).
- [x] **Aplicación (`application`):** Cada combinación de `(tema, dificultad)` cuenta con $\ge 3$ ejercicios.
- [x] **Demostración (`proof`):** Cada combinación de `(tema, dificultad)` cuenta con $\ge 2$ ejercicios.
- [x] El conteo global del catálogo suma un mínimo de 132 ejercicios distribuidos entre los 4 temas (exactamente 132 ejercicios curados).

### AC-4: Calibración Realista de `expertMinutes` y `order` Secuencial Ascendente
- [x] Los valores de `expertMinutes` son números estrictamente mayores a 0 calibrados según su categoría:
  - Técnica: 1 a 5 minutos.
  - Aplicación: 5 a 15 minutos.
  - Demostración: 8 a 15 minutos.
- [x] El campo `order` es un entero secuencial creciente ($1, 2, 3, \dots$) asignado sin huecos ni duplicados dentro de cada `(tema, categoría, dificultad)`.
- [x] La secuencia de `order` refleja una progresión didáctica de menor a mayor complejidad matemática.

### AC-5: Calidad de Enunciados en Markdown + LaTeX Válido y `referenceSolution`
- [x] El 100% de los ejercicios contiene un `statement` en Markdown enriquecido con notación LaTeX matemáticamente rigurosa.
- [x] Todos los delimitadores LaTeX (`$...$` inline y `$$...$$` block) están sintácticamente balanceados y no contienen comandos inválidos o cadenas rotas.
- [x] El 100% de los ejercicios incluye una `referenceSolution` no vacía que describe la solución paso a paso, factorizaciones o demostración analítica para el evaluador.

### AC-6: Suite de Validación Automatizada `server/tests/catalog.test.js`
- [x] Existe la suite de pruebas unitarias/integración [server/tests/catalog.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/catalog.test.js) ejecutada con Vitest.
- [x] La suite valida estáticamente y dinámicamente el cumplimiento de AC-2, AC-3, AC-4 y AC-5 cargando los módulos de [server/seed-data/](file:///home/teran/proyectos/mathcoach-sparring/server/seed-data/).
- [x] Implementa una prueba de simulación de composición de rondas (§1.1) que verifica algorítmicamente que cada pista y dificultad puede generar al menos 2 rondas disjuntas y válidas.
- [x] Valida en memoria (con `mongodb-memory-server`) la idempotencia estricta del proceso de siembra.
- [x] `npm test` en el backend se mantiene 100% en verde.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos Identificados en el Grafo de Conocimiento:**
  - `[MATH-US-09] Catálogo Curado de Ejercicios (Seed Idempotente)`
  - `MathTopic`, `MathTopic.js`
  - `Exercise`, `Exercise.js`
  - `TopicTrack`, `TopicTrack.js`
  - `ensureTracksForTopic()`, `trackService.js`
  - `server/package.json`, `package.json`
  - `db.js`, `connectDB()`, `disconnectDB()`

- **Archivos Intervenidos:**
  - **Creados:**
    - `server/scripts/seed.js`: Script orquestador ejecutable de siembra con soporte CLI y modo programático.
    - `server/seed-data/index.js`: Índice de exportación de todos los módulos de temas curados.
    - `server/seed-data/fracciones-algebraicas.js`: Dataset curado de Álgebra CONAMAT (33 ejercicios).
    - `server/seed-data/factorizacion-polinomios.js`: Dataset curado de Álgebra CONAMAT (33 ejercicios).
    - `server/seed-data/limites-continuidad.js`: Dataset curado de Cálculo/Análisis Stewart/Spivak (33 ejercicios).
    - `server/seed-data/derivadas-regla-cadena.js`: Dataset curado de Cálculo/Análisis Stewart/Spivak (33 ejercicios).
    - `server/tests/catalog.test.js`: Suite de validación exhaustiva de cuotas, calidad LaTeX, idempotencia y viabilidad de doble ronda.
  - **Modificados:**
    - `server/package.json`: Registrado script `"seed": "node scripts/seed.js"`.
    - `package.json`: Registrado script `"seed": "npm --workspace=server run seed"`.

---

## 4. Estrategia de Pruebas TDD y Validación del Catálogo

### 4.1 Comandos de Verificación Exactos

```bash
# 1. Ejecutar la suite de validación de catálogo y seed
npm --workspace=server test tests/catalog.test.js

# 2. Ejecutar todas las pruebas unitarias e integración de backend
npm --prefix server test

# 3. Comprobar ejecución CLI del script de siembra (en entorno con MongoDB activo o test)
npm run seed

# 4. Auditoría de integridad de paquetes (verificar scripts registrados)
grep -E "\"seed\":" package.json server/package.json
```

---

## 5. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración Backend (Vitest / Supertest)

```bash
$ npm --workspace=server test tests/catalog.test.js

 RUN  v3.2.7 /home/teran/proyectos/mathcoach-sparring/server

 ✓ tests/catalog.test.js (9 tests) 1928ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Auditoría de Datos Curados (seed-data) > debe contener al menos 4 temas: mínimo 2 de álgebra y 2 de cálculo/análisis 2ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Auditoría de Datos Curados (seed-data) > cada tema debe poseer metadatos obligatorios válidos 4ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Auditoría de Datos Curados (seed-data) > todos los externalKey deben ser únicos y seguir formato canónico 7ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Auditoría de Datos Curados (seed-data) > cada ejercicio debe tener statement y referenceSolution exhaustivos en Markdown + KaTeX balanceado 20ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Auditoría de Datos Curados (seed-data) > las cuotas mínimas de volumen deben cumplirse por cada tema y dificultad 1ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Auditoría de Datos Curados (seed-data) > los rangos de expertMinutes y la secuencia de order deben ser estrictos y sin huecos 9ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Auditoría de Datos Curados (seed-data) > debe ser viable construir al menos 2 rondas disjuntas y válidas por cada celda de técnica 1ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Prueba de Integración e Idempotencia del Seed > ejecuta seedDatabase() y asegura la estructura de temas, pistas y ejercicios 733ms
   ✓ Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09) > Prueba de Integración e Idempotencia del Seed > no reinicia el progreso SM-2 ni dificultad de pistas modificadas previamente 259ms

 Test Files  1 passed (1)
      Tests  9 passed (9)
```

### Ejecución de Seed Idempotente (CLI - Doble Ejecución Consecutiva)

```bash
>>> EJECUTANDO SEED 1:
--- Iniciando siembra de catálogo (seed) ---
✓ Tema procesado: "Fracciones Algebraicas" (fracciones-algebraicas) | Pistas: 3 | Ejercicios: 33
✓ Tema procesado: "Factorización de Polinomios" (factorizacion-polinomios) | Pistas: 3 | Ejercicios: 33
✓ Tema procesado: "Límites y Continuidad" (limites-continuidad) | Pistas: 3 | Ejercicios: 33
✓ Tema procesado: "Derivadas y Regla de la Cadena" (derivadas-regla-cadena) | Pistas: 3 | Ejercicios: 33
-------------------------------------------
✓ Siembra completada exitosamente:
  - Temas procesados:      4
  - Pistas aseguradas:     12
  - Ejercicios procesados: 132
-------------------------------------------
Conteo post-Run 1 -> Temas: 4 | Pistas: 12 | Ejercicios: 132

>>> EJECUTANDO SEED 2 (Comprobación Idempotencia):
--- Iniciando siembra de catálogo (seed) ---
✓ Tema procesado: "Fracciones Algebraicas" (fracciones-algebraicas) | Pistas: 3 | Ejercicios: 33
✓ Tema procesado: "Factorización de Polinomios" (factorizacion-polinomios) | Pistas: 3 | Ejercicios: 33
✓ Tema procesado: "Límites y Continuidad" (limites-continuidad) | Pistas: 3 | Ejercicios: 33
✓ Tema procesado: "Derivadas y Regla de la Cadena" (derivadas-regla-cadena) | Pistas: 3 | Ejercicios: 33
-------------------------------------------
✓ Siembra completada exitosamente:
  - Temas procesados:      4
  - Pistas aseguradas:     12
  - Ejercicios procesados: 132
-------------------------------------------
Conteo post-Run 2 -> Temas: 4 | Pistas: 12 | Ejercicios: 132

*** VERIFICACIÓN DE IDEMPOTENCIA EXITOSA: CERO DUPLICADOS (Delta = 0) ***
```

### Suite Completa de Backend y Frontend (`npm test`)

```bash
$ npm test

> mathcoach-sparring@1.0.0 test
> npm run test:server && npm run test:client

> @mathcoach-sparring/server@1.0.0 test
> vitest run

 ✓ tests/practice.test.js (7 tests)
 ✓ tests/models.test.js (19 tests)
 ✓ tests/catalog.test.js (9 tests)
 ✓ tests/srsCalculator.test.js (11 tests)
 ✓ tests/topics.test.js (2 tests)
 ✓ tests/health.test.js (1 test)

 Test Files  6 passed (6)
      Tests  49 passed (49)

> @mathcoach-sparring/client@1.0.0 test
> vitest run

 ✓ tests/App.test.jsx (3 tests)
 ✓ tests/MathVisionUploader.test.jsx (11 tests)

 Test Files  2 passed (2)
      Tests  14 passed (14)
```

---

## 6. Commit de Cierre en dev

- Rama integrada: `feature/MATH-US-09-curated-catalog`
- Merge commit hacia `dev`: `feat(MATH-US-09): merge feature/MATH-US-09-curated-catalog into dev`

