import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Variable compartida para inspeccionar llamadas y systemInstruction enviados a Gemini
export const geminiCallHistory = [];

// Mockeamos @google/genai usando vi.mock para ejecución offline determinista
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockImplementation(async ({ contents, config }) => {
          geminiCallHistory.push({ contents, config });

          // Si el systemInstruction pide evaluar y retornar JSON:
          if (config?.responseMimeType === 'application/json' || (config?.systemInstruction && config.systemInstruction.includes('Evaluador'))) {
            return {
              text: JSON.stringify({
                score: 5,
                feedback: 'Excelente dominio conceptual adaptado al nivel evaluado.',
                missingTradeoffs: ['Casos de borde menores'],
                strengths: ['Sintaxis limpia y comprensión de los fundamentos'],
              }),
            };
          }

          // En caso de generación de desafío:
          return {
            text: 'Desafío generado para ' + (contents || ''),
          };
        }),
      },
    })),
  };
});

import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { Topic } from '../src/models/Topic.js';
import { SessionLog } from '../src/models/SessionLog.js';

describe('Practice Hard Skills API Integration Tests', () => {
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
    await Topic.deleteMany({});
    await SessionLog.deleteMany({});
  });

  describe('POST /api/practice/hard-skill/generate', () => {
    it('retorna 400 si no se envía topicId', async () => {
      const res = await request(app).post('/api/practice/hard-skill/generate').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('topicId is required');
    });

    it('retorna 404 si el topicId no existe en la base de datos', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/practice/hard-skill/generate')
        .send({ topicId: randomId });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Topic not found');
    });

    it('genera un desafío técnico adaptado retornando status 200 y el texto del reto', async () => {
      const topic = await Topic.create({
        title: 'Node.js Event Loop & Concurrency',
        category: 'hard_skill',
        type: 'theory',
        level: 'senior',
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/generate')
        .send({ topicId: topic._id });

      expect(res.status).toBe(200);
      expect(res.body.topicId).toBe(topic._id.toString());
      expect(res.body.title).toBe(topic.title);
      expect(res.body.level).toBe('senior');
      expect(res.body.challenge).toBeDefined();
    });

    it('AC-1: en nivel Junior genera retos pedagógicos enfocados en sintaxis/bases y sin exigencias de Senior', async () => {
      const juniorTopic = await Topic.create({
        title: 'Métodos de Arrays en JS (map, filter, reduce)',
        category: 'hard_skill',
        type: 'theory',
        level: 'junior',
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/generate')
        .send({ topicId: juniorTopic._id });

      expect(res.status).toBe(200);
      expect(res.body.level).toBe('junior');

      // Validar las instrucciones del sistema enviadas a Gemini
      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('Fullstack Junior');
      expect(sysInstruction).toContain('bases cotidianas');
      expect(sysInstruction).toContain('NO hagas preguntas sobre bajo nivel, internals de V8, libuv, concurrencia masiva');
      expect(sysInstruction).not.toContain('entrevistador técnico implacable para roles Fullstack Senior');
    });

    it('AC-1: en nivel Senior genera retos con rigor de arquitectura interna y trade-offs', async () => {
      const seniorTopic = await Topic.create({
        title: 'Libuv Event Loop & Thread Pool Starvation',
        category: 'hard_skill',
        type: 'theory',
        level: 'senior',
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/generate')
        .send({ topicId: seniorTopic._id });

      expect(res.status).toBe(200);
      expect(res.body.level).toBe('senior');

      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('roles Fullstack Senior');
      expect(sysInstruction).toContain('arquitectura interna');
      expect(sysInstruction).toContain('análisis crítico de trade-offs');
    });
  });

  describe('POST /api/practice/hard-skill/evaluate', () => {
    it('retorna 400 si faltan topicId, challenge o userSolution', async () => {
      const res = await request(app)
        .post('/api/practice/hard-skill/evaluate')
        .send({ topicId: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('topicId, challenge, and userSolution are required');
    });

    it('retorna 404 si el topicId no existe', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/practice/hard-skill/evaluate')
        .send({
          topicId: randomId,
          challenge: 'Alguna pregunta',
          userSolution: 'Alguna solución',
        });
      expect(res.status).toBe(404);
    });

    it('AC-1: evalúa con éxito a un perfil Junior sin penalizar por falta de trade-offs de alta concurrencia', async () => {
      const topic = await Topic.create({
        title: 'Async/Await vs Callbacks y Manejo de Errores',
        category: 'hard_skill',
        type: 'theory',
        level: 'junior',
        srsStage: 0,
        easeFactor: 2.5,
        intervalDays: 0,
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/evaluate')
        .send({
          topicId: topic._id,
          challenge: 'Explica cómo usar try/catch con async/await para manejar errores.',
          userSolution: 'Usamos try/catch alrededor de la llamada con await para atrapar la promesa rechazada de forma legible.',
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(5);

      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('NIVEL JUNIOR');
      expect(sysInstruction).toContain('NO penalices por falta de análisis de arquitectura interna de bajo nivel');
      expect(sysInstruction).not.toContain('nivel Staff/Principal Engineer');
    });

    it('evalúa con éxito la solución, actualiza Topic en Mongo con srsCalculator y guarda SessionLog', async () => {
      const topic = await Topic.create({
        title: 'React Concurrent Mode & Fiber',
        category: 'hard_skill',
        type: 'practice',
        level: 'senior',
        srsStage: 0,
        easeFactor: 2.5,
        intervalDays: 0,
        nextReviewAt: new Date(Date.now() - 5000), // vencido
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/evaluate')
        .send({
          topicId: topic._id,
          challenge: 'Explica cómo Fiber interrumpe el rendering y maneja prioridades con useTransition.',
          userSolution: 'Fiber organiza el trabajo en unidades discretas. useTransition marca updates de baja prioridad cediendo el hilo principal.',
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(5);
      expect(res.body.feedback).toBeDefined();
      expect(Array.isArray(res.body.missingTradeoffs)).toBe(true);
      expect(Array.isArray(res.body.strengths)).toBe(true);
      expect(res.body.srsStage).toBe(1);
      expect(res.body.intervalDays).toBe(1);
      expect(new Date(res.body.nextReviewAt).getTime()).toBeGreaterThan(Date.now());
      expect(res.body.sessionLogId).toBeDefined();

      // Verificar que el topic se actualizó en la base de datos
      const updatedTopic = await Topic.findById(topic._id);
      expect(updatedTopic.srsStage).toBe(1);
      expect(updatedTopic.history.length).toBe(1);
      expect(updatedTopic.history[0].score).toBe(5);
      expect(updatedTopic.history[0].userInput).toContain('Fiber organiza');

      // Verificar que se creó el SessionLog correspondiente
      const sessionLog = await SessionLog.findById(res.body.sessionLogId);
      expect(sessionLog).not.toBeNull();
      expect(sessionLog.topicId.toString()).toBe(topic._id.toString());
      expect(sessionLog.score).toBe(5);
    });
  });
});
