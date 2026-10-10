# [MATH-US-15] Validación E2E Final + Documentación

- **Estado:** Completado
- **Rama:** `feature/MATH-US-15-e2e-and-docs`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** 2026-10-09

---

## 1. Descripción y Objetivos de Negocio

### 1.1 Contexto Arquitectónico y Cierre del Roadmap

Con la conclusión de las historias nucleares del dominio matemático:
- [[MATH-US-08]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-08-domain-model.md) (Modelo de Dominio *Tema × Categoría × Dificultad* y purga del backend legado),
- [[MATH-US-09]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-09-curated-catalog.md) (Catálogo Curado de Ejercicios y Siembra Idempotente),
- [[MATH-US-10]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-10-progression-engine.md) (Motor de Progresión Adaptativa y SRS SM-2 por Pista),
- [[MATH-US-11]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-11-round-builder.md) (Constructor de Rondas de ~15 min y API de Rondas),
- [[MATH-US-12]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-12-round-evaluation.md) (Evaluación Multimodal de Rondas y Persistencia de Progresión),
- [[MATH-US-13]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-13-round-session-ui.md) (UI de Sesión de Ronda con Captura de 1 a 6 fotos y render KaTeX), y
- [[MATH-US-14]](file:///home/teran/proyectos/mathcoach-sparring/tickets/MATH-US-14-dashboard-tracks.md) (Dashboard por Tema y Categoría con Matriz interactiva y cola recomendada),

**MathCoach Sparring** ha implementado completamente todas las capas de su arquitectura funcional. Esta última historia de usuario (**[MATH-US-15]**) constituye el **hito formal de cierre y certificación de calidad del sistema**. 

Sus objetivos centrales son:
1. **Validación End-to-End Holística:** Diseñar y desplegar una suite automatizada con Playwright (`tests/e2e/`) que ejecute los flujos de usuario reales de punta a punta sobre un servidor Express real, una base de datos MongoDB sembrada (`npm run seed`) y una aplicación React Vite en producción/desarrollo local.
2. **Determinismo y Resiliencia en Inferencia IA:** Implementar una estrategia de mocking desacoplada y determinista para la API de Gemini 1.5 Pro (vía interceptación de red en Playwright o entorno de test), garantizando que las pruebas E2E sean 100% reproducibles, rápidas, sin costo de cuotas y cubran tanto el camino feliz como la resiliencia ante contingencias (error 422 por ejercicios faltantes en fotos).
3. **Purga Definitiva de Tests Legados:** Erradicar archivos de prueba obsoletos heredados de la plataforma anterior (`smoke.spec.js`, `math-vision.spec.js`, etc.) que validaban elementos descontinuados o aserciones extemporáneas.
4. **Automatización Unificada de Calidad:** Garantizar que el comando `"test:all"` en el `package.json` raíz orqueste la totalidad de la pirámide de pruebas (unitarias de frontend, integración de backend y E2E de navegador) retornando un estado 100% verde sin advertencias.
5. **Cierre y Sincronización Documental:** Actualizar a profundidad `docs/ARCHITECTURE.md` y `docs/USER_GUIDE.md`, y realizar el saneamiento final de `.antigravity/context.md` purgando cualquier residuo conceptual a Hard/Soft skills o Web Speech API.

---

### 1.2 Configuración de la Suite E2E con Playwright (`tests/e2e/`)

#### 1.2.1 Topología y Orquestación de Servidores
La suite E2E se ejecuta mediante [playwright.config.js](file:///home/teran/proyectos/mathcoach-sparring/playwright.config.js), el cual administra los dos procesos del monorepo en paralelo:
- **Backend Express (Puerto 5000):** Montado con base de datos MongoDB local previamente inicializada mediante `npm run seed`.
- **Frontend SPA (Puerto 5173):** Servidor Vite de desarrollo/cliente.

#### 1.2.2 Estrategia de Mocking Determinista para Gemini 1.5 Pro
Las llamadas de evaluación multimodal enviadas desde el frontend a `POST /api/rounds/:id/evaluate` dependen internamente del SDK oficial de Gemini (`@google/genai`). Para las pruebas E2E, se implementa una estrategia híbrida robusta y determinista:
- **Interceptación de Red en Playwright (`page.route`):**
  Para flujos específicos como la resiliencia 422 o la simulación inmediata de calificaciones de ronda, los tests configuran interceptores a nivel de navegador sobre `**/api/rounds/*/evaluate`.
- **Manejador de Contingencias y Promoción Real en Base de Datos:**
  Para los flujos donde se valida la persistencia real y actualización del Dashboard (Flujo Promoción), la suite puede permitir la ejecución a través del backend aprovechando el modo offline determinista incorporado en [server/src/services/geminiService.js](file:///home/teran/proyectos/mathcoach-sparring/server/src/services/geminiService.js#L208-L221) cuando `GEMINI_API_KEY` no está configurada, o bien mockear selectivamente las llamadas de evaluación y actualización garantizando consistencia atómica.

---

### 1.3 Cobertura de los 4 Flujos de Usuario Críticos

La suite E2E validará de manera exhaustiva cuatro escenarios primordiales del ciclo de vida del producto:

#### Flujo 1: Flujo Técnica (Happy Path: Panel → "Entrenar ahora" → Ronda Técnica)
1. El usuario accede a la pestaña "Panel" (`#tab-dashboard` / `#dashboard-view`).
2. Visualiza las tarjetas de resumen (`#card-due-technique`, `#card-due-application`, `#card-due-proof`) y el botón principal "Entrenar ahora" (`#btn-train-now`).
3. Hace clic en `#btn-train-now`, el cual detona la pista prioritaria recomendada de la cola SRS.
4. La aplicación conmuta automáticamente a la pestaña de entrenamiento y monta [RoundSession](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/RoundSession.jsx).
5. Se valida el encabezado de la ronda (`#round-header`): indica categoría *"Técnica"*, dificultad actual y tiempo estimado *"~15 min"*.
6. Se constata la presencia de entre **3 y 10 ejercicios visibles** (en conformidad con la regla de negocio §1.1 para la categoría Técnica), renderizados correctamente con fórmulas matemáticas mediante KaTeX (`.katex` / `[id^="round-exercise-"]`).

#### Flujo 2: Flujo Promoción (Captura por Archivo → Evaluación Exitosa → Promoción a Dificultad 2 en Panel)
1. El usuario inicia una sesión de práctica sobre una pista en Dificultad 1.
2. Tras revisar los ejercicios en el modo de resolución, hace clic en `#btn-finish-round` ("Ya terminé, capturar").
3. En la vista de captura, sube una o más fotografías simuladas de su libreta a través del input de archivo (`#camera-fallback-file-input`).
4. Se verifica que la galería `#photo-capture-gallery` muestre las miniaturas cargadas.
5. El usuario pulsa `#btn-submit-round` ("Enviar a evaluar").
6. Se simula una evaluación sobresaliente: `roundScore >= 4.0` y `passRate >= 0.8` (ej. `roundScore: 5.0, passRate: 1.0, promoted: true, newDifficulty: 2`).
7. La aplicación transiciona a la pantalla [RoundResults](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/RoundResults.jsx) (`#round-results`):
   - Muestra el dictamen en `#round-progression`: *"¡Felicidades! Subes a dificultad 2 en Técnica para el próximo repaso"*.
   - Muestra el desglose por ejercicio con insignias de aprobación y pistas socráticas.
8. El usuario pulsa el botón para regresar al Panel ("Volver al Panel" / `#tab-dashboard`).
9. En el Dashboard reloaded, se valida en la matriz de temas (`#topics-matrix`) que la pista correspondiente ahora refleja de forma efectiva la **Dificultad 2** (indicador visual de 2 segmentos activos).

#### Flujo 3: Flujo Demostración (Selección Manual en la Matriz → Ronda de 1 Ejercicio)
1. El usuario ingresa a la pestaña "Panel" (`#tab-dashboard`).
2. Localiza la matriz interactiva Tema × Categoría (`#topics-matrix`).
3. Hace clic manual en una celda de la columna Demostración (`#matrix-cell-<topicId>-proof`).
4. La aplicación abre la sesión [RoundSession](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/RoundSession.jsx) configurada para la categoría Demostración (`proof`).
5. Se constata en `#round-header` la etiqueta *"Demostración"*.
6. Se valida estrictamente que la ronda contenga **exactamente 1 ejercicio** (`#round-exercise-1` presente y `#round-exercise-2` inexistente), en pleno cumplimiento de la regla de composición para pruebas formales (presupuesto completo de ~15 min en una sola deducción).

#### Flujo 4: Flujo Resiliencia 422 (Detección de Ejercicio Faltante y Reevaluación Exitosa)
1. El usuario se encuentra en el modo de captura de una ronda de múltiples ejercicios.
2. Sube un archivo con desarrollo parcial y hace clic en `#btn-submit-round`.
3. El servicio responde con código HTTP `422 Unprocessable Entity`:
   ```json
   {
     "error": "exercises_not_found",
     "missing": [2]
   }
   ```
4. La UI de [RoundSession](file:///home/teran/proyectos/mathcoach-sparring/client/src/components/RoundSession.jsx) transiciona al estado `RECOVERY_422`:
   - Se despliega el contenedor de alerta `#alert-missing-exercises`.
   - Se destaca el texto indicando que el ejercicio `#2` no fue detectado en las imágenes.
   - Las fotos previamente capturadas **permanecen intactas** en la galería (cero pérdida de datos).
5. El usuario anexa una fotografía adicional mediante `#camera-fallback-file-input` cubriendo la página faltante.
6. Se presiona nuevamente `#btn-submit-round`.
7. La llamada responde exitosamente con `200 OK` (todos los ejercicios evaluados).
8. La UI avanza satisfactoriamente a `#round-results`, completando la recuperación sin fricciones.

---

### 1.4 Purga y Actualización de Tests E2E Legados

Se audita la carpeta `tests/e2e/` para eliminar toda divergencia con el producto actual:
- **Eliminación de `tests/e2e/smoke.spec.js`:** Contiene referencias obsoletas a títulos de "DevCoach" y encabezados legados. Se sustituye por validaciones directas de MathCoach Sparring.
- **Reemplazo/Depuración de `tests/e2e/math-vision.spec.js`:** Orientado al prototipo unifamiliar previo de captura simple; se refactoriza o reemplaza por la suite integral de rondas y dashboard.
- **Creación de Specs Modernos y Modulares:**
  - `tests/e2e/round-session.spec.js`: Cubre el ciclo de vida de rondas (Técnica y Demostración), renderizado KaTeX y resiliencia 422.
  - `tests/e2e/progression-dashboard.spec.js`: Cubre la interacción con el Dashboard, "Entrenar ahora", matriz interactiva y persistencia de la promoción a Dificultad 2.
  - `tests/e2e/smoke.spec.js` (renovado): Prueba rápida de sanidad de la SPA (título "MathCoach Sparring", selector de pestañas, estado de API online).

---

### 1.5 Scripts y Automatización (`package.json`)

El archivo [package.json](file:///home/teran/proyectos/mathcoach-sparring/package.json) en la raíz debe consolidar la ejecución canónica:
```json
{
  "scripts": {
    "dev:server": "npm --workspace=server run dev",
    "dev:client": "npm --workspace=client run dev",
    "dev": "concurrently -n \"SERVER,CLIENT\" -c \"blue,green\" \"npm run dev:server\" \"npm run dev:client\"",
    "seed": "npm --workspace=server run seed",
    "test:server": "npm --workspace=server test",
    "test:client": "npm --workspace=client test",
    "test": "npm run test:server && npm run test:client",
    "test:e2e": "LD_LIBRARY_PATH=\"${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu\" playwright test",
    "test:all": "npm test && npm run test:e2e"
  }
}
```
Se certificará que `npm run test:all` ejecute consecutivamente todas las suites unitarias/integración (Vitest cliente + Vitest/Supertest servidor) y culmine con la suite Playwright en verde.

---

### 1.6 Sincronización y Cierre Documental

1. **`docs/ARCHITECTURE.md`:**
   - Registrar la arquitectura definitiva de testing automatizado (pirámide de pruebas, configuración de Playwright y mocks deterministas de IA).
   - Documentar la máquina de estados de cliente en `RoundSession`, el contrato de la matriz del Dashboard y las políticas de retención espaciada (SRS SM-2 por pista).
2. **`docs/USER_GUIDE.md`:**
   - Detallar la experiencia del estudiante: navegación del Dashboard, uso del botón "Entrenar ahora", práctica activa en papel, subida de fotos, manejo de la alerta 422 de ejercicios no encontrados y lectura del veredicto de progresión.
3. **`.antigravity/context.md`:**
   - Purgar cualquier referencia residual a *"Hard & Soft Skills"*, *"Web Speech API"*, perfiles de contratación laboral o simulaciones.
   - Reflejar con fidelidad la identidad del proyecto: *Entrenador Personal de Matemáticas Universitarias (Active Recall Multimodal & Spaced Repetition SRS)*.

---

## 2. Criterios de Aceptación (AC)

Los criterios de aceptación corresponden con fidelidad matemática a los estipulados en `.antigravity/graph.md` para **[MATH-US-15]**:

- [x] **AC-1:** Specs Playwright con backend real sobre BD sembrada y Gemini mockeado (variable de entorno o interceptor de red): (a) Panel → Entrenar ahora → ronda Técnica con 3–10 ejercicios visibles; (b) captura por archivo → resultados → promoción a dificultad 2 reflejada en el Panel; (c) ronda de Demostración con 1 solo ejercicio; (d) flujo 422 con foto adicional.
- [x] **AC-2:** Se eliminan specs E2E obsoletos (`math-vision.spec.js`, `dashboard.spec.js`, `smoke.spec.js` se actualizan o reemplazan).
- [x] **AC-3:** `npm run test:all` en verde.
- [x] **AC-4:** `docs/ARCHITECTURE.md` y `docs/USER_GUIDE.md` actualizados (skills `document-tech-specs` y `document-user-guide`) explicando categorías, dificultades, rondas de 15 min y su efecto en el SRS.
- [x] **AC-5:** `.antigravity/context.md` actualizado: título y stack sin referencias a Hard/Soft Skills ni Web Speech API.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos del Grafo:**
  - `[MATH-US-15] Validación E2E Final + Documentación`
  - `playwright.config.js`
  - `@playwright/test`
  - `RoundSession`
  - `RoundResults`
  - `RoundPhotoCapture`
  - `Dashboard`
  - `MathStatement`
  - `App`
  - `evaluateRoundSolutions`
  - `computeRoundOutcome`
  - `package.json`
  - `docs/ARCHITECTURE.md`
  - `docs/USER_GUIDE.md`
  - `.antigravity/context.md`

- **Archivos a Intervenir y Crear:**
  - `tests/e2e/00-smoke.spec.js` (Reemplazo / Actualización con validaciones modernas de sanidad de la plataforma).
  - `tests/e2e/01-round-session.spec.js` (Nuevo: Especificaciones E2E para flujo Técnica, KaTeX, Demostración con 1 ejercicio y resiliencia 422).
  - `tests/e2e/02-progression-dashboard.spec.js` (Nuevo: Especificaciones E2E para el flujo de promoción a Dificultad 2 y navegación en Panel).
  - `playwright.config.js` (Ajustes de workers: 1, variables de entorno de testing MOCK_GEMINI=true y webServer).
  - `package.json` (Asegurar y verificar el script unificado `test:all` con pre-seed limpio).
  - `.antigravity/context.md` (Saneamiento integral: purga de Hard/Soft skills y Web Speech API).
  - `docs/ARCHITECTURE.md` (Actualización técnica final de la arquitectura del monorepo y testing).
  - `docs/USER_GUIDE.md` (Actualización pedagógica y operativa del manual de usuario).

---

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```text
✓ tests/catalog.test.js (15 tests) 57ms
✓ tests/dashboard.test.js (7 tests) 1032ms
✓ tests/models.test.js (19 tests) 1152ms
✓ tests/progressionEngine.test.js (11 tests) 20ms
✓ tests/roundEvaluation.test.js (15 tests) 1845ms
✓ tests/rounds.api.test.js (16 tests) 1302ms
✓ tests/srsCalculator.test.js (5 tests) 18ms
✓ tests/topics.test.js (6 tests) 795ms
✓ tests/roundBuilder.test.js (15 tests) 24ms
✓ tests/health.test.js (1 test) 853ms

Test Files  10 passed (10)
     Tests  105 passed (105)

✓ tests/App.test.jsx (3 tests) 2172ms
✓ tests/RoundSession.test.jsx (5 tests) 3263ms
✓ tests/MathVisionUploader.test.jsx (11 tests) 4122ms
✓ tests/Dashboard.test.jsx (7 tests) 642ms
✓ tests/RoundResults.test.jsx (3 tests) 449ms

Test Files  5 passed (5)
     Tests  29 passed (29)
```

### Tests E2E (Playwright)

```text
Running 5 tests using 1 worker

  ✓  1 tests/e2e/00-smoke.spec.js:4:3 › Smoke Test - MathCoach Sparring Frontend & Health › la aplicación carga correctamente con título, encabezado e indicador de API (2.1s)
  ✓  2 tests/e2e/01-round-session.spec.js:4:3 › Flujos E2E de Sesión de Ronda y Resiliencia (MATH-US-15) › Flujo 1: Panel -> Entrenar ahora -> Ronda Técnica con 3 a 10 ejercicios y fórmulas KaTeX (1.0s)
  ✓  3 tests/e2e/01-round-session.spec.js:39:3 › Flujos E2E de Sesión de Ronda y Resiliencia (MATH-US-15) › Flujo 3: Ronda de Demostración con exactamente 1 ejercicio formal (904ms)
  ✓  4 tests/e2e/01-round-session.spec.js:62:3 › Flujos E2E de Sesión de Ronda y Resiliencia (MATH-US-15) › Flujo 4: Resiliencia 422 ante ejercicio faltante y reevaluación exitosa con foto adicional (1.1s)
  ✓  5 tests/e2e/02-progression-dashboard.spec.js:4:3 › Flujos E2E de Progresión y Panel de Control (MATH-US-15) › Flujo 2: Captura por archivo -> Evaluación exitosa -> Promoción a dificultad 2 reflejada en el Panel (1.8s)

  5 passed (10.6s)
```

---

## 5. Commit de Cierre en dev

```text
9489ca29ef851ecee584751380059ce22b7831bd
```
