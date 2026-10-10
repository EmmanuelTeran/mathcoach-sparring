# Contexto del Proyecto: MathCoach Sparring - Entrenador Personal de Matemáticas Universitarias

## 1. Stack Tecnológico Estricto

- Monorepo ligero:
  - `/client`: React 18+ (Vite), Tailwind CSS, Lucide Icons, KaTeX (render matemático LaTeX).
  - `/server`: Node.js, Express, Mongoose (MongoDB local/Atlas), SDK oficial `@google/genai` (Gemini 1.5 Pro).
- Pruebas automatizadas:
  - Unitarias y de Integración: Vitest + Testing Library (frontend) y Vitest + Supertest + MongoMemoryServer (backend).
  - E2E: Playwright configurado en `/tests/e2e` con interceptores de red y modo mock/offline determinista.

## 2. Política de Tokens y Graphify en Modo Estricto (PreToolUse)

- NUNCA uses comandos recursivos de lectura o greps masivos sobre el código.
- Antes de modificar cualquier archivo, consulta `graphify-out/graph.json` o `graphify-out/GRAPH_REPORT.md` para conocer los nodos y dependencias exactas del módulo.
- Lee exclusivamente los archivos identificados en el subgrafo de la tarea.

## 3. Principios de Código (mattpocock/skills)

- Ciclo TDD estricto: escribir la prueba que falle antes del código funcional.
- Simplicidad pragmática: cero sobreingeniería, evitar capas abstractas innecesarias.
- Tipado y contratos defensivos en interfaces y schemas de Mongoose.

## 4. Gestión de Tareas y Git

- Cada tarea debe tener su archivo correspondiente en `/tickets/US-XX-<nombre>.md`.
- El flujo de ramas es siempre `feature/US-XX-<nombre>` derivado de `dev`.
- No se realiza merge a `dev` sin evidencia completa de tests unitarios, integración y Playwright en el ticket.

## 5. Política de Modelos (Orquestación Asimétrica)

- **Modo Arquitecto (Modelo Pro):**
  - Reservado exclusivamente para la ejecución de `new-user-story` y refinamiento de `graph.md`.
  - Debe dejar los contratos, payloads y test cases completamente redactados en el ticket.
- **Modo Worker (Modelo Ligero/Flash):**
  - Utilizado para `implement-story`, `verify-user-story` y documentación.
  - El agente worker debe restringir su contexto al archivo `tickets/US-XX.md` activo y al subgrafo de Graphify para minimizar el consumo de tokens.
