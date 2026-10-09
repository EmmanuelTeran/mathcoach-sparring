# [MATH-US-07] Hotfix UI: Enunciado Visible, Captura Única y Textos Coherentes

- **Estado:** Completado
- **Rama:** `feature/MATH-US-07-hotfix-ui`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** 2026-10-09

## 1. Descripción

Resolver los problemas de experiencia de usuario (UX), incoherencias semánticas heredadas del prototipo DevCoach y defectos críticos de montaje detectados en la interfaz de usuario de **MathCoach Sparring**.

### Contexto y Defectos Detectados

1. **Enunciado Matemático Invisible:**
   - En el flujo actual de Active Recall, `MathVisionUploader.jsx` únicamente visualiza la propiedad `topic.title` dentro de un tag discreto. En ningún momento renderiza el enunciado del ejercicio (`problemStatement`).
   - El objeto dummy/fallback en `App.jsx` ni siquiera provee la clave `problemStatement`.
   - Para que el usuario pueda resolver el problema en su libreta, es indispensable que visualice claramente la formulación del ejercicio antes de activar la cámara o realizar la captura.
   - Es mandatorio construir un componente reutilizable `client/src/components/MathStatement.jsx` que incorpore renderizado de Markdown enriquecido con notación matemática LaTeX a través de KaTeX, instalando en el cliente las dependencias `react-markdown`, `remark-math`, `rehype-katex` y los estilos CSS de `katex`.

2. **Montaje Duplicado de `MathVisionUploader` en `App.jsx`:**
   - En `client/src/App.jsx`, cuando `activeTab === 'math-vision'`, el componente `<MathVisionUploader>` se encuentra instanciado dos veces consecutivas (líneas 102–111 y 118–127).
   - Esto desencadena inicializaciones redundantes, colisión de streams de cámara web, elementos repetidos en el DOM con mismos identificadores y consumo innecesario de recursos.

3. **Estado Vacío Amigable:**
   - Si no existe un ejercicio seleccionado o este no cuenta con `problemStatement` (`!topic?.problemStatement`), la interfaz no debe mostrar el visor de cámara ni controles de captura interactivos.
   - En su lugar, debe desplegar un contenedor informativo accesible y claro con el mensaje: *"No hay ejercicio cargado — elige un tema desde el Panel"*, orientando al usuario hacia la pestaña del panel.

4. **Purga Absoluta del "Coding Playground":**
   - La aplicación aún retiene la pestaña y el ecosistema completo del editor de código monaco heredado del prototipo DevCoach.
   - Se debe eliminar totalmente el componente `client/src/components/CodingPlayground.jsx`, las utilidades `client/src/utils/codeRunner.js` y `client/src/utils/monacoSetup.js`, la suite de tests unitarios `client/src/utils/codeRunner.test.js`, la prueba E2E `tests/e2e/coding-playground.spec.js`, así como desinstalar las pesadas dependencias `@monaco-editor/react` y `monaco-editor` de `client/package.json`.
   - La barra de navegación debe quedar simplificada a únicamente dos pestañas: **Entrenar** (con icono de cámara o active recall) y **Panel** (con icono de dashboard).

5. **Limpieza Exhaustiva de Copys Legados en `Dashboard.jsx`:**
   - `client/src/components/Dashboard.jsx` aún exhibe conceptos y textos pertenecientes al evaluador de software: filtros de nivel "Junior / Mid / Senior", tarjetas de "Hard Skills (Técnico)" y "Soft Skills (Voz)", descripciones como "simulaciones", "Defensa y consultoría con stakeholders", "retos activos" y "trade-offs omitidos".
   - Se deben erradicar todos estos vestigios, simplificando temporalmente la vista a métricas matemáticas neutras ("Repasos pendientes", "Áreas críticas") a la espera de la reimplementación integral con el modelo de pistas en MATH-US-14.

---

## 2. Criterios de Aceptación (AC)

### AC-1: Montaje Único de `MathVisionUploader` y Test de Instancia Única
- [x] `App.jsx` monta un único `MathVisionUploader`.
- [x] Existe un test unitario/integración en Vitest que verifica una sola instancia del botón de activación (`#btn-activate-camera` o id equivalente) en la pestaña de captura al renderizar `App.jsx`.

### AC-2: Componente `MathStatement.jsx` con Markdown + LaTeX (KaTeX)
- [x] Crear el componente `client/src/components/MathStatement.jsx` utilizando:
  - `react-markdown`
  - `remark-math`
  - `rehype-katex`
  - Importación de hoja de estilos `katex/dist/katex.min.css`
- [x] El componente recibe `statement` (Markdown con expresiones LaTeX delimitadas por `$ ... $` o `$$ ... $$`) y se renderiza con id `#problem-statement`.
- [x] Se muestra de forma prominente **encima** del área de captura visual.

### AC-3: Estado Vacío cuando no hay Ejercicio Cargado
- [x] Si `!topic?.problemStatement` (o la propiedad viene vacía/indefinida), no se renderiza la cámara ni los controles de captura.
- [x] Se muestra un estado vacío claro con el texto exacto: *"No hay ejercicio cargado — elige un tema desde el Panel"*.
- [x] Opcionalmente se proporciona un botón o link para navegar directamente a la pestaña del Panel.

### AC-4: Eliminación Total de "Coding Playground" y Navegación Simplificada
- [x] Se eliminan completamente los siguientes archivos:
  - `client/src/components/CodingPlayground.jsx`
  - `client/src/utils/codeRunner.js`
  - `client/src/utils/codeRunner.test.js`
  - `client/src/utils/monacoSetup.js`
  - `tests/e2e/coding-playground.spec.js`
- [x] Se desinstalan / eliminan las dependencias del `client/package.json`:
  - `@monaco-editor/react`
  - `monaco-editor`
- [x] La navegación de pestañas en `App.jsx` se reduce a únicamente dos opciones:
  - **Entrenar** (id: `#tab-math-vision`, tab value: `'math-vision'`)
  - **Panel** (id: `#tab-dashboard`, tab value: `'dashboard'`)

### AC-5: Limpieza de Copys Legados en `Dashboard.jsx`
- [x] Desaparece el selector/filtro de niveles `Junior / Mid / Senior` (`#level-selector-dashboard`).
- [x] Desaparecen las tarjetas segmentadas "Hard Skills (Técnico)" y "Soft Skills (Voz)".
- [x] Se retiran los textos de DevCoach: "simulaciones", "Defensa y consultoría con stakeholders", "retos activos", "trade-offs omitidos".
- [x] Quedan únicamente métricas neutrales coherentes con la práctica matemática:
  - "Repasos pendientes" (conteo de `dueCount`)
  - "Áreas críticas" (lista de temas con `lastScore < 3`)
  - Botón de acción principal "Entrenar Ahora" que redirige al flujo de entrenamiento matemático.

### AC-6: Verificación de Cero Residuos Legados en Frontend
- [x] La ejecución del comando:
  ```bash
  grep -ri "junior\|senior\|soft skill\|hard skill\|coding playground\|stakeholder" client/src
  ```
  no devuelve ningún resultado.

### AC-7: Suite de Tests Verde (Cliente y E2E)
- [x] Todos los tests de cliente existentes y nuevos pasan exitosamente (`npm --prefix client test`).
- [x] Todos los tests E2E existentes (no eliminados) continúan en verde (`npx playwright test`).

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `App()`, `App.jsx`, `MathVisionUploader()`, `MathVisionUploader.jsx`, `MathStatement()`, `MathStatement.jsx`, `Dashboard()`, `Dashboard.jsx`, `CodingPlayground()`, `CodingPlayground.jsx`, `codeRunner.js`, `monacoSetup.js`, `@monaco-editor/react`, `monaco-editor`, `tests/e2e/coding-playground.spec.js`, `client/package.json`.
- **Archivos a intervenir:**
  - **Crear:**
    - `client/src/components/MathStatement.jsx`: Componente de renderizado de enunciados matemáticos con KaTeX y Markdown.
    - `client/tests/App.test.jsx`: Pruebas de integración para verificar montaje único de `MathVisionUploader`, alternancia de pestañas (Entrenar y Panel) y estado vacío.
  - **Modificar:**
    - `client/package.json`: Agregar dependencias `react-markdown`, `remark-math`, `rehype-katex`, `katex`; remover `@monaco-editor/react` y `monaco-editor`.
    - `client/src/App.jsx`: Eliminar pestañas y montaje de `CodingPlayground`, corregir duplicación de `<MathVisionUploader>`, actualizar copys de pestañas a "Entrenar" y "Panel", e inyectar un `topic` de prueba con `problemStatement` en Markdown + LaTeX.
    - `client/src/components/MathVisionUploader.jsx`: Integrar `<MathStatement>` sobre la sección de captura; añadir renderizado condicional de estado vacío si no hay `problemStatement`.
    - `client/src/components/Dashboard.jsx`: Purgar filtros de nivel junior/mid/senior, tarjetas de hard/soft skills y terminología de software.
    - `client/tests/MathVisionUploader.test.jsx`: Actualizar o enriquecer tests para considerar la visualización del enunciado matemático y el estado vacío.
  - **Eliminar:**
    - `client/src/components/CodingPlayground.jsx`
    - `client/src/utils/codeRunner.js`
    - `client/src/utils/codeRunner.test.js`
    - `client/src/utils/monacoSetup.js`
    - `tests/e2e/coding-playground.spec.js`

---

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest)

```bash
> @mathcoach-sparring/client@1.0.0 test
> vitest run

 ✓ tests/App.test.jsx (3 tests) 810ms
   ✓ App Component Integration Tests > AC-1: monta un único componente MathVisionUploader en la pestaña de entrenar
   ✓ App Component Integration Tests > AC-4: sólo contiene las pestañas "Entrenar" y "Panel"
   ✓ App Component Integration Tests > AC-1 & AC-4: alterna correctamente entre la pestaña Entrenar y Panel
 ✓ tests/MathVisionUploader.test.jsx (11 tests) 1361ms
   ✓ MathVisionUploader Integration & Unit Tests > AC-3: muestra estado vacío cuando topic no tiene problemStatement
   ✓ MathVisionUploader Integration & Unit Tests > AC-2: renderiza MathStatement con id problem-statement cuando topic tiene enunciado
   ✓ MathVisionUploader Integration & Unit Tests > AC-1: renderiza estado inicial IDLE sin activar la cámara si hay problemStatement
   ✓ MathVisionUploader Integration & Unit Tests > AC-1: solicita permisos con constraints correctos al hacer clic en Activar Cámara
   ✓ MathVisionUploader Integration & Unit Tests > AC-1: maneja permisos denegados mostrando mensaje y fallback de archivo
   ✓ MathVisionUploader Integration & Unit Tests > AC-1: limpia y detiene los tracks del stream al desmontar el componente
   ✓ MathVisionUploader Integration & Unit Tests > AC-2 & AC-3: captura imagen con canvas, detiene el stream y entra en estado preview
   ✓ MathVisionUploader Integration & Unit Tests > AC-3: permite repetir la foto y volver al stream de video en vivo
   ✓ MathVisionUploader Integration & Unit Tests > AC-4, AC-5 & AC-6: envía POST /api/evaluate-math y muestra los resultados y badge pedagógico
   ✓ MathVisionUploader Integration & Unit Tests > AC-5: gestiona error en respuesta del backend y permite reintentar
   ✓ MathVisionUploader Integration & Unit Tests > AC-1 fallback: permite seleccionar archivo si no hay cámara y procesa a Base64

 Test Files  2 passed (2)
      Tests  14 passed (14)
   Duration  5.05s
```

### Verificación Grep Legados en Frontend

```bash
grep -ri "junior\|senior\|soft skill\|hard skill\|coding playground\|stakeholder" client/src
# Resultado: código de salida 1 (0 coincidencias)
```

### Tests E2E (Playwright - Flujo Math Vision Activo)

```bash
LD_LIBRARY_PATH="${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}/home/teran/.local/lib/usr/lib/x86_64-linux-gnu" npx playwright test tests/e2e/math-vision.spec.js

Running 1 test using 1 worker
  ✓ 1 [chromium] › tests/e2e/math-vision.spec.js:4:3 › Math Vision Uploader - Active Recall E2E Flow › renderiza la interfaz de Math Vision, muestra el estado inicial y permite fallback de archivo (1.7s)

  1 passed (5.5s)
```

---

## 5. Commit de Cierre en dev

`Pendiente de push / merge tras validación`

