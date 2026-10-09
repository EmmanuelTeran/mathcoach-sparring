# Skill: document-user-guide

## Propósito

Mantener `docs/USER_GUIDE.md` con manuales prácticos directos al grano para entrenar sin fricción.

## Pasos de Ejecución

1. Leer `tickets/US-XX-<slug>.md` para entender qué función se entregó.
2. Actualizar o agregar la sección en `docs/USER_GUIDE.md`:
   - **Módulo / Entrenamiento:** Nombre claro del ejercicio.
   - **Cómo iniciar el entrenamiento:** Dónde dar clic o qué comando correr.
   - **Interacción esperada:** Qué te preguntará la IA, cómo responder por micrófono o teclado.
   - **Qué evalúa el sistema:** Métricas del algoritmo SRS y criterios de feedback técnico.
3. Hacer commit en `dev`: `git commit -am "docs(guide): update user guide for US-XX"`.
