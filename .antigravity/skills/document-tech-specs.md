# Skill: document-tech-specs

## Propósito

Generar documentación técnica exhaustiva en `docs/ARCHITECTURE.md` usando Graphify y diagramas Mermaid.

## Pasos de Ejecución

1. Leer `graphify-out/GRAPH_REPORT.md` y `graphify-out/graph.json` recién generados.
2. Generar/Actualizar en `docs/ARCHITECTURE.md`:
   - **Contratos de API:** Endpoints creados/modificados, Request/Response payloads y códigos HTTP.
   - **Modelos de Datos:** Schemas de Mongoose y relaciones.
   - **Diagramas de Flujo / Arquitectura:** Crear diagramas Mermaid (`sequenceDiagram` o `graph TD`) que muestren cómo fluyen los datos (ej. Audio -> Web Speech -> API -> Gemini -> Mongoose -> SRS Engine).
3. Hacer commit en `dev`: `git commit -am "docs(architecture): update technical specs and mermaid diagrams for US-XX"`.
