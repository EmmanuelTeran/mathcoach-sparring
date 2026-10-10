# [MATH-US-14] Dashboard por Tema y Categoría

- **Estado:** En Progreso
- **Rama:** `feature/MATH-US-14-dashboard-tracks`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** -

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Arquitectónico y Razón de Cambio

Con la culminación de [[MATH-US-13] UI de Sesión de Ronda](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-13-round-session-ui.md), el núcleo de práctica deliberada y evaluación multimodal de **MathCoach Sparring** quedó completamente operativo a nivel de ejecución: el estudiante dispone del componente [RoundSession](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/RoundSession.jsx) para resolver bloques de problemas de ~15 minutos en papel, capturar de 1 a 6 fotos de libreta y recibir retroalimentación pedagógica paso a paso con progresión adaptativa.

Sin embargo, la vista principal del estudiante en la pestaña "Panel" ([client/src/components/Dashboard.jsx](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/Dashboard.jsx)) y su controlador de backend correspondiente ([server/src/controllers/dashboardController.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/controllers/dashboardController.js)):
1. **Reemplazo formal de MATH-US-05:** La historia original MATH-US-05 fue cancelada porque modelaba el progreso matemático bajo el paradigma obsoleto de *"niveles globales"* (heredado de perfiles laborales Junior/Mid/Senior), incompatible con la especialización por dominios cognitivos.
2. **Desconexión con el modelo de pistas (*Tema × Categoría*):** El modelo de dominio formalizado en [[MATH-US-08]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-08-domain-model.md) establece que cada tema matemático ([MathTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js)) se compone de **tres pistas ortogonales** ([TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js)): **Técnica** (`technique`), **Aplicación** (`application`) y **Demostración** (`proof`). Cada pista cuenta con su propia dificultad adaptativa (1–3), su propio calendario de repetición espaciada SM-2 (`dueDate`) y su histórico de calificaciones (`lastRoundScore`). El dashboard actual no refleja esta granularidad bidimensional.
3. **Controlador backend reducido a stub:** En [server/src/controllers/dashboardController.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/controllers/dashboardController.js), el endpoint `GET /api/dashboard/summary` permanece como un stub temporal que retorna conteos en cero y colecciones vacías, impidiendo alimentar métricas reales al cliente.
4. **Falta de punto de entrada unificado al entrenamiento:** No existe una matriz interactiva que permita al estudiante examinar su progreso integral y detonar directamente una ronda de práctica sobre cualquier pista particular con un solo clic.
5. **Presencia residual de copys y conceptos legados:** El código y comentarios aún contienen vestigios del evaluador de software anterior (términos como hard/soft skills, simulaciones o stakeholders) que deben ser purgados de forma estricta.

Esta historia de usuario implementa el **rediseño integral del Dashboard de MathCoach Sparring**, unificando la vista analítica con el motor de progresión y la sesión de práctica multimodal.

---

### 1.2 Reescritura Completa del Backend (`server/src/controllers/dashboardController.js` y `server/src/routes/dashboard.js`)

Se reescribe completamente el controlador y se actualiza el enrutador montado en `/api/dashboard` ([server/src/routes/dashboard.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/dashboard.js)).

#### 1.2.1 Contrato Formal HTTP: `GET /api/dashboard/summary`

```json
{
  "dueCount": 0,
  "dueByCategory": {
    "technique": 0,
    "application": 0,
    "proof": 0
  },
  "nextRecommended": {
    "trackId": "651a2b3c4d5e6f7a8b9c0d1e",
    "topic": {
      "_id": "651a2b3c4d5e6f7a8b9c0d1a",
      "title": "Factorización y Fracciones Algebraicas"
    },
    "category": "technique",
    "difficulty": 1
  } | null,
  "criticalTracks": [
    {
      "topic": {
        "_id": "651a2b3c4d5e6f7a8b9c0d1a",
        "title": "Factorización y Fracciones Algebraicas"
      },
      "category": "technique",
      "difficulty": 1,
      "lastRoundScore": 2.5
    }
  ],
  "topics": [
    {
      "_id": "651a2b3c4d5e6f7a8b9c0d1a",
      "title": "Factorización y Fracciones Algebraicas",
      "area": "algebra",
      "tracks": [
        {
          "category": "technique",
          "difficulty": 1,
          "dueDate": "2026-10-09T00:00:00.000Z",
          "lastRoundScore": 4.5
        },
        {
          "category": "application",
          "difficulty": 1,
          "dueDate": "2026-10-12T00:00:00.000Z",
          "lastRoundScore": null
        },
        {
          "category": "proof",
          "difficulty": 1,
          "dueDate": "2026-10-15T00:00:00.000Z",
          "lastRoundScore": null
        }
      ]
    }
  ]
}
```

#### 1.2.2 Lógica de Agregación y Cómputo en el Servidor:

1. **Cálculo de Vencimientos (`dueCount` y `dueByCategory`):**
   - Se toma la marca temporal de evaluación `now = new Date()`.
   - Una pista se considera vencida para repaso espaciado si `dueDate <= now`.
   - `dueCount`: Conteo total de pistas con `dueDate <= now`.
   - `dueByCategory`: Desglose cuantitativo estricto por categoría:
     ```javascript
     dueByCategory: {
       technique: pistasVencidas.filter(t => t.category === 'technique').length,
       application: pistasVencidas.filter(t => t.category === 'application').length,
       proof: pistasVencidas.filter(t => t.category === 'proof').length
     }
     ```

2. **Determinación de la Pista Recomendada (`nextRecommended`):**
   - Mantiene **estricta coherencia algorítmica** con la cola de repaso `/api/rounds/queue` ([server/src/routes/rounds.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/routes/rounds.js#L15-L69)).
   - Entre todas las pistas vencidas (`dueDate <= now`), se aplica el orden de priorización pedagógica:
     1. Menor `lastRoundScore` ascendente (los valores `null`, correspondientes a pistas sin practicar o sin evaluar, se priorizan al inicio).
     2. Mayor retraso de vencimiento (`dueDate` más antiguo en el pasado, orden ascendente).
   - Si existen pistas vencidas, `nextRecommended` toma el primer elemento de la cola con la estructura `{ trackId, topic: { _id, title }, category, difficulty }`.
   - Si no existen pistas vencidas (`dueCount === 0`), `nextRecommended` es `null`.

3. **Identificación de Pistas Críticas (`criticalTracks`):**
   - Agrupa aquellas pistas en las que el estudiante ha experimentado fallos conceptuales o bajo desempeño: condición estricta `lastRoundScore !== null && lastRoundScore < 3`.
   - Se ordenan de menor a mayor calificación (`lastRoundScore` ascendente) para anteponer los puntos de mayor urgencia didáctica.
   - Proyección: `{ topic: { _id, title }, category, difficulty, lastRoundScore }`.

4. **Matriz Jerárquica por Tema (`topics`):**
   - Consulta todos los temas matemáticos curados en [MathTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js), ordenados por `order` ascendente.
   - Para cada tema, consulta y anexa sus pistas correspondientes en [TopicTrack](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/TopicTrack.js), proyectando su categoría (`category`), dificultad activa (`difficulty`), fecha de vencimiento (`dueDate`) y último score (`lastRoundScore`).

---

### 1.3 Rediseño Integral de la Interfaz (`client/src/components/Dashboard.jsx`)

Se sustituye la vista monolítica previa por una interfaz rica, modular y moderna que implementa:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       client/src/components/Dashboard                       │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   Técnica (due)  │  │ Aplicación (due) │  │Demostración (due)│          │
│  │  #metric-due-tech│  │  #metric-due-app │  │ #metric-due-proof│          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  HERO ACTION: Recomendación SRS               [ Entrenar Ahora ]       │  │
│  │  "Factorización (Técnica - Dif. 1)"           #btn-train-now          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  MATRIZ TEMA × CATEGORÍA (#topics-matrix)                             │  │
│  │  Tema                     │ Técnica      │ Aplicación   │ Demostración│  │
│  │  ─────────────────────────┼──────────────┼──────────────┼─────────────│  │
│  │  Factorización y Fracc.   │ [■□□] 4.5/5  │ [■□□] Pend.  │ [■□□] Hoy   │  │
│  │  Ecuaciones Lineales      │ [■■□] 4.0/5  │ [■□□] 2.5/5  │ [■□□] -     │  │
│  │  (Clic en cualquier celda lanza RoundSession para esa pista)          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ÁREAS CRÍTICAS (#critical-tracks-section) (lastRoundScore < 3)        │  │
│  │  - Ecuaciones Lineales | Aplicación (Dif. 1) - Score: 2.5 [Repasar]   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Componentes y Secciones Visuales:

1. **Tarjetas de Resumen por Categoría:**
   - Tres tarjetas métricas independientes para **Técnica**, **Aplicación** y **Demostración**.
   - Cada tarjeta despliega el conteo de temas vencidos (`dueByCategory`), un icono distintivo y una paleta cromática identificatoria (Azul/Índigo para Técnica, Púrpura/Violeta para Aplicación, Ámbar/Esmeralda para Demostración).
   - Identificadores estables: `#card-due-technique`, `#card-due-application`, `#card-due-proof`, `#metric-due-technique`, `#metric-due-application`, `#metric-due-proof`.

2. **Acción Principal Destacada ("Entrenar ahora"):**
   - Tarjeta hero destacada con borde gradiente que resalta la recomendación activa generada por el algoritmo SRS (`nextRecommended`).
   - Muestra el título del tema, la categoría traducida al español ("Técnica", "Aplicación", "Demostración") y la dificultad activa.
   - Botón `#btn-train-now`:
     - Si `nextRecommended` está presente: botón interactivo con gradiente que, al ser pulsado, ejecuta `onStartTraining('math-vision', { _id: topic._id, title: topic.title, category })`, cambiando a la pestaña "Entrenar" e instanciando la ronda prioritaria.
     - Si `nextRecommended === null`: botón deshabilitado con mensaje positivo de que todas las pistas están al día.

3. **Matriz Interactiva Tema × Categoría (`#topics-matrix`):**
   - Grilla responsiva que estructura todos los temas del catálogo ([MathTopic](file:///home/teran/proyectos/mathcoach-sparring/server/src/models/MathTopic.js)) en filas, y las tres categorías en columnas.
   - Cada celda representa una pista (`TopicTrack`):
     - **Indicador de dificultad de 3 segmentos:** visualización gráfica de 3 bloques o puntos (`■□□` para dificultad 1, `■■□` para dificultad 2, `■■■` para dificultad 3).
     - **Fecha de próximo repaso:** indicador contextual si está vencido ("Vence hoy" / "Vencido") o fecha formateada.
     - **Último score:** badge cromático que refleja la última nota obtenida (`lastRoundScore`), con verde para notas altas ($\ge 4$), amarillo para medias (3–3.9), rojo para críticas ($< 3$) o guion neutro para pistas sin historial.
     - **Interacción directa:** Al hacer clic sobre cualquier celda (`#matrix-cell-<topicId>-<category>`), se dispara de inmediato `onStartTraining('math-vision', { _id: topic._id, title: topic.title, category })`, permitiendo practicar cualquier pista sin fricción.

4. **Sección "Áreas Críticas" (`#critical-tracks-section`):**
   - Lista todas las pistas con `lastRoundScore < 3`.
   - Permite al estudiante focalizar su atención en debilidades algebraicas o de demostración detectadas en rondas previas.
   - Incluye botón directo `#btn-practice-critical-<topicId>-<category>` para lanzar de inmediato la ronda de recuperación de esa pista.
   - Despliega mensaje de felicitación e id `#no-critical-tracks-msg` cuando no existen áreas críticas.

---

### 1.4 Purga Estricta de Textos y Copys Legados de DevCoach

Se impone una verificación por script/grep para asegurar la **erradicación total** de textos heredados de la plataforma DevCoach en todo el código y plantillas:
- **Términos prohibidos:**
  - Filtros y clasificaciones laborales: `Junior`, `Mid`, `Senior`, `Lead`.
  - Terminología de habilidades corporativas: `Hard Skills`, `Soft Skills`.
  - Simulaciones y roles: `simulaciones`, `stakeholders`, `entrevistas`, `consultoría`, `trade-offs`, `retos técnicos`.
- **Terminología autorizada (100% rigor matemático universitario):**
  - "Repasos pendientes", "Áreas críticas", "Técnica", "Aplicación", "Demostración", "Dificultad (1–3)", "Tiempo experto (~15 min)", "Retención espaciada (SRS)".

---

### 1.5 Contrato Estricto de Identificadores Estables para E2E e Interacción

Para garantizar que las pruebas de integración Vitest y las suites E2E Playwright ([MATH-US-15](file:///home/teran/proyectos/mathcoach-sparring/.antigravity/graph.md#L250-L258)) cuenten con selectores estables y no frágiles, se establece el siguiente contrato obligatorio de atributos `id`:

| Identificador Requerido | Elemento HTML | Propósito en el Flujo |
|---|---|---|
| `#dashboard-view` | `<div>` | Contenedor principal de la vista del Dashboard. |
| `#card-due-technique` | `<div>` | Tarjeta resumen de repasos pendientes de la categoría Técnica. |
| `#metric-due-technique` | `<span>` | Valor numérico de pistas vencidas en Técnica. |
| `#card-due-application` | `<div>` | Tarjeta resumen de repasos pendientes de la categoría Aplicación. |
| `#metric-due-application` | `<span>` | Valor numérico de pistas vencidas en Aplicación. |
| `#card-due-proof` | `<div>` | Tarjeta resumen de repasos pendientes de la categoría Demostración. |
| `#metric-due-proof` | `<span>` | Valor numérico de pistas vencidas en Demostración. |
| `#btn-train-now` | `<button>` | Botón prominente de acción principal que abre la pista recomendada (`nextRecommended`). |
| `#recommended-topic-title` | `<h4>` / `<span>` | Título del tema sugerido en la acción hero. |
| `#topics-matrix` | `<div>` / `<table>` | Contenedor de la matriz interactiva Tema × Categoría. |
| `#matrix-row-<topicId>` | `<div>` / `<tr>` | Fila correspondiente a un tema específico. |
| `#matrix-cell-<topicId>-<category>` | `<div>` / `<td>` | Celda interactiva de una pista específica (clic inicia `RoundSession`). |
| `#critical-tracks-section` | `<div>` / `<section>` | Contenedor de la sección de áreas críticas. |
| `#critical-tracks-list` | `<div>` | Lista de pistas con score menor a 3. |
| `#btn-practice-critical-<topicId>-<category>` | `<button>` | Botón para lanzar la práctica de una pista crítica específica. |
| `#no-critical-tracks-msg` | `<div>` | Mensaje mostrado cuando no existen áreas críticas activas. |
| `#btn-refresh-dashboard` | `<button>` | Botón para refrescar las métricas del dashboard. |

---

## 2. Criterios de Aceptación (AC)

Los criterios de aceptación corresponden fielmente a los estipulados en `.antigravity/graph.md` para **[MATH-US-14]**:

- [x] **AC-1:** Tarjetas de repasos pendientes por categoría (Técnica / Aplicación / Demostración) con su conteo.
- [x] **AC-2:** Matriz Tema × Categoría: cada celda muestra dificultad actual (1–3, p. ej. indicador de 3 segmentos), fecha del próximo repaso y último score; clic en la celda inicia una ronda de esa pista.
- [x] **AC-3:** "Entrenar ahora" abre `RoundSession` con la pista recomendada (primera de `/api/rounds/queue`).
- [x] **AC-4:** Sección "Áreas críticas" con pistas `lastRoundScore < 3`.
- [x] **AC-5:** Sin textos heredados (verificación por grep como en MATH-US-07).
- [x] **AC-6:** Tests de controlador (Supertest) y de componente (Vitest).

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos del Grafo:**
  - `[MATH-US-14] Dashboard por Tema y Categoría`
  - `Dashboard()`
  - `Dashboard.jsx`
  - `getDashboardSummary()`
  - `dashboardRouter`
  - `TopicTrack`
  - `MathTopic`
  - `RoundSession`
  - `App`
  - `CATEGORIES` (`client/src/constants/categories.js`)

- **Archivos a Intervenir y Crear:**
  - `server/src/controllers/dashboardController.js` (Reescritura completa: lógica de agregación de pistas, cálculo de vencimientos por categoría, `nextRecommended` y `criticalTracks`).
  - `server/src/routes/dashboard.js` (Limpieza de copys heredados en comentarios y documentación).
  - `client/src/components/Dashboard.jsx` (Rediseño integral: tarjetas por categoría, acción hero "Entrenar ahora", matriz interactiva Tema × Categoría y áreas críticas).
  - `client/src/App.jsx` (Alineación de propiedades y navegación entre Dashboard y `RoundSession`).
  - `server/tests/dashboard.test.js` (Nuevo: suite de pruebas de integración con Supertest sobre `GET /api/dashboard/summary`).
  - `client/tests/Dashboard.test.jsx` (Nuevo: suite completa de pruebas de componentes en Vitest).

---

## 4. Estrategia de Pruebas y Cobertura

### 4.1 Backend: Tests de Integración Supertest (`server/tests/dashboard.test.js`)

Se creará una suite con base de datos MongoDB in-memory (`mongodb-memory-server`) que valide:
1. **Esquema con Colección Vacía:**
   - Retorna `200 OK` con `dueCount: 0`, `dueByCategory: { technique: 0, application: 0, proof: 0 }`, `nextRecommended: null`, `criticalTracks: []` y `topics: []`.
2. **Cómputo de Vencimientos por Categoría (`dueCount` y `dueByCategory`):**
   - Con pistas sembradas en fechas pasadas y futuras, verifica que sólo las vencidas (`dueDate <= now`) sumen al conteo global y se desglosen correctamente entre `technique`, `application` y `proof`.
3. **Determinación de la Pista Recomendada (`nextRecommended`):**
   - Verifica que coincida exactamente con la primera pista de `/api/rounds/queue`.
   - Prioriza pistas con menor `lastRoundScore` (con `null` antepuesto) y desempata por mayor antigüedad de `dueDate`.
4. **Filtrado de Áreas Críticas (`criticalTracks`):**
   - Verifica que incluya únicamente pistas con `lastRoundScore !== null && lastRoundScore < 3`.
   - Excluye pistas con score $\ge 3$ o con `lastRoundScore: null`.
5. **Estructura Jerárquica de Temas y Pistas (`topics`):**
   - Comprueba que cada tema retorne su lista de pistas asociadas con dificultad, `dueDate` y `lastRoundScore`.

### 4.2 Frontend: Tests de Componentes Vitest (`client/tests/Dashboard.test.jsx`)

Se implementará una suite exhaustiva con `@testing-library/react` mockeando las llamadas a `fetch`:
1. **Estado de Carga y Manejo de Errores:**
   - Renderiza spinner mientras resuelve la petición.
   - Muestra alerta amigable y botón de reintento si la API falla.
2. **Renderizado de Tarjetas de Resumen por Categoría (AC-1):**
   - Valida la presencia de `#card-due-technique`, `#card-due-application` y `#card-due-proof` con sus valores numéricos correspondientes.
3. **Matriz Interactiva Tema × Categoría (AC-2):**
   - Renderiza las filas de temas y columnas de categorías en `#topics-matrix`.
   - Comprueba el indicador de 3 segmentos de dificultad en las celdas.
   - Simula clic en una celda (`#matrix-cell-<topicId>-<category>`) y valida que llame a `onStartTraining` con el tema y la categoría exactos.
4. **Botón Hero "Entrenar ahora" (AC-3):**
   - Verifica que el botón `#btn-train-now` muestre la pista recomendada y al pulsarse dispare `onStartTraining` hacia la pista prioritaria.
   - Verifica estado deshabilitado si `nextRecommended` es `null`.
5. **Sección "Áreas Críticas" (AC-4):**
   - Renderiza la lista de pistas con `lastRoundScore < 3` y permite pulsar el botón de práctica directa.
   - Muestra el mensaje `#no-critical-tracks-msg` cuando `criticalTracks` está vacío.
6. **Verificación Estricta de Identificadores Estables (AC-6):**
   - Comprueba la existencia de todos los selectores del contrato de testing.

### 4.3 Verificación de Purga de Textos Legados (AC-5)

Se ejecutará una verificación automatizada con `grep` sobre `client/src/components/Dashboard.jsx` y `server/src/controllers/dashboardController.js` para certificar la ausencia absoluta de los términos prohibidos:
```bash
grep -iE "junior|senior|mid-level|hard skill|soft skill|simulacion|stakeholder" client/src/components/Dashboard.jsx server/src/controllers/dashboardController.js
```
El comando debe arrojar 0 coincidencias y código de salida 1.

---

## 5. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

- **Backend (`npm run test:server -- tests/dashboard.test.js`):**
  - `5/5 tests passed (100%)`
  - Validó colección vacía, cómputo por categorías, alineación estricta de recomendación SRS con `/api/rounds/queue`, filtrado de áreas críticas (`< 3`) y matriz con orden por temas.
- **Frontend (`npm run test:client -- tests/Dashboard.test.jsx`):**
  - `7/7 tests passed (100%)`
  - Validó estados de carga/error, tarjetas de categorías (AC-1), matriz interactiva con indicador de 3 segmentos y clic (AC-2), acción hero "Entrenar ahora" (AC-3), sección de áreas críticas y mensaje vacío (AC-4), e identificadores estables.
- **Auditoría de Residuos Legados:**
  - `AUDITORÍA LIMPIA: Cero textos legados`
- **Suite Completa Monorepo (`npm test`):**
  - Backend: `10 test files passed (105 tests)`
  - Frontend: `5 test files passed (29 tests)`
  - Total: `134/134 tests passed (100%)`

### Tests E2E (Playwright)

`N/A EN ESTE TICKET UNITARIO/INTEGRACIÓN (LA SUITE INTEGRAL PLAYWRIGHT SE FORMALIZA EN MATH-US-15)`

---

## 6. Commit de Cierre en dev

- **Estado:** Implementado y Verificado
- **Fecha de Cierre:** 2026-10-09
