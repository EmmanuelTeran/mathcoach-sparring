# Skill: verify-user-story

## Propósito

Ejecutar la batería completa de pruebas (Unitarias, Integración y E2E Playwright), registrar evidencia en el ticket y mergear a `dev`.

## Pasos de Ejecución

1. **Ejecutar Batería de Pruebas:**
   - Correr pruebas de backend y frontend: `npm run test`.
   - Correr pruebas E2E con Playwright: `npx playwright test`.
2. **Validación:**
   - Si alguna prueba falla, abortar el cierre y corregir en la misma rama.
   - Si todas pasan, capturar el resumen de ejecución en consola.
3. **Registro de Evidencia:**
   - Escribir los logs y métricas de los tests en la Sección 4 de `tickets/US-XX-<slug>.md`.
   - Cambiar el estado del ticket a `Verificado`.
4. **Merge a rama `dev`:**
   - `git checkout dev`
   - `git merge --no-ff feature/US-XX-<slug> -m "feat(US-XX): resolve acceptance criteria and tests"`
   - Registrar el hash del commit en el ticket y marcar estado como `Done`.
5. **Actualizar el Pulso:**
   - Marcar el ticket en `.antigravity/heartbeat.md` como `[x]`.
   - El hook de Graphify se ejecutará automáticamente en el commit del merge, actualizando `graphify-out/`.
