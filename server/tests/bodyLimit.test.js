import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

/**
 * Regresión: express.json() por defecto limita el body a 100kb, lo que provocaba
 * PayloadTooLargeError (413) al enviar fotos de libreta a POST /api/rounds/:id/evaluate.
 */
describe('Límite del body JSON', () => {
  const fakeImage = (bytes) => `data:image/jpeg;base64,${'A'.repeat(bytes)}`;

  it('acepta payloads de varias fotos (~6 MB) sin devolver 413', async () => {
    const images = Array.from({ length: 6 }, () => fakeImage(1_000_000));
    // ID inválido => 400 tras parsear el body (sin tocar la BD); lo importante es que no sea 413
    const res = await request(app).post('/api/rounds/invalid-id/evaluate').send({ images });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid round ID');
  });

  it('responde 413 con mensaje JSON legible cuando se excede el límite', async () => {
    const images = [fakeImage(26 * 1024 * 1024)];
    const res = await request(app).post('/api/rounds/invalid-id/evaluate').send({ images });
    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/fotos pesan demasiado/i);
  });
});
