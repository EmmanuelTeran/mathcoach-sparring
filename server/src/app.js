import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { topicsRouter } from './routes/topics.js';
import { dashboardRouter } from './routes/dashboard.js';
import { roundsRouter } from './routes/rounds.js';

/**
 * Límite del body JSON.
 * El default de express.json() es 100kb, insuficiente para POST /api/rounds/:id/evaluate,
 * que recibe de 1 a 6 fotos de libreta en Base64 (~33% más pesadas que el binario).
 * El cliente comprime cada foto (~0.3–0.8 MB), así que 25mb deja holgura amplia.
 */
export const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '25mb';

export const app = express();

app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.use('/api', healthRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/rounds', roundsRouter);

// Manejo explícito de errores del body-parser (payload excesivo / JSON malformado)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: `Las fotos pesan demasiado (máximo ${JSON_BODY_LIMIT} en total). Intenta con menos fotos o de menor resolución.`,
    });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  console.error('Unhandled server error:', err);
  return res.status(err?.status || 500).json({ error: err?.message || 'Internal server error' });
});
