# [MATH-US-17] Expansión Curricular: Cuatro Nuevos Temas Matemáticos

- **Estado:** En Progreso
- **Rama:** `feature/MATH-US-17-curricular-expansion`
- **Fecha de Inicio:** 2026-10-10
- **Fecha de Cierre:** -

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Pedagógico y Razón de Cambio (Hito 2)

Durante el **Hito 1**, MathCoach Sparring implementó el modelo adaptativo por celdas (*Tema × Categoría × Dificultad*) respaldado por un catálogo inicial de 4 temas fundamentales (2 de Álgebra y 2 de Cálculo Diferencial):
- `fracciones-algebraicas` (`algebra`)
- `factorizacion-polinomios` (`algebra`)
- `limites-continuidad` (`calculo`)
- `derivadas-regla-cadena` (`calculo`)

Para elevar la preparación preuniversitaria y universitaria de ciencias e ingeniería (STEM) hacia un estándar integral de alta exigencia, la plataforma requiere expandir su currículo a **8 temas canónicos** distribuidos equitativamente en 4 grandes áreas matemáticas:
1. **Álgebra:** Consolidación de ecuaciones y sistemas de ecuaciones lineales y no lineales aplicados.
2. **Trigonometría:** Identidades fundamentales, transformaciones angulares y resolución analítica de ecuaciones trigonométricas.
3. **Cálculo Integral:** Métodos y técnicas analíticas de integración indefinida.
4. **Geometría Analítica:** Secciones cónicas en sus formas canónicas/generales y álgebra vectorial en $\mathbb{R}^2$.

Esta expansión curricular dota a la plataforma de un repertorio formativo robusto que permite al estudiante transferir habilidades de razonamiento analítico entre diferentes disciplinas matemáticas.

---

### 1.2 Ficha Curricular Canónica de los Cuatro Nuevos Temas

Cada nuevo tema incorpora su metadata exhaustiva basada en la literatura matemática universitaria de referencia:

1. **Ecuaciones y Sistemas Lineales (`slug: 'ecuaciones-sistemas-lineales'`):**
   - **Área:** `algebra`
   - **Fuente Curricular:** CONAMAT / Baldor
   - **Orden Sugerido:** `5`
   - **Título Canónico:** Ecuaciones y Sistemas Lineales
   - **Descripción:** Ecuaciones lineales de una incógnita, ecuaciones cuadráticas por fórmula general y factorización, sistemas de ecuaciones lineales 2×2 y 3×3 (Cramer, sustitución, eliminación gaussiana), y modelado algebraico de problemas de mezclas y cinemática.

2. **Identidades y Ecuaciones Trigonométricas (`slug: 'trigonometria-identidades'`):**
   - **Área:** `trigonometria`
   - **Fuente Curricular:** Granville / CONAMAT
   - **Orden Sugerido:** `6`
   - **Título Canónico:** Identidades y Ecuaciones Trigonométricas
   - **Descripción:** Identidades fundamentales (pitagóricas, recíprocas y por cociente), fórmulas de adición y sustracción de ángulos, identidades de ángulo doble y semiángulo, ecuaciones trigonométricas en el intervalo $[0, 2\pi)$ y modelado de fenómenos periódicos.

3. **Técnicas de Integración Indefinida (`slug: 'tecnicas-integracion'`):**
   - **Área:** `calculo`
   - **Fuente Curricular:** Stewart / Thomas
   - **Orden Sugerido:** `7`
   - **Título Canónico:** Técnicas de Integración Indefinida
   - **Descripción:** Integrales inmediatas y algebraicas, método de cambio de variable (sustitución u), integración por partes ($\int u \, dv = uv - \int v \, du$), y sustitución trigonométrica básica en integrandos con radicales $\sqrt{a^2 - u^2}$, $\sqrt{a^2 + u^2}$ y $\sqrt{u^2 - a^2}$.

4. **Geometría Analítica: Secciones Cónicas y Vectores (`slug: 'geometria-analitica-conicas'`):**
   - **Área:** `geometria`
   - **Fuente Curricular:** Lehmann / Larson
   - **Orden Sugerido:** `8`
   - **Título Canónico:** Geometría Analítica: Secciones Cónicas y Vectores
   - **Descripción:** Ecuaciones canónicas y generales de la circunferencia, parábola y elipse; determinación de focos, directrices, excentricidad y asíntotas; operaciones fundamentales con vectores en $\mathbb{R}^2$, magnitud, ángulo de dirección y producto punto.

---

### 1.3 Estructura Modular en `server/seed-data/` y Matriz Adaptativa (9 Celdas por Tema)

Cada nuevo tema se implementa en un módulo ES individual desacoplado dentro de `server/seed-data/`:
- `server/seed-data/ecuaciones-sistemas-lineales.js`
- `server/seed-data/trigonometria-identidades.js`
- `server/seed-data/tecnicas-integracion.js`
- `server/seed-data/geometria-analitica-conicas.js`

Cada archivo exporta por defecto (`export default`) la estructura canónica:
```javascript
export default {
  slug: '<slug>',
  metadata: {
    title: '<Título Canónico>',
    area: 'algebra' | 'trigonometria' | 'calculo' | 'geometria',
    source: '<Fuente Curricular>',
    order: <number>,
    description: '<Descripción formativa>',
  },
  exercises: [
    // Array de ejercicios curados
  ],
};
```

#### Especificación de Celdas Adaptativas por Tema:
Cada tema define sus **9 celdas adaptativas**:
$$\text{3 Categorías} \ (\text{Técnica, Aplicación, Demostración}) \times \text{3 Dificultades} \ (1, 2, 3)$$

Para cada celda adaptativa se suministran ejercicios curados con:
- `externalKey`: Identificador unívoco canónico (e.g. `alg-eq-tech-d1-01` o `<slug>-(tech|app|proof)-d<1-3>-<order>`).
- `category`: `'technique' | 'application' | 'proof'`.
- `difficulty`: `1 | 2 | 3`.
- `order`: Secuencia entera estricta sin saltos ($1, 2, 3, \dots$) dentro de su celda.
- `statement`: Enunciado riguroso en Markdown con KaTeX balanceado tanto en delimitadores en línea (`$...$`) como en bloque (`$$...$$`).
- `referenceSolution`: Solución oficial paso a paso, demostración formal o procedimiento algebraico detallado.
- `expertMinutes`: Tiempo estimado calibrado (Técnica: 1–5 min; Aplicación: 5–15 min; Demostración: 8–15 min).
- `source`: Referencia al capítulo o texto fuente.

---

### 1.4 Consolidación en `server/seed-data/index.js` (`curatedTopics`)

El archivo [server/seed-data/index.js](file:///home/teran/proyectos/mathcoach-sparring/server/seed-data/index.js) unifica los 8 temas curriculares en la colección exportada `curatedTopics`:

```javascript
import fraccionesAlgebraicas from './fracciones-algebraicas.js';
import factorizacionPolinomios from './factorizacion-polinomios.js';
import limitesContinuidad from './limites-continuidad.js';
import derivadasReglaCadena from './derivadas-regla-cadena.js';
import ecuacionesSistemasLineales from './ecuaciones-sistemas-lineales.js';
import trigonometriaIdentidades from './trigonometria-identidades.js';
import tecnicasIntegracion from './tecnicas-integracion.js';
import geometriaAnaliticaConicas from './geometria-analitica-conicas.js';

export const curatedTopics = [
  fraccionesAlgebraicas,
  factorizacionPolinomios,
  limitesContinuidad,
  derivadasReglaCadena,
  ecuacionesSistemasLineales,
  trigonometriaIdentidades,
  tecnicasIntegracion,
  geometriaAnaliticaConicas,
];

export default curatedTopics;
```

---

### 1.5 Pipeline de Siembra Idempotente (`npm run seed`)

El pipeline de siembra programático en [server/scripts/seed.js](file:///home/teran/proyectos/mathcoach-sparring/server/scripts/seed.js):
1. **Persistencia de Temas:** Ejecuta `findOneAndUpdate({ slug: topicData.slug }, ...)` con `upsert: true` en `MathTopic`.
2. **Creación Automática de Pistas (`TopicTrack`):** Ejecuta `ensureTracksForTopic(topic._id)` vía [server/src/services/trackService.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/trackService.js), inicializando idempotentemente las **3 pistas** por tema (`technique`, `application`, `proof`):
   - `currentDifficulty = 1`
   - `dueDate = now`
   - `intervalDays = 1`
   - `easeFactor = 2.5`
   - `repetitionNumber = 0`
   - `consecutivePromotions = 0`
3. **Persistencia de Ejercicios:** Ejecuta `findOneAndUpdate({ externalKey: exData.externalKey }, ...)` con `upsert: true` en `Exercise`, preservando métricas de servicio preexistentes (`$setOnInsert: { timesServed: 0, lastServedAt: null }`).
4. **Idempotencia Absoluta:** La re-ejecución repetida de `npm run seed` no duplica temas, ni pistas, ni ejercicios, y no altera los datos de repetición espaciada de pistas ya cursadas.

---

### 1.6 Estrategia de Auditoría y Pruebas Automatizadas

Se amplía la suite de auditoría estática y de integración [server/tests/catalog.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/catalog.test.js):
1. **Auditoría de Metadatos y Áreas:** Validar que `curatedTopics` contenga 8 temas y que las áreas incluyan `algebra`, `trigonometria`, `calculo` y `geometria`.
2. **Validación de Celdas Adaptativas:** Verificar que cada uno de los 8 temas posea ejercicios en sus 9 celdas adaptativas ($3 \times 3$).
3. **Validación de `externalKey` y KaTeX:** Verificar unicidad estricta de claves, patrones de nomenclatura y balanceo matemático en enunciados y soluciones.
4. **Prueba de Siembra con MongoDB en Memoria:** Ejecutar `seedDatabase()` verificando que se inserten los 8 temas y sus $8 \times 3 = 24$ pistas correspondientes.

---

## 2. Criterios de Aceptación (AC)

> [!IMPORTANT]
> Los siguientes Criterios de Aceptación corresponden textualmente a las especificaciones estipuladas para **[MATH-US-17]** en [.antigravity/graph.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md#L186-L191).

### AC-1: Exportación Canónica en los Cuatro Nuevos Módulos
- [x] Cada archivo modular (`ecuaciones-sistemas-lineales.js`, `trigonometria-identidades.js`, `tecnicas-integracion.js`, `geometria-analitica-conicas.js`) exporta la estructura canónica con:
  - `slug` canónico único en minúsculas.
  - `metadata` completo (`title`, `area`, `source`, `order`, `description`).
  - `exercises` en array estructurado.

### AC-2: Cobertura Exhaustiva de las 9 Celdas Adaptativas por Tema
- [x] Cada tema define ejercicios para sus 9 celdas adaptativas:
  - 3 categorías (`technique`, `application`, `proof`) $\times$ 3 dificultades (`1`, `2`, `3`).
  - Cada ejercicio incluye `externalKey`, `category`, `difficulty`, `order` secuencial, `statement` en Markdown + KaTeX, `referenceSolution`, `expertMinutes` y `source`.

### AC-3: Registro Completo de los 8 Temas en `server/seed-data/index.js`
- [x] `curatedTopics` en `server/seed-data/index.js` incluye los 8 temas en total:
  - 4 temas fundacionales (`fracciones-algebraicas`, `factorizacion-polinomios`, `limites-continuidad`, `derivadas-regla-cadena`).
  - 4 nuevos temas (`ecuaciones-sistemas-lineales`, `trigonometria-identidades`, `tecnicas-integracion`, `geometria-analitica-conicas`).

### AC-4: Siembra Idempotente y Generación de Pistas (`npm run seed`)
- [x] `npm run seed` ejecuta de forma limpia e idempotente.
- [x] Se insertan/actualizan los nuevos temas mediante upsert por `slug`.
- [x] Se generan sus 3 pistas (`TopicTrack`) por tema con dificultad inicial 1 y `dueDate = now` vía `ensureTracksForTopic`.
- [x] Las ejecuciones consecutivas del comando no generan duplicados ni errores de clave única.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos Identificados:**
  - `[MATH-US-17] Expansión Curricular: Cuatro Nuevos Temas Matemáticos`
  - `server/seed-data/ecuaciones-sistemas-lineales.js`
  - `server/seed-data/trigonometria-identidades.js`
  - `server/seed-data/tecnicas-integracion.js`
  - `server/seed-data/geometria-analitica-conicas.js`
  - `server/seed-data/index.js` (`curatedTopics`)
  - `server/scripts/seed.js` (`seedDatabase`)
  - `server/src/models/MathTopic.js` (`mathTopicSchema`)
  - `server/src/models/TopicTrack.js` (`topicTrackSchema`)
  - `server/src/models/Exercise.js` (`exerciseSchema`)
  - `server/src/services/trackService.js` (`ensureTracksForTopic`)
  - `server/tests/catalog.test.js`

- **Archivos a Intervenir / Crear:**
  - **Módulos de Datos Curados (Creación):**
    - [server/seed-data/ecuaciones-sistemas-lineales.js](file:///home/teran/proyectos/mathcoach-sparring/server/seed-data/ecuaciones-sistemas-lineales.js): Datos curados del tema 5.
    - [server/seed-data/trigonometria-identidades.js](file:///home/teran/proyectos/mathcoach-sparring/server/seed-data/trigonometria-identidades.js): Datos curados del tema 6.
    - [server/seed-data/tecnicas-integracion.js](file:///home/teran/proyectos/mathcoach-sparring/server/seed-data/tecnicas-integracion.js): Datos curados del tema 7.
    - [server/seed-data/geometria-analitica-conicas.js](file:///home/teran/proyectos/mathcoach-sparring/server/seed-data/geometria-analitica-conicas.js): Datos curados del tema 8.
  - **Catálogo Central (Modificación):**
    - [server/seed-data/index.js](file:///home/teran/proyectos/mathcoach-sparring/server/seed-data/index.js): Importación y exportación de la lista completa de 8 temas en `curatedTopics`.
  - **Pruebas de Catálogo (Actualización):**
    - [server/tests/catalog.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/catalog.test.js): Verificación de 8 temas, áreas expandidas, claves únicas y pruebas de siembra de 24 pistas.
    - [server/tests/topics.test.js](file:///home/teran/proyectos/mathcoach-sparring/server/tests/topics.test.js): Verificación de 8 temas y 24 pistas expuestas por GET /api/topics.
  - **Seguimiento y Control:**
    - [.antigravity/heartbeat.md](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/heartbeat.md): Actualización del estado activo a `feature/MATH-US-17-curricular-expansion`.

---

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
# Auditoría de Catálogo y Siembra: catalog.test.js
npm --prefix server test -- tests/catalog.test.js
# Salida: 9 passed (9 tests) - 8 temas, 264 ejercicios, 24 pistas verificadas

# Verificación de Modelos y Track Service: models.test.js
npm --prefix server test -- tests/models.test.js
# Salida: 19 passed (19 tests)

# Endpoint de Temas y Pistas: topics.test.js
npm --prefix server test -- tests/topics.test.js
# Salida: 3 passed (3 tests) - GET /api/topics valida 8 temas y 24 pistas

# Monorepo completo (Servidor + Cliente)
npm test
# Salida: 110 passed (servidor) + 30 passed (cliente) = 140 passed
```

### Base de Datos y Pipeline de Siembra

```bash
npm run seed
# 1ra ejecución: 8 temas procesados, 24 pistas aseguradas, 264 ejercicios
# 2da ejecución consecutiva: Idempotencia absoluta, 0 duplicados, pistas preservadas
```

### Tests E2E (Playwright)

```
N/A para expansión curricular y seed de datos estáticos (suite E2E se valida en cierres de hito).
```

---

## 5. Commit de Cierre en dev

```bash
feat(catalog): incorpora 4 nuevos temas matematicos y amplía catalogo a 8 temas (#MATH-US-17)
```
