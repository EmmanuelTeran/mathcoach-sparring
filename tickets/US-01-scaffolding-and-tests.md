# [US-01] Scaffolding, Base Monorepo y Harness de Tests (Vitest + Playwright)

- **Estado:** Done
- **Rama:** `feature/US-01-scaffolding-and-tests`
- **Fecha de Inicio:** 2026-09-30
- **Fecha de Cierre:** 2026-09-30

## 1. Descripción

Configurar el scaffolding base del monorepo con `/server` (Node.js, Express, Mongoose, Vitest, Supertest, endpoint de healthcheck con Mongo) y `/client` (Vite, React, Tailwind CSS), la suite de Playwright en `/tests/e2e/smoke.spec.js` para validar la carga del frontend en local, y los scripts concurrentes en el `package.json` raíz (`npm run dev`, `npm test`, `npm run test:e2e`).

## 2. Criterios de Aceptación (AC)

- [x] AC-1: Monorepo configurado con `/client` (Vite, React, Tailwind) y `/server` (Express, Mongoose).
- [x] AC-2: Playwright configurado en `/tests/e2e/smoke.spec.js` validando que la app carga en puerto 5173.
- [x] AC-3: Vitest y Supertest configurados en el server con prueba de salud `/api/health` conectada a MongoDB.
- [x] AC-4: Script raíz `npm test` corre unit tests y `npm run test:e2e` corre Playwright.

## 3. Subgrafo Afectado (Identificado con Graphify)

- **Nodos:** `server`, `client`, `tests/e2e`, `package.json`
- **Archivos a intervenir:**
  - `package.json`
  - `.gitignore`
  - `server/package.json`
  - `server/src/app.js`
  - `server/src/server.js`
  - `server/src/db.js`
  - `server/src/routes/health.js`
  - `server/tests/health.test.js`
  - `client/package.json`
  - `client/vite.config.js`
  - `client/tailwind.config.js`
  - `client/postcss.config.js`
  - `client/index.html`
  - `client/src/index.css`
  - `client/src/App.jsx`
  - `client/src/main.jsx`
  - `playwright.config.js`
  - `tests/e2e/smoke.spec.js`

## 4. Evidencia de Pruebas (Completado por verify-user-story)

### Tests Unitarios e Integración (Vitest / Supertest)

```bash
> devcoach-sparring@1.0.0 test
> npm run test:server

> server@1.0.0 test
> vitest run

 RUN  v3.2.7 /home/teran/proyectos/devcoach-sparring/server

 ✓ tests/health.test.js (1 test) 809ms
   ✓ Healthcheck API > GET /api/health returns 200 with status ok and mongo connected 21ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  1.65s
```

### Tests E2E (Playwright)

```bash
> devcoach-sparring@1.0.0 test:e2e
> playwright test

Running 1 test using 1 worker

  ✓  1 [chromium] › tests/e2e/smoke.spec.js:4:3 › Smoke Test - Frontend & Health › frontend loads properly and shows header (1.5s)

  1 passed (4.4s)
```

## 5. Commit de Cierre en dev

`21fe112293ce2a3237f181f3c60106bcb316d831`
