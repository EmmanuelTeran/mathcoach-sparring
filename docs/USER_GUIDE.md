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

### 2.2 Estructura de las Sesiones de Práctica: El Bloque de ~15 Minutos de Tiempo Experto

El entrenamiento deliberado universitario no se realiza problema a problema con la fricción constante de capturar una foto tras cada paso. En MathCoach Sparring, la práctica se organiza en **bloques de trabajo concentrado en libreta física** equivalentes a **~15 minutos de tiempo experto** (`ROUND_BUDGET_MIN = 15`):

- **¿Qué es el Tiempo Experto (`expertMinutes`)?** Es la duración estimada que le tomaría a un docente o estudiante avanzado resolver el ejercicio con rigor. Para ti como estudiante en fase de aprendizaje, el bloque real de libreta suele tomar entre **20 y 35 minutos**, ofreciendo una sesión completa y profunda de enfoque continuo (Deep Work).
- **Inmutabilidad de la Sesión:** Al iniciar la ronda, el sistema congela un *snapshot* exacto con los enunciados seleccionados. Si el catálogo se actualiza con posterioridad, tu sesión conserva intacto el material de práctica asignado.

### 2.3 Cuotas de Ejercicios por Categoría

La cantidad de ejercicios asignados en una ronda depende directamente de la categoría de la pista:

| Categoría | Cuota de Ejercicios | Duración por Ejercicio | Regla de Composición Temporal |
|---|---|---|---|
| **Técnica (`technique`)** | **3 a 10 ejercicios** | 1 a 5 min | Acumula ejercicios breves hasta alcanzar $\ge 15$ minutos o alcanzar el tope de 10 ejercicios. Con ejercicios de 5 min se detiene al llegar a 3 ejercicios; con ejercicios de 1–2 min conforma lotes ágiles de 8 a 10 ejercicios. |
| **Aplicación (`application`)** | **1 a 3 ejercicios** | 5 a 15 min | Problemas de modelado y análisis. Un ejercicio largo de 15 min compone una ronda completa de 1 solo ejercicio; si los ejercicios son medianos (5–8 min), combina 2 o 3. |
| **Demostración (`proof`)** | **Exactamente 1 ejercicio** | 8 a 15 min | Un único reto deductivo profundo por sesión (reducción al absurdo, inducción, $\varepsilon-\delta$, etc.). |

> [!NOTE]
> **Catálogo Insuficiente:** Si estás en un tema o dificultad donde el catálogo cuenta con menos ejercicios que la cuota mínima requerida (pero al menos 1), la plataforma te entrega todos los ejercicios disponibles acompañados de una advertencia (`catalog_insufficient`) para no frenar tu sesión de estudio.

### 2.4 Rotación Inteligente de Problemas

Para garantizar variedad didáctica y evitar la fatiga cognitiva de resolver siempre los mismos enunciados:
- **Cero Mezcla de Dificultades:** Una ronda selecciona únicamente ejercicios del nivel de dificultad actual de la pista (`track.difficulty`).
- **Rotación Justa:** El motor prioriza los ejercicios que menos veces has resuelto (`timesServed` más bajo) o que llevan más tiempo sin presentarse (`lastServedAt` más antiguo o nunca servido).
- **Secuencia Didáctica Creciente:** Dentro de tu ronda de libreta, los ejercicios se presentan ordenados por complejidad pedagógica creciente (`order` ascendente), permitiéndote entrar en calor antes de abordar los problemas más desafiantes.

### 2.5 Cola Inteligente de Repasos Diarios (`/api/rounds/queue`)

Tu panel de estudio organiza las pistas pendientes según un criterio estricto de prioridad pedagógica:
1. **Menor Puntuación Previa (`lastRoundScore` ascendente, con pistas nuevas primero):** Las pistas nunca antes practicadas o que tuvieron calificaciones reprobatorias (fallos o tropiezos recientes) se ubican en la cima de tu cola.
2. **Mayor Retraso Acumulado (`dueDate` ascendente):** A igualdad de puntuación, el sistema prioriza aquellas pistas cuyo vencimiento programado por el algoritmo SM-2 esté más rezagado en el tiempo.

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

A diferencia de las metodologías tradicionales donde se mezcla todo en una única calificación global, MathCoach Sparring gobierna el aprendizaje mediante un **Motor de Progresión Adaptativa puro** por **Pista (`TopicTrack`)**, evaluando cada dimensión curricular de forma independiente.

### 4.1 Calificación de la Ronda y Métricas de Rendimiento

Al culminar una ronda de práctica de ~15 minutos, cada ejercicio resuelto en libreta física y evaluado por la IA recibe una calificación numérica individual en escala formal de **0 a 5**:
- **`5` (Excelente / Dominio):** Procedimiento impecable, rigor algebraico o deductivo completo.
- **`4` (Bueno):** Planteamiento correcto con detalles menores de formato o simplificación.
- **`3` (Aprobado raspado):** Idea central correcta pero con tropiezos aritméticos intermedios (ejercicio aprobado individualmente).
- **`0 a 2` (Fallo):** Errores conceptuales graves, procedimiento incompleto o inconsistencia lógica.

A partir de estas notas individuales, el motor calcula automáticamente dos métricas deterministas:
1. **Puntaje de Ronda (`roundScore`):** Promedio aritmético de los ejercicios, redondeado estrictamente a **1 decimal**:
   $$\text{roundScore} = \frac{\text{round}\left(\frac{\sum \text{scores}}{N} \times 10\right)}{10}$$
2. **Tasa de Aprobación (`passRate`):** Porcentaje de ejercicios con calificación aprobatoria ($\ge 3$):
   $$\text{passRate} = \frac{|\{s \in \text{scores} : s \ge 3\}|}{N}$$

### 4.2 Condiciones Exactas para Subir de Dificultad (1 a 3)

La progresión de dificultad no es aleatoria ni depende de corazonadas; para que asciendas de nivel dentro de una pista (ej. de dificultad 1 a 2, o de 2 a 3), debes satisfacer **tres condiciones simultáneas**:

1. **No estar en el nivel máximo:** $\text{dificultad actual} < 3$. Si ya te encuentras en dificultad 3, has alcanzado el tope adaptativo de esa categoría.
2. **Puntaje promedio sobresaliente:** $\text{roundScore} \ge 4.0$ (al menos 4.0 puntos sobre 5.0).
3. **Consistencia en la ronda:** $\text{passRate} \ge 0.8$ (al menos el 80% de los ejercicios de la ronda deben estar aprobados con $\ge 3$).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CONDICIÓN DE PROMOCIÓN ESTRICTA                      │
├────────────────────────────────────────────────────────────────────────┤
│  ¿dificultad < 3  Y  roundScore >= 4.0  Y  passRate >= 0.8?            │
│       │                                                                │
│       ├── SÍ ──► ¡PROMOVIDO! (Dificultad + 1)                          │
│       │          Próximo repaso en 3 días (repaso rápido)              │
│       │                                                                │
│       └── NO ──► Se mantiene dificultad actual                         │
│                  Ajuste de intervalo según desempeño SM-2              │
└────────────────────────────────────────────────────────────────────────┘
```

#### Ejemplos de Casos Límite:
- **`[5, 5, 5, 5, 0]`:** Promedio $4.0$ y $4/5 = 80\%$ aprobados $\implies$ **Promovido** a la siguiente dificultad.
- **`[4, 4, 4, 4, 3.5]`:** Promedio $3.9$ y $100\%$ aprobados $\implies$ **No promovido** (no alcanza el promedio de 4.0).
- **`[5, 5, 5, 2]`:** Promedio $4.3$ pero sólo $3/4 = 75\%$ aprobados $\implies$ **No promovido** (requiere $\ge 80\%$ de aprobación).
- **Dificultad 3 con `[5, 5, 5, 5]`:** Promedio $5.0$ y $100\%$ aprobados $\implies$ **Permanece en Dificultad 3** (nivel de maestría consolidado).

### 4.3 Garantía de No-Degradación

MathCoach Sparring respeta el principio pedagógico de **no-degradación de dificultad**:
- Tu nivel de dificultad alcanzado (**1, 2 o 3**) **nunca retrocede**, incluso ante rondas con bajas calificaciones o tropiezos severos (puntuaciones de 0 o 1).
- La penalización por un mal desempeño se canaliza exclusivamente en el **calendario de repasos espaciados (SM-2)**: el sistema te programa un repaso correctivo al día siguiente para recuperar fluidez en los conceptos clave, pero no te hace perder el nivel de desafío conquistado.

### 4.4 Impacto en el Calendario de Repasos Espaciados (SRS SM-2)

El resultado de tu ronda modula directamente tu cola de estudio en función de cuatro escenarios pedagógicos:

| Resultado de la Ronda | Condición Técnica | Impacto en Dificultad | Impacto en Calendario SRS (SM-2) | Justificación para el Estudiante |
|---|---|---|---|---|
| **Fallo** | `roundScore < 3.0` | Se mantiene (sin degradación) | **Reinicio SM-2:** `repetition = 0`, intervalo fijado en **1 día** (`dueDate = mañana`). Se reduce el factor de facilidad (`efactor`). | Requiere repaso correctivo inmediato para subsanar dudas conceptuales antes de acumular lagunas. |
| **Aprobada sin Promoción** | `roundScore >= 3.0` y no cumple promoción | Se mantiene | **SM-2 Estándar:** Progresión habitual (1 día $\to$ 3 o 6 días $\to$ 15+ días según fluidez y factor de facilidad). | Continuas ejercitando el mismo nivel, consolidando retención con intervalos progresivamente más amplios. |
| **Promoción Exitosa** | Cumple los 3 requisitos de ascenso | **Asciende a nivel superior:** `dificultad = dificultad + 1` | **Repaso rápido:** `repetition = 1`, intervalo fijado en **3 días** (`dueDate = hoy + 3 días`). Se premia tu factor de facilidad (`efactor`). | El material de nivel superior es nuevo y más desafiante; un repaso a los 3 días asegura que fijes las bases antes de distanciar las sesiones. |
| **Dificultad 3 con Alto Rendimiento** | Dificultad en tope (3) con `roundScore >= 4.0` | Se mantiene en 3 (tope) | **SM-2 Estándar de Maestría:** Intervalos exponenciales largos (6, 15, 30+ días). | Dominas los problemas más avanzados de la categoría; el sistema afianza tu retención a largo plazo. |

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

## 7. Módulo de Entrenamiento en Cuaderno Físico y Evaluación de Rondas (`RoundSession`)

El módulo de entrenamiento (**pestaña "Entrenar"**) permite ejercitar el razonamiento matemático sobre papel y libreta física, resolviendo sesiones de práctica completas sin interrupciones digitales.

### 7.1 El Flujo de Trabajo en Libreta Física (Ronda Completa)

A diferencia de los flujos legados de un único problema aislado, una ronda de MathCoach Sparring representa un bloque inmutable de práctica deliberada equivalente a ~15 minutos de tiempo experto:

1. **Inicio de Sesión desde la Pestaña "Entrenar":**
   - Al pulsar la pestaña **"Entrenar"** (o hacer clic en *"Entrenar"* desde una tarjeta del Panel), la interfaz contacta de forma transparente con el backend (`POST /api/rounds`) enviando el `{ topicId, category }`.
   - Si existía una ronda en estado pendiente para esa pista, se recupera exactamente la misma ronda (idempotencia); si no, se ensambla una nueva con ejercicios rotados.
2. **Encabezado Informativo (`#round-header`) y Cronómetro de Referencia (`#round-timer`):**
   - El encabezado destaca el título del tema, la categoría traducida al español (*Técnica*, *Aplicación*, *Demostración*), la dificultad activa (1, 2 o 3) y la leyenda de tiempo de referencia (*"Un experto lo resuelve en ~15 min"*).
   - Incluye un **cronómetro informativo no punitivo** en formato `MM:SS`. Este cronómetro **no bloquea la pantalla, no impone límite de tiempo estricto ni genera penalizaciones**; su propósito es ofrecerte visibilidad sobre tu ritmo real de resolución.
3. **Revisión de Enunciados con Fórmulas KaTeX (`#round-exercise-<order>`):**
   - La plataforma presenta todos los ejercicios de la ronda ordenados didácticamente (`1..N`) con tipografía matemática rigurosa en LaTeX / KaTeX mediante el componente `MathStatement`.
   - Cada ejercicio indica su número de orden (#1, #2...), su tiempo experto aproximado y el enunciado formal.
4. **Resolución Continua en Cuaderno:**
   - Trabajas directamente sobre tu libreta de papel con pluma o lápiz, resolviendo la ronda completa de principio a fin sin tocar la computadora o el teléfono.
   - Es altamente recomendable rotular claramente en tu libreta el número de cada ejercicio (ej. *"Ejercicio 1"*, *"Ejercicio 2"*) para facilitar la lectura visual por parte de la IA.
   - Tus soluciones pueden ocupar entre 1 y 6 páginas según la extensión de tus desarrollos.

### 7.2 Captura Fotográfica Multimodal (1 a 6 Fotografías)

Al terminar de escribir tus soluciones en papel:
1. Pulsa el botón principal **"Ya terminé, capturar"** (`#btn-finish-round`).
2. Se desplegará el panel de captura multimodal (`RoundPhotoCapture`), que soporta dos modos complementarios:
   - **Cámara Directa (WebRTC):** Haz clic en *"Activar Cámara"* para abrir el visor con guías de encuadre escáner. Puedes alternar entre cámara frontal y trasera en dispositivos móviles y capturar cada página con el botón *"📸 Tomar Foto"*.
   - **Subida de Archivos:** Haz clic en *"Subir fotos de archivo"* para seleccionar una o múltiples imágenes (`.jpg`, `.png`, `.heic`) guardadas en tu dispositivo.
3. **Galería de Miniaturas (`#photo-capture-gallery`):**
   - Visualiza en tiempo real las páginas agregadas con su contador (*"X de 6 fotos agregadas"*).
   - Puedes eliminar cualquier fotografía individual que haya salido borrosa con el botón de papelera y agregar nuevas hojas con el botón *"Añadir foto"*.
4. **Envío Seguro:** El botón **"Enviar a evaluar"** (`#btn-submit-round`) permanece deshabilitado si no hay fotos (0 fotos) o si se excede el límite permitido (>6 fotos). Con entre 1 y 6 imágenes, se activa para iniciar la auditoría con IA.

### 7.3 Evaluación Pedagógica con Inteligencia Artificial

Gemini 1.5 Pro analiza concurrentemente todas las fotografías provistas y audita cada ejercicio contra la solución canónica de referencia y la rúbrica especializada de la categoría:

- **Calificación Individual por Ejercicio (Escala 0 a 5):**
  - **`5` (Excelente):** Planteamiento riguroso, desarrollo algebraico o deductivo impecable y conclusión correcta.
  - **`4` (Bueno):** Planteamiento y técnica correctos con pequeños detalles menores de aritmética o formato en los pasos finales.
  - **`3` (Aprobado):** Comprensión del concepto central pero con errores intermedios subsanables.
  - **`0 a 2` (Fallo):** Error conceptual severo, infracciones de reglas algebraicas o desarrollo no justificado.
- **Retroalimentación Detallada Paso a Paso:**
  - Desglose minucioso de cada renglón de tu cuaderno, reconociendo tus aciertos e identificando con precisión quirúrgica el paso exacto donde ocurrió un error.
- **Pistas Socráticas (`💡 Pista Metodológica`):**
  - Recomendaciones metodológicas o preguntas guía para que reflexiones sobre tus áreas de mejora en el siguiente intento sin que se te revele la respuesta final.
- **Resumen Global de la Ronda (`overall_feedback`):**
  - Una síntesis pedagógica del desempeño general del bloque y recomendaciones para afianzar el dominio de la categoría.

### 7.4 ¿Qué hacer si la aplicación indica que falta algún ejercicio? (Recuperación ante Error HTTP 422: `exercises_not_found`)

Si alguna hoja de tu libreta quedó fuera del encuadre, la foto salió borrosa, o algún problema no fue resuelto en las páginas enviadas:

- **Alerta de Ejercicios Faltantes (`#alert-missing-exercises`):** La aplicación te notificará claramente en color ámbar:
  > *"La IA no encontró el procedimiento de los siguientes ejercicios: #2, #4. Tus fotos anteriores siguen guardadas. Por favor agrega una foto más clara o la hoja donde resolviste esos problemas y vuelve a presionar 'Enviar a evaluar'"*.
- **Protección de tu Progreso y Conservación de Fotos:**
  - **Tu ronda no se califica con ceros ficticios ni se altera tu progreso en la base de datos.** La ronda se mantiene en estado pendiente (`pending`) y tus intervalos de repetición espaciada permanecen intactos.
  - **Las fotos que ya capturaste NO se borran.** Se mantienen visibles en la galería de miniaturas para que no tengas que fotografiar toda tu libreta de nuevo.
- **Pasos para Continuar:**
  1. Revisa las páginas de tu cuaderno correspondientes a los ejercicios señalados en la alerta.
  2. Pulsa *"Tomar otra foto con cámara"* o *"Subir fotos de archivo"* para anexar la página faltante (hasta el límite de 6 fotos).
  3. Pulsa nuevamente **"Enviar a evaluar"** (`#btn-submit-round`) para reanudar la evaluación completa.

### 7.5 Panel de Resultados, Progresión Adaptativa y Calendario SRS (`RoundResults`)

Al culminar con éxito la evaluación, se renderiza la pantalla integral de balance pedagógico (`#round-results`):

1. **Score Global y Tasa de Aprobación:**
   - Despliega el promedio ponderado de la ronda (`roundScore` de 0.0 a 5.0) y el porcentaje de ejercicios superados con $\ge 3$ puntos (`passRate`).
2. **Dictamen de Progresión Adaptativa (`#round-progression`):**
   - **Ascenso de Nivel:** Si lograste `roundScore ≥ 4.0` y `passRate ≥ 80%` en dificultad 1 o 2, verás el mensaje destacado:
     > *"¡Felicidades! Subes a dificultad 2 en Técnica para el próximo repaso"*.
     El motor programará tu próxima sesión para dentro de **3 días**.
   - **Permanencia en el Nivel:** Si no alcanzaste la cuota de excelencia o ya te encuentras en dificultad 3, verás el mensaje:
     > *"Te mantienes en dificultad 1 en Técnica"*.
     El motor recalcula tu intervalo SRS normal (o 1 día correctivo si obtuviste $< 3.0$) sin jamás degradar tu nivel adquirido.
   - **Fecha del Próximo Repaso SRS:** Visualización clara de la fecha agendada para volver a practicar esta pista (`nextReviewAt`).
3. **Auditoría Individual por Ejercicio (`#round-exercise-result-<order>`):**
   - Cada ejercicio muestra su badge de puntaje (*Aprobado*, *En Progreso*, *Revisar Conceptos*), el desglose paso a paso de la deducción manuscrita y la pista metodológica.
4. **Navegación:**
   - Botón *"Volver al Panel"* para regresar al panel principal de estudio.
   - Botón *"Iniciar Nueva Práctica"* para comenzar de inmediato otra sesión de entrenamiento.


