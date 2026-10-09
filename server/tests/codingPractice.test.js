import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { geminiCallHistory } from './practice.test.js';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { Topic } from '../src/models/Topic.js';
import { SessionLog } from '../src/models/SessionLog.js';

describe('Coding Playground API Integration Tests', () => {
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

  describe('Model Validations (Topic.codingChallenge)', () => {
    it('permite crear Topic sin codingChallenge (retrocompatibilidad)', async () => {
      const topic = await Topic.create({
        title: 'Tema Sin Challenge',
        category: 'hard_skill',
        type: 'theory',
      });
      expect(topic.codingChallenge).toBeUndefined();
    });

    it('rechaza functionName inválido', async () => {
      const promise = Topic.create({
        title: 'Invalid Function Name',
        category: 'hard_skill',
        type: 'practice',
        codingChallenge: {
          functionName: '1abc',
          description: 'desc',
          starterCode: 'code',
          testCases: [{ input: [], expected: 1 }],
        },
      });
      await expect(promise).rejects.toThrow();
    });

    it('rechaza testCases vacío', async () => {
      const promise = Topic.create({
        title: 'Empty Test Cases',
        category: 'hard_skill',
        type: 'practice',
        codingChallenge: {
          functionName: 'validFn',
          description: 'desc',
          starterCode: 'code',
          testCases: [],
        },
      });
      await expect(promise).rejects.toThrow();
    });
  });

  describe('GET /api/practice/coding/challenges', () => {
    it('solo devuelve tópicos con codingChallenge', async () => {
      await Topic.create({
        title: 'No challenge',
        category: 'hard_skill',
        type: 'theory',
      });

      const topicWithChallenge = await Topic.create({
        title: 'With challenge',
        category: 'hard_skill',
        type: 'practice',
        level: 'junior',
        codingChallenge: {
          functionName: 'myFn',
          description: 'desc',
          starterCode: 'code',
          testCases: [{ input: [1], expected: 1 }],
        },
      });

      const res = await request(app).get('/api/practice/coding/challenges');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(topicWithChallenge._id.toString());
      expect(res.body[0].codingChallenge.functionName).toBe('myFn');
      expect(res.body[0].isDue).toBe(true);
    });

    it('?level=mid filtra por nivel mid y ?level=foo ignora el filtro', async () => {
      await Topic.create({
        title: 'Junior challenge',
        category: 'hard_skill',
        type: 'practice',
        level: 'junior',
        codingChallenge: {
          functionName: 'fn1',
          description: 'desc',
          starterCode: 'code',
          testCases: [{ input: [], expected: 1 }],
        },
      });

      await Topic.create({
        title: 'Mid challenge',
        category: 'hard_skill',
        type: 'practice',
        level: 'mid',
        codingChallenge: {
          functionName: 'fn2',
          description: 'desc',
          starterCode: 'code',
          testCases: [{ input: [], expected: 1 }],
        },
      });

      const resMid = await request(app).get('/api/practice/coding/challenges?level=mid');
      expect(resMid.status).toBe(200);
      expect(resMid.body.length).toBe(1);
      expect(resMid.body[0].level).toBe('mid');

      const resFoo = await request(app).get('/api/practice/coding/challenges?level=foo');
      expect(resFoo.status).toBe(200);
      expect(resFoo.body.length).toBe(2);
    });
  });

  describe('POST /api/practice/coding/evaluate', () => {
    it('retorna 400 si falta topicId', async () => {
      const res = await request(app).post('/api/practice/coding/evaluate').send({ code: 'x' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('topicId is required');
    });

    it('retorna 400 si code no es string o está vacío', async () => {
      const res = await request(app).post('/api/practice/coding/evaluate').send({ topicId: '123', code: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('code is required');
    });

    it('retorna 400 si code excede 20000 caracteres', async () => {
      const longCode = 'a'.repeat(20001);
      const res = await request(app).post('/api/practice/coding/evaluate').send({ topicId: '123', code: longCode });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('code exceeds 20000 characters');
    });

    it('retorna 400 si testResults es inválido o passedCount > totalCount', async () => {
      const res = await request(app)
        .post('/api/practice/coding/evaluate')
        .send({ topicId: '123', code: 'fn()', testResults: { passedCount: 5, totalCount: 2 } });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('testResults is invalid');
    });

    it('retorna 404 si Topic no existe', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/practice/coding/evaluate')
        .send({
          topicId: randomId,
          code: 'function f(){}',
          testResults: { passedCount: 1, totalCount: 1 },
        });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Topic not found');
    });

    it('retorna 422 si Topic no tiene codingChallenge', async () => {
      const topic = await Topic.create({
        title: 'Sin challenge',
        category: 'hard_skill',
        type: 'theory',
      });

      const res = await request(app)
        .post('/api/practice/coding/evaluate')
        .send({
          topicId: topic._id,
          code: 'function f(){}',
          testResults: { passedCount: 1, totalCount: 1 },
        });
      expect(res.status).toBe(422);
      expect(res.body.error).toBe('Topic has no coding challenge');
    });

    it('retorna 400 si testResults.totalCount no coincide con los testCases del topic', async () => {
      const topic = await Topic.create({
        title: 'Con challenge',
        category: 'hard_skill',
        type: 'practice',
        codingChallenge: {
          functionName: 'f',
          description: 'd',
          starterCode: 'c',
          testCases: [{ input: [], expected: 1 }, { input: [], expected: 2 }],
        },
      });

      const res = await request(app)
        .post('/api/practice/coding/evaluate')
        .send({
          topicId: topic._id,
          code: 'function f(){}',
          testResults: { passedCount: 1, totalCount: 1 },
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('testResults do not match challenge test cases');
    });

    it('todos los tests pasados → Gemini invocado exactamente 1 vez, aiReviewed true, SRS incrementado, SessionLog creado', async () => {
      const topic = await Topic.create({
        title: 'Reto Suma',
        category: 'hard_skill',
        type: 'practice',
        level: 'junior',
        srsStage: 0,
        easeFactor: 2.5,
        intervalDays: 0,
        codingChallenge: {
          functionName: 'sum',
          description: 'Suma dos números',
          starterCode: 'code',
          testCases: [{ input: [1, 2], expected: 3 }],
        },
      });

      const res = await request(app)
        .post('/api/practice/coding/evaluate')
        .send({
          topicId: topic._id,
          code: 'function sum(a, b) { return a + b; }',
          testResults: {
            passedCount: 1,
            totalCount: 1,
            executionTimeMs: 1.2,
            results: [{ index: 0, status: 'PASSED' }],
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.aiReviewed).toBe(true);
      expect(res.body.score).toBe(5);
      expect(res.body.complexity).toBeDefined();
      expect(res.body.srsStage).toBe(1);
      expect(res.body.sessionLogId).toBeDefined();
      expect(geminiCallHistory.length).toBe(1);

      const updated = await Topic.findById(topic._id);
      expect(updated.history.length).toBe(1);
      expect(updated.history[0].userInput).toContain('function sum');
    });

    it('tests parciales (2/4) → Gemini NO invocado, score 2, aiReviewed false', async () => {
      const topic = await Topic.create({
        title: 'Reto Parcial',
        category: 'hard_skill',
        type: 'practice',
        level: 'mid',
        codingChallenge: {
          functionName: 'fn',
          description: 'desc',
          starterCode: 'code',
          testCases: [
            { input: [], expected: 1 },
            { input: [], expected: 2 },
            { input: [], expected: 3 },
            { input: [], expected: 4 },
          ],
        },
      });

      const res = await request(app)
        .post('/api/practice/coding/evaluate')
        .send({
          topicId: topic._id,
          code: 'function fn() {}',
          testResults: {
            passedCount: 2,
            totalCount: 4,
            executionTimeMs: 2.5,
            results: [],
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(2);
      expect(res.body.aiReviewed).toBe(false);
      expect(res.body.complexity).toBeNull();
      expect(geminiCallHistory.length).toBe(0);
    });

    it('cero tests pasados (0/4) → score 1', async () => {
      const topic = await Topic.create({
        title: 'Reto Cero',
        category: 'hard_skill',
        type: 'practice',
        level: 'mid',
        codingChallenge: {
          functionName: 'fn',
          description: 'desc',
          starterCode: 'code',
          testCases: [
            { input: [], expected: 1 },
            { input: [], expected: 2 },
            { input: [], expected: 3 },
            { input: [], expected: 4 },
          ],
        },
      });

      const res = await request(app)
        .post('/api/practice/coding/evaluate')
        .send({
          topicId: topic._id,
          code: 'function fn() {}',
          testResults: {
            passedCount: 0,
            totalCount: 4,
            executionTimeMs: 0.5,
            results: [],
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(1);
      expect(res.body.aiReviewed).toBe(false);
    });

    it('prompt Junior contiene Evaluador de Código y no contiene Staff Engineer ni concurrencia masiva', async () => {
      const topic = await Topic.create({
        title: 'Reto Junior Prompt',
        category: 'hard_skill',
        type: 'practice',
        level: 'junior',
        codingChallenge: {
          functionName: 'sum',
          description: 'Suma',
          starterCode: 'c',
          testCases: [{ input: [1], expected: 1 }],
        },
      });

      await request(app)
        .post('/api/practice/coding/evaluate')
        .send({
          topicId: topic._id,
          code: 'function sum(a) { return a; }',
          testResults: { passedCount: 1, totalCount: 1 },
        });

      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('Evaluador de Código');
      expect(sysInstruction).not.toContain('Staff Engineer');
      expect(sysInstruction).not.toContain('concurrencia masiva');
    });

    it('fallback offline (sin GEMINI_API_KEY) retorna 200 con score 4 y offline en complexity', async () => {
      delete process.env.GEMINI_API_KEY;

      const topic = await Topic.create({
        title: 'Reto Offline',
        category: 'hard_skill',
        type: 'practice',
        level: 'junior',
        codingChallenge: {
          functionName: 'fn',
          description: 'desc',
          starterCode: 'code',
          testCases: [{ input: [], expected: 1 }],
        },
      });

      const res = await request(app)
        .post('/api/practice/coding/evaluate')
        .send({
          topicId: topic._id,
          code: 'function fn() { return 1; }',
          testResults: { passedCount: 1, totalCount: 1 },
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(4);
      expect(res.body.complexity.time).toContain('offline');

      process.env.GEMINI_API_KEY = 'mock-test-key';
    });
  });
});
