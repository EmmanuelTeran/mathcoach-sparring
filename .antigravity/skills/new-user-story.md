# Skill: new-user-story

## Propósito

Inicializar formalmente un ticket de trabajo similar a Jira, validar dependencias y preparar la rama Git.

## Pasos de Ejecución

1. Leer `.antigravity/graph.md` para extraer la especificación completa del ticket solicitado.
2. Comprobar que las historias predecesoras estén marcadas como completadas en `.antigravity/heartbeat.md`.
3. Crear el archivo del ticket en `tickets/US-XX-<slug>.md` usando la plantilla `tickets/templates/ticket-template.md`.
4. Ejecutar `git checkout dev && git pull && git checkout -b feature/US-XX-<slug>`.
5. Actualizar `.antigravity/heartbeat.md`:
   - `Historia activa`: `US-XX`
   - `Rama actual`: `feature/US-XX-<slug>`
   - Estado del ticket en `tickets/US-XX-<slug>.md`: `En Progreso`.
6. Reportar al usuario los Criterios de Aceptación y esperar confirmación para implementar.
