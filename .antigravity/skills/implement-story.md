# Skill: implement-story

## Propósito

Escribir la solución técnica aplicando TDD y respetando el modo estricto de Graphify y mattpocock/skills.

## Pasos de Ejecución

1. **Consulta Estricta a Graphify:**
   - Inspeccionar `graphify-out/graph.json` y `graphify-out/GRAPH_REPORT.md`.
   - Identificar los módulos y nodos que interactúan con la nueva funcionalidad.
   - Registrar la lista de archivos afectados en la sección 3 del archivo `tickets/US-XX-<slug>.md`.
2. **Ciclo TDD (mattpocock pattern):**
   - Escribir primero las pruebas unitarias e integración que cubran los AC en `server/tests/` o `client/tests/`.
   - Ejecutar la prueba y verificar que falle por la razón esperada.
3. **Implementación de Código:**
   - Escribir el código mínimo necesario para hacer pasar los tests.
   - Si la historia toca frontend, añadir pruebas de interacción con `@testing-library/react`.
   - Si la historia es de flujo de usuario, añadir o actualizar el escenario en `tests/e2e/<modulo>.spec.js`.
4. Mantener commits atómicos en la rama con prefijos semánticos (`feat:`, `fix:`, `test:`).
