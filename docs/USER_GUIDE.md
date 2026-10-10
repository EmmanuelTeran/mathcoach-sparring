# Guía de Usuario: MathCoach Sparring

Bienvenido a **MathCoach Sparring**, la plataforma de entrenamiento deliberado de matemáticas universitarias basada en **Active Recall en libreta física**, evaluación multimodal con Inteligencia Artificial (Gemini 1.5 Pro) y repetición espaciada (**SRS SM-2** adaptado).

---

## 1. Modelo Mental y Glosario del Producto

MathCoach Sparring organiza el aprendizaje alrededor de una matriz multidimensional desacoplada: **Tema × Categoría × Dificultad**. Se elimina por completo la terminología heredada de desarrollo de software (roles junior/mid/senior, hard/soft skills o niveles taxonómicos difusos).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        JERARQUÍA DEL DOMINIO                           │
├────────────────────────────────────────────────────────────────────────┤
│  Tema (MathTopic)         "Fracciones Algebraicas"                     │
│    │                                                                   │
│    ├── Categoría           Técnica (technique)                         │
│    │     └── Pista (TopicTrack)  Dificultad adaptativa (1 → 2 → 3)     │
│    │           └── Ronda (Round)  ~15 min de ejercicios (Exercise)     │
│    │                                                                   │
│    ├── Categoría           Aplicación (application)                    │
│    │     └── Pista (TopicTrack)  Dificultad adaptativa (1 → 2 → 3)     │
│    │           └── Ronda (Round)  ~15 min de ejercicios (Exercise)     │
│    │                                                                   │
│    └── Categoría           Demostración (proof)                        │
│          └── Pista (TopicTrack)  Dificultad adaptativa (1 → 2 → 3)     │
│                └── Ronda (Round)  ~15 min de ejercicios (Exercise)     │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Glosario de Entidades Clave

| Término | Definición de Dominio | Responsabilidad en la Plataforma |
|---|---|---|
| **Tema (`MathTopic`)** | Unidad curricular estructurada (ej. *"Fracciones algebraicas"*, *"Límites y continuidad"*). | Agrupador conceptual con `slug`, `title`, `area` (`algebra`, `trigonometria`, `geometria`, `calculo`, `analisis`), `source` y `description`. |
| **Categoría** | Dimensión pedagógica del ejercicio. Son fijas: **Técnica** (`technique`), **Aplicación** (`application`) y **Demostración** (`proof`). | Clasifica el tipo de habilidad mental puesta a prueba. Sustituye los antiguos "niveles 1/2/3". |
| **Dificultad** | Escalón adaptativo numérico (**1, 2 o 3**) **dentro** de cada categoría. | Sube adaptativamente según el desempeño del estudiante. Inicia en 1 y no se degrada. |
| **Pista (`TopicTrack`)** | Par único *(Tema × Categoría)*. Cada tema posee exactamente 3 pistas. | Unidad que mantiene el estado de **Repetición Espaciada (SRS SM-2)** y la **dificultad actual**. |
| **Ejercicio (`Exercise`)** | Problema concreto de cuaderno formulado en Markdown + LaTeX. | Contiene `statement`, `referenceSolution`, `expertMinutes` (> 0) y `order` (complejidad creciente). |
| **Ronda (`Round`)** | Sesión de práctica compacta que **un experto resolvería en ~15 minutos**. | Snapshot inmutable de ejercicios asignados para una pista en su dificultad actual. Se evalúa en bloque. |
| **Tiempo Experto (`expertMinutes`)** | Minutos estimados que tarda un docente o estudiante avanzado en resolver el ejercicio. | Criterio objetivo para presupuestar y ensamblar rondas balanceadas de ~15 minutos. |

---

## 2. Las 3 Categorías y el Sistema Adaptativo de Rondas

Cada tema curricular se ejercita a través de 3 pistas complementarias e independientes:

### 2.1 Categorías Pedagógicas

1. **Técnica (`technique` - "Técnica"):**
   - **Enfoque:** Agilidad de cálculo, procedimientos algebraicos, manipulaciones de signos, factorizaciones y exactitud computacional.
   - **Expectativa de Tiempo Experto:** **1 a 5 minutos** por ejercicio.
   - **Composición de Ronda:** Acumula ejercicios de corta duración hasta sumar $\ge 15$ minutos de tiempo experto (entre **3 y 10 ejercicios** por ronda).
2. **Aplicación (`application` - "Aplicación"):**
   - **Enfoque:** Planteamiento analítico de problemas del mundo real, modelado matemático y aplicación directa de teoremas de cálculo, cinemática, geometría y optimización.
   - **Expectativa de Tiempo Experto:** **5 a 15 minutos** por problema.
   - **Composición de Ronda:** Problemas más extensos y de reflexión analítica (entre **1 y 3 ejercicios** por ronda).
3. **Demostración (`proof` - "Demostración"):**
   - **Enfoque:** Validez deductiva formal, cuantificadores ($\forall, \exists$), inducción matemática, reducción al absurdo, límites $\varepsilon-\delta$ y rigor axiomático.
   - **Expectativa de Tiempo Experto:** **8 a 15 minutos** por demostración.
   - **Composición de Ronda:** **Siempre 1 único ejercicio** de profundidad formal por ronda.

---

## 3. Catálogo Curado de Ejercicios Matemáticos

MathCoach Sparring incorpora un catálogo pedagógico inicial de **132 ejercicios matemáticos curados**, redactados en **Markdown con KaTeX/LaTeX riguroso** y provistos de soluciones de referencia detalladas paso a paso (`referenceSolution`).

### 3.1 Temas Curriculares Disponibles

| Área | Tema (`MathTopic`) | Fuente Curricular | Descripción Pedagógica |
|---|---|---|---|
| **Álgebra** | **Fracciones Algebraicas** (`fracciones-algebraicas`) | CONAMAT | Simplificación de expresiones racionales, suma/resta con MCM polinomial, multiplicación, división, fracciones complejas y descomposición en fracciones parciales. |
| **Álgebra** | **Factorización de Polinomios** (`factorizacion-polinomios`) | CONAMAT | Máximo factor común monomio y por agrupación, diferencia de cuadrados, trinomios cuadrados perfectos, trinomios cuadráticos generales, suma/diferencia de cubos, artificios de Sophie Germain y regla de Ruffini. |
| **Cálculo / Análisis** | **Límites y Continuidad** (`limites-continuidad`) | Stewart / Spivak | Evaluación directa, resolución analítica de indeterminaciones $\frac{0}{0}$ e $\frac{\infty}{\infty}$, límites al infinito y asíntotas, continuidad puntual y en intervalos, teorema del valor intermedio (TVI) y demostraciones formales $\varepsilon-\delta$. |
| **Cálculo / Análisis** | **Derivadas y Regla de la Cadena** (`derivadas-regla-cadena`) | Stewart / Spivak | Definición formal de derivada por límite del cociente incremental, reglas del producto y cociente, regla de la cadena para funciones compuestas y trascendentes, derivación implícita y logarítmica, razones de cambio relacionadas y optimización. |

### 3.2 Distribución de Ejercicios por Matriz (Tema × Categoría × Dificultad)

Cada tema contiene **33 ejercicios** distribuidos equitativamente a lo largo de sus 3 dificultades adaptativas:

- **Por cada Dificultad (1, 2 o 3):**
  - **Técnica:** 6 ejercicios ($\ge 30$ minutos acumulados de tiempo experto).
  - **Aplicación:** 3 ejercicios ($\ge 20$ minutos acumulados).
  - **Demostración:** 2 ejercicios ($\ge 16$ minutos acumulados).
  - *Subtotal por dificultad:* 11 ejercicios.
- **Garantía para el Estudiante:** Esta densidad asegura que la plataforma puede construir **al menos 2 rondas de práctica completamente distintas y disjuntas** (~15 min cada una) dentro de cada nivel de dificultad sin repetir ningún ejercicio.

### 3.3 Siembra e Inicialización del Catálogo (`npm run seed`)

Para poblar o sincronizar el catálogo curado en la base de datos sin duplicar contenido ni alterar tu progreso de repaso existente:

```bash
# Ejecutar siembra desde la raíz del proyecto
npm run seed

# O específicamente en el workspace del servidor
npm --workspace=server run seed
```
El proceso es **estrictamente idempotente**: si ya tienes repasos acumulados o has ascendido de dificultad en alguna pista, tus registros SM-2 y métricas se conservan intactos.

## 4. Dinámica de Dificultad Adaptativa y Motor SRS (SM-2)

A diferencia de las metodologías tradicionales donde se mezcla todo en una única calificación, MathCoach Sparring maneja la memoria y la dificultad por **Pista (`TopicTrack`)**.

### 4.1 Progresión y Promoción Adaptativa

- Cada ejercicio de una ronda recibe una calificación de `0 a 5`.
- Se calcula:
  $$\text{roundScore} = \text{promedio}(\text{scores})$$
  $$\text{passRate} = \frac{\text{ejercicios con score } \ge 3}{\text{total ejercicios}}$$
- **Regla de Promoción:**
  $$\text{dificultad} < 3 \quad \land \quad \text{roundScore} \ge 4.0 \quad \land \quad \text{passRate} \ge 0.8 \implies \text{Dificultad} + 1$$
  Al ser promovido, el próximo repaso se programa en un intervalo fijo corto (**3 días**) para afianzar el material nuevo de nivel superior.
- **Regla de Permanencia:** Si no se cumplen los umbrales de promoción, la dificultad se mantiene. **No existe degradación** involuntaria de dificultad hacia atrás.

### 4.2 Impacto en la Repetición Espaciada (SM-2 por Pista)

| Resultado de la Ronda | Impacto en Dificultad | Impacto en Repetición Espaciada (SRS) |
|---|---|---|
| `roundScore < 3` (Fallo) | Se mantiene | **Reinicio SM-2:** `repetition = 0`, intervalo fijado en `1 día`. |
| Aprobada sin promoción | Se mantiene | **SM-2 Estándar:** Progresión regular según `calculateNextReview`. |
| Promoción | Sube a la siguiente dificultad | `repetition = 1`, intervalo en `3 días` (repaso rápido de material nuevo). `efactor` conservado. |
| Dificultad 3 con score alto | Se mantiene (tope) | **SM-2 Estándar:** Intervalos exponenciales largos (consolidación de maestría). |

---

## 5. Requisitos del Entorno e Instalación

- **Node.js:** v20+ o v24+
- **NPM:** v10+
- **MongoDB:** Instancia local o remota (`mongodb://localhost:27017/mathcoach_sparring`), o modo standalone para desarrollo inicial.

### 5.1 Instalación de Dependencias

```bash
npm install
```

### 5.2 Ejecución en Desarrollo

Puedes ejecutar backend y frontend simultáneamente:

```bash
npm run dev
```

O por separado en terminales independientes:
- **Backend (Express):** `npm run dev:server` (disponible en `http://localhost:5000`)
- **Frontend (Vite + React):** `npm run dev:client` (disponible en `http://localhost:5173`)

---

## 6. Batería de Pruebas Automatizadas

```bash
# Pruebas unitarias e integración (Server + Client)
npm test

# Pruebas de auditoría de catálogo y seed
npm --workspace=server test tests/catalog.test.js

# Pruebas exclusivas de backend (modelos, temas, SRS)
npm run test:server

# Pruebas exclusivas de frontend
npm run test:client

# Pruebas End-to-End con Playwright
npm run test:e2e

# Suite completa
npm run test:all
```

---

## 7. Módulo de Entrenamiento en Cuaderno Físico: Math Vision

El módulo **Math Vision** permite ejercitar el razonamiento matemático sobre papel y libreta, evitando distracciones digitales.

### 7.1 Enunciado Formal en Pantalla (`MathStatement.jsx`)
- En la pestaña **"Entrenar"**, la aplicación renderiza el problema matemático con **notación tipográfica LaTeX** mediante **KaTeX** (`$ ... $` y `$$ ... $$`).
- Si no hay ejercicio cargado, se muestra un estado claro: *"No hay ejercicio cargado — elige un tema desde el Panel"*.

### 7.2 Resolución y Captura con Cámara
1. Lee el enunciado y resuélvelo por completo a mano en tu libreta física.
2. Haz clic en **"Activar Cámara"** (o usa el botón de subida manual si tu dispositivo no cuenta con cámara web).
3. Encuadra la página con las guías del visor y presiona **"📸 Tomar Foto / Capturar"**.
4. La cámara se detiene de inmediato para ahorrar batería. Revisa la nitidez y haz clic en **"🚀 Evaluar con IA"**.

### 7.3 Evaluación Multimodal y Feedback Pedagógico
- **Score (0 a 5):**
  - **4 a 5 (Verde):** Rigor formal, álgebra impecable o errores mínimos de notación.
  - **3 (Ámbar):** Planteamiento correcto con tropiezos aritméticos o dudas intermedias.
  - **0 a 2 (Rojo):** Errores conceptuales graves o procedimiento inconsistente.
- **Desglose Paso a Paso:** Inspección de los renglones manuscritos identificando la validez de cada paso lógico.
- **Pista Socrática (`💡 hint`):** Guía metodológica para superar el error sin revelar la respuesta final.
- **Actualización SRS:** Reprogramación automática de la pista para su próximo repaso espaciado.

