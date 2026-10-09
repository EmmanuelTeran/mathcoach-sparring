import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Variable compartida para inspeccionar llamadas y systemInstruction enviados a Gemini
export const geminiCallHistory = [];

export const mockGenerateContent = vi.fn().mockImplementation(async ({ model, contents, config }) => {
  geminiCallHistory.push({ model, contents, config });

  // Pipeline multimodal matemático:
  if (
    model === 'gemini-1.5-pro' ||
    (config?.systemInstruction &&
      (config.systemInstruction.includes('Profesor de Matemáticas') ||
        config.systemInstruction.includes('Catedrático')))
  ) {
    return {
      text: JSON.stringify({
        score: 4,
        feedback_paso_a_paso: 'Paso 1: Planteamiento correcto. Paso 2: Error menor en simplificación de signos.',
        hint: 'Recuerda que (a - b) = -(b - a) antes de simplificar.',
      }),
    };
  }

  return {
    text: JSON.stringify({
      score: 3,
      feedback_paso_a_paso: 'Procedimiento evaluado.',
      hint: 'Revisar pasos.',
    }),
  };
});

// Mockeamos @google/genai usando vi.mock para ejecución offline determinista
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic } from '../src/models/MathTopic.js';

describe('Practice API Integration Tests (/api/evaluate-math)', () => {
  let mongoServer;

  beforeAll(async () => {
    process.env.GEMINI_API_KEY = 'mock-test-key';
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);
  });

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    geminiCallHistory.length = 0;
    await MathTopic.deleteMany({});
  });

  describe('POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2)', () => {
    it('AC-1: retorna 400 Bad Request si falta problemId o está vacío', async () => {
      const res = await request(app)
        .post('/api/evaluate-math')
        .send({ image: 'data:image/jpeg;base64,validbase64string' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('problemId is required');
    });

    it('AC-1: retorna 400 Bad Request si falta image o está vacía', async () => {
      const res = await request(app)
        .post('/api/evaluate-math')
        .send({ problemId: new mongoose.Types.ObjectId().toString(), image: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('image must be a valid base64 string');
    });

    it('AC-1: retorna 404 Not Found si el problemId no existe en MathTopic', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: nonExistentId,
          image: 'data:image/jpeg;base64,mockImageBase64Payload',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Math problem not found');
    });

    it('AC-1: retorna 404 Not Found si el problemId no es un ObjectId válido', async () => {
      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: 'invalid-id-format',
          image: 'data:image/jpeg;base64,mockImageBase64Payload',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Math problem not found');
    });

    it('evalúa con éxito ejercicio Nivel 1 (CONAMAT), usa gemini-1.5-pro y responde SRS', async () => {
      const mathProblem = await MathTopic.create({
        slug: 'factorizacion-polinomios',
        title: 'Factorización de Polinomios',
        area: 'algebra',
        source: 'CONAMAT',
      });

      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: mathProblem._id.toString(),
          image: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          metadata: {
            level: 1,
            source: 'CONAMAT',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.score).toBe(4);
      expect(res.body.feedback_paso_a_paso).toContain('Planteamiento correcto');
      expect(res.body.hint).toContain('Recuerda que (a - b)');
      expect(res.body.srs).toBeDefined();
      expect(res.body.srs.repetition).toBe(1);
      expect(res.body.srs.interval).toBe(1);
      expect(res.body.srs.efactor).toBeGreaterThanOrEqual(1.3);
      expect(res.body.srs.dueDate).toBeDefined();

      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      expect(lastCall.model).toBe('gemini-1.5-pro');
      expect(lastCall.config.systemInstruction).toContain('Nivel 1 - Computacional / Mecánico');
      expect(lastCall.config.responseMimeType).toBe('application/json');
    });

    it('evalúa con prompt de Rigor Formal y Demostraciones en Nivel 3 (Spivak)', async () => {
      const spivakProblem = await MathTopic.create({
        slug: 'limites-epsilon-delta',
        title: 'Demostración Épsilon-Delta',
        area: 'calculo',
        source: 'Spivak',
      });

      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: spivakProblem._id.toString(),
          image: 'mockSpivakBase64Photo',
          metadata: {
            level: 3,
            source: 'Spivak',
          },
        });

      expect(res.status).toBe(200);
      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      expect(lastCall.config.systemInstruction).toContain('Nivel 3 - Spivak / Rigor Axiomático');
    });

    it('maneja fallo de la API de Gemini retornando 502 Bad Gateway sin crashear', async () => {
      const problem = await MathTopic.create({
        slug: 'red-error-topic',
        title: 'Problema con error de red',
        area: 'algebra',
        source: 'CONAMAT',
      });

      mockGenerateContent.mockRejectedValueOnce(new Error('Quota exceeded or network timeout'));

      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: problem._id.toString(),
          image: 'validMockBase64',
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe('AI evaluation service unavailable');
      expect(res.body.details).toContain('Quota exceeded');
    });
  });
});
