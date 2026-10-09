# [MATH-US-03] UI de Cero Fricción para Active Recall (MathVisionUploader.jsx)

- **Estado:** En Progreso
- **Rama:** `feature/MATH-US-03-vision-uploader`
- **Fecha de Inicio:** 2026-10-09
- **Fecha de Cierre:** -

## 1. Descripción

Construir el componente React `client/src/components/MathVisionUploader.jsx` para proporcionar una interfaz de captura visual de cero fricción para la práctica de Active Recall en **MathCoach Sparring**.

El estudiante resuelve problemas matemáticos a mano en su cuaderno físico (con lápiz o pluma). Mediante este componente, el usuario activa la cámara de su dispositivo (webcam o cámara trasera de smartphone mediante WebRTC), encuadra el desarrollo manuscrito con la ayuda de guías visuales en pantalla, captura el fotograma en un `<canvas>` HTML5 optimizado, y lo convierte a formato Base64 (`image/jpeg`) para enviarlo al backend evaluador con Gemini 1.5 Pro.

La interfaz debe gestionar de forma robusta los permisos del navegador, transicionar fluidamente entre sus estados operativos y proveer mecanismos de degradación elegante (fallback para subida manual de imagen si la cámara no está disponible o el usuario revoca permisos).

---

## 2. Criterios de Aceptación (AC)

### AC-1: Inicialización y Gestión Defensiva de Permisos WebRTC
- [ ] **Activación Bajo Demanda:** Al montar el componente en su estado inicial (`IDLE` / `"Activar Cámara"`), la cámara permanece apagada para respetar la privacidad del usuario y evitar consumo de batería.
- [ ] **Solicitud de Permisos:** Al hacer clic en el botón primario `"Activar Cámara"`, invocar `navigator.mediaDevices.getUserMedia` con constraints configurados:
  ```javascript
  {
    video: {
      facingMode: { ideal: 'environment' }, // Prioriza cámara trasera en móviles
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  }
  ```
- [ ] **Manejo de Permisos Denegados:** Si el usuario rechaza la solicitud (`NotAllowedError` o `PermissionDeniedError`):
  - Renderizar un mensaje de aviso claro y constructivo: *"Acceso a la cámara bloqueado. Puedes permitirlo en los ajustes del navegador o subir una foto directamente."*
  - Mostrar automáticamente un botón accesible de fallback con `<input type="file" accept="image/*" capture="environment">`.
- [ ] **Dispositivo No Encontrado o No Soportado:** Ante `NotFoundError` o falta de soporte nativo (`!navigator.mediaDevices?.getUserMedia`), renderizar estado de advertencia y habilitar el input de archivo.
- [ ] **Liberación de Recursos (Cleanup):** Al desmontar el componente (`useEffect` cleanup) o al cancelar la captura, detener explícitamente todos los tracks del stream (`stream.getTracks().forEach(track => track.stop())`) para garantizar que el indicador LED de la cámara se apague.

### AC-2: Estado "Capturar Ejercicio" (Stream en Vivo y Guías de Encuadre)
- [ ] **Reproducción Fluida del Stream:** Vincular el `MediaStream` a un elemento `<video>` con atributos obligatorios `autoPlay`, `playsInline`, `muted` para asegurar reproducción instantánea sin bloqueos de autoplay en navegadores móviles (iOS Safari / Chrome Android).
- [ ] **Overlay de Encuadre para Cuaderno:** Renderizar sobre el video un visor semitransparente con esquinas resaltadas (estilo escáner de documentos) y retícula sutil que oriente al estudiante sobre dónde colocar la hoja de papel.
- [ ] **Consejos de Captura:** Mostrar una sugerencia visual sutil en la parte inferior del visor: *"Asegúrate de contar con buena iluminación y que el procedimiento sea legible"*.
- [ ] **Controles Operativos en Vivo:**
  - Botón principal de acción: `"📸 Tomar Foto / Capturar"`.
  - Botón de alternancia de cámara: Si el dispositivo cuenta con múltiples cámaras (`enumerateDevices`), permitir conmutar entre cámara trasera (`environment`) y frontal (`user`).
  - Botón secundario `"Cerrar Cámara"`, que detiene el stream y vuelve al estado `IDLE`.

### AC-3: Congelado de Fotograma, Canvas y Conversión Base64
- [ ] **Proyección a `<canvas>` en Resolución Nativa:** Al presionar `"Capturar"`, transferir el fotograma actual del `<video>` a un elemento `<canvas>` invisible sincronizando sus dimensiones con `video.videoWidth` y `video.videoHeight`.
- [ ] **Exportación JPEG Base64:** Extraer la imagen mediante `canvas.toDataURL('image/jpeg', 0.85)` para equilibrar compresión, tamaño de payload y legibilidad de trazos manuscritos.
- [ ] **Detención Inmediata del Stream:** Inmediatamente tras la captura, detener los tracks del video stream para ahorrar energía y congelar la imagen en el preview.
- [ ] **Estado de Previsualización ("Confirmar Captura"):** Mostrar la imagen congelada al usuario con dos acciones:
  - `"🔄 Repetir Foto"`: Reinicia el stream de video y regresa al estado en vivo.
  - `"🚀 Evaluar con IA"`: Dispara la petición POST al backend y transiciona a `"Analizando con IA..."`.

### AC-4: Estado "Analizando con IA..." (Feedback Inmersivo)
- [ ] **Bloqueo de Interacción:** Deshabilitar los botones de acción para prevenir peticiones duplicadas durante el análisis.
- [ ] **Efecto Visual de Escaneo:** Mostrar una animación de pulso/escáner superpuesta a la foto congelada con indicador spinner y estado de carga claro: *"El profesor de IA está evaluando tus deducciones matemáticas..."*.
- [ ] **Gestión de Timeout:** Configurar un `AbortController` con límite de 35 segundos. Si la petición excede el tiempo, mostrar opción de reintento sin perder la imagen capturada.

### AC-5: Contrato de Comunicación POST al Backend
- [ ] **Ruta y Headers:**
  - **Método:** `POST`
  - **URL:** `/api/evaluate-math`
  - **Headers:** `{ "Content-Type": "application/json" }`
- [ ] **Estructura del Payload de Envío (Request Body):**
  ```json
  {
    "problemId": "651a2b3c4d5e6f7a8b9c0d1e",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
    "metadata": {
      "level": 1,
      "source": "CONAMAT",
      "capturedAt": "2026-10-09T07:15:00.000Z"
    }
  }
  ```
- [ ] **Estructura Esperada de la Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "score": 4,
    "feedback_paso_a_paso": "Paso 1: Planteamiento y factorización correctos. Paso 2: Error menor en simplificación de signos en el denominador.",
    "hint": "Recuerda que (a - b) = -(b - a) antes de cancelar factores comunes.",
    "srs": {
      "repetition": 2,
      "interval": 6,
      "efactor": 2.6,
      "dueDate": "2026-10-15T07:15:00.000Z"
    }
  }
  ```
- [ ] **Manejo de Errores HTTP y de Red:** Si el backend responde con código 4xx o 5xx, mostrar un mensaje de error legible con botón `"Reintentar Envío"` manteniendo la imagen en memoria.

### AC-6: Visualización de Resultados Pedagógicos y Actualización SRS
- [ ] **Badge Dinámico de Puntaje (0 a 5):**
  - `0 - 1`: Rojo (`bg-rose-500/20 text-rose-400 border-rose-500/30`) - Error conceptual / Fallo total.
  - `2 - 3`: Ámbar (`bg-amber-500/20 text-amber-400 border-amber-500/30`) - Procedimiento en progreso con fallos algebraicos.
  - `4 - 5`: Esmeralda (`bg-emerald-500/20 text-emerald-400 border-emerald-500/30`) - Resolución sólida / Rigor matemático completo.
- [ ] **Desglose Paso a Paso:** Renderizar `feedback_paso_a_paso` formateado con alta legibilidad.
- [ ] **Pista Socrática (`hint`):** Tarjeta destacada con icono de bombilla (`💡`) para facilitar el modelo mental del siguiente intento.
- [ ] **Tarjeta SRS:** Mostrar intervalo calculado (ej. *"Reprogramado para repaso en 6 días"*).
- [ ] **Acciones Finales:** Botón `"Siguiente Ejercicio"` o `"Practicar Otro Problema"` para reiniciar el uploader.

### AC-7: Arquitectura del Componente y Buenas Prácticas
- [ ] Componente ubicado en `client/src/components/MathVisionUploader.jsx`.
- [ ] Props defensivas: `{ topic, onEvaluationComplete, onCancel }`.
- [ ] Cero dependencias externas pesadas (WebRTC nativo, Canvas nativo, Lucide Icons, Tailwind CSS).
- [ ] Integración en `client/src/App.jsx` reemplazando los componentes legados.

### AC-8: Harness de Pruebas Automatizadas
- [ ] **Pruebas Unitarias Frontend (Vitest):** `client/tests/MathVisionUploader.test.jsx` con mocks de `navigator.mediaDevices.getUserMedia` verificando los estados: Activar Cámara -> Capturar -> Analizando -> Resultados.
- [ ] **Prueba E2E (Playwright):** `tests/e2e/math-vision.spec.js` verificando renderizado inicial, botón de cámara y disponibilidad de fallback de subida de archivo.

---

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `MathVisionUploader()`, `App()`, `practiceRouter`, `MathTopic`, `srsCalculator`
- **Archivos a intervenir:**
  - `client/src/components/MathVisionUploader.jsx` (Creación de nuevo componente)
  - `client/src/App.jsx` (Sustitución de tabs legadas e integración de MathVisionUploader)
  - `client/tests/MathVisionUploader.test.jsx` (Tests unitarios con Vitest)
  - `tests/e2e/math-vision.spec.js` (Test E2E de interfaz y flujo de captura)
  - `server/src/routes/practice.js` (Alineación de contrato para Tarea 4)

---

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

`<!-- PENDIENTE: Ejecución de vitest tras implementación de la historia -->`

### Tests E2E (Playwright)

`<!-- PENDIENTE: Ejecución de playwright tras implementación de la historia -->`

---

## 5. Commit de Cierre en dev

`<!-- PENDIENTE: Commit generado tras verificación -->`
