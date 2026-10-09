# Grafo de Implementación: MathCoach Sparring

## Grafo de Dependencias

[MATH-US-01: Limpieza de Base Legada y Renombrado Monorepo]
└──> [MATH-US-02: Modelo de Datos MathTopic y Motor SRS SM-2]
     └──> [MATH-US-03: UI de Cero Fricción para Active Recall (MathVisionUploader.jsx)]
          └──> [MATH-US-04: Pipeline Evaluador Multimodal (Gemini 1.5 Pro) y Actualización SRS]
               ├──> [MATH-US-05: Dashboard Matemático & Cola Diaria de Ejercicios por Nivel]
               └──> [MATH-US-06: Seed de Ejercicios Multinivel (CONAMAT / Stewart / Spivak) & E2E Final]

---

### [MATH-US-01] Limpieza de Base Legada y Renombrado Monorepo
- **Dependencias:** Ninguna (Completada)
- **Criterios de Aceptación (AC):**
  1. Monorepo renombrado a `mathcoach-sparring` en raíz y packages (`@mathcoach-sparring/client`, `@mathcoach-sparring/server`).
  2. Eliminación de componentes legados de DevCoach (`HardSkillTrainer.jsx`, `SoftSkillTrainer.jsx`).
  3. Eliminación de scripts y tests acoplados a semillas anteriores.

### [MATH-US-02] Modelo de Datos MathTopic y Motor SRS SM-2
- **Dependencias:** MATH-US-01 (Completada)
- **Criterios de Aceptación (AC):**
  1. Modelo `MathTopic` en `server/src/models/MathTopic.js` con soporte para `title`, `source`, `level` (1, 2, 3), `problemStatement` e historial.
  2. Motor SRS SM-2 (`srsCalculator.js`) soportando rango de puntajes 0 a 5, con aliases bidireccionales (`repetition`, `interval`, `efactor`, `dueDate`).
  3. Tests unitarios en verde (`server/tests/mathTopic.test.js`).

### [MATH-US-03] UI de Cero Fricción para Active Recall (MathVisionUploader.jsx)
- **Dependencias:** MATH-US-02 (En Progreso)
- **Criterios de Aceptación (AC):**
  1. Componente React `MathVisionUploader.jsx` con WebRTC (`getUserMedia`), selector de cámara frontal/trasera y gestión defensiva de permisos con fallback a `<input type="file">`.
  2. Visor interactivo en vivo con guías visuales de encuadre para cuadernos físicos y botón de captura instantánea a `<canvas>`.
  3. Conversión de frame a Base64 JPEG (`image/jpeg`, 0.85) con detención inmediata de tracks del stream.
  4. Estados de UI bien definidos: "Activar Cámara", "Capturar Ejercicio", "Analizando con IA..." y visualización de resultados pedagógicos (Score 0-5, feedback paso a paso, hint y fecha SRS).
  5. Contrato de envío `POST /api/evaluate-math` con payload estructurado `{ problemId, image, metadata }`.

### [MATH-US-04] Pipeline Evaluador Multimodal y Actualización SRS
- **Dependencias:** MATH-US-03
- **Criterios de Aceptación (AC):**
  1. Endpoint `POST /api/evaluate-math` en Express recibiendo payload Base64 y delegando a Gemini 1.5 Pro (`@google/genai`).
  2. Prompt de profesor riguroso adaptado a los 3 niveles matemáticos (1: Computacional, 2: Modelado, 3: Demostración).
  3. Salida JSON estricta con `{ score, feedback_paso_a_paso, hint }` y actualización automática en base de datos mediante `srsCalculator`.

### [MATH-US-05] Dashboard Matemático & Cola Diaria de Ejercicios por Nivel
- **Dependencias:** MATH-US-04
- **Criterios de Aceptación (AC):**
  1. Vista general con contadores de ejercicios pendientes de repaso filtrados por nivel.
  2. Botón "Resolver Ahora" que enlaza directamente con el `MathVisionUploader` cargando el ejercicio prioritario.

### [MATH-US-06] Seed de Ejercicios Multinivel y Validación E2E Final
- **Dependencias:** MATH-US-05
- **Criterios de Aceptación (AC):**
  1. Script `npm run seed` con ejercicios curados de CONAMAT, Stewart y Spivak clasificados en niveles 1, 2 y 3.
  2. Suite de pruebas E2E en Playwright validando el ciclo completo de captura, evaluación y actualización de repaso.
