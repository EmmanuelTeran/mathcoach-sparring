import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { Topic } from '../src/models/Topic.js';

describe('Topics API Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
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
    await Topic.deleteMany({});
  });

  describe('GET /api/topics/due', () => {
    it('devuelve una lista vacía si no hay tópicos con nextReviewAt <= now', async () => {
      // Tópico con fecha futura (mañana)
      await Topic.create({
        title: 'React Hooks',
        category: 'hard_skill',
        type: 'theory',
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const res = await request(app).get('/api/topics/due');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('devuelve tópicos pendientes ordenados por prioridad (menor score histórico y mayor retraso)', async () => {
      const past2Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const past1Day = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      // Tópico A: vencido hace 1 día, score histórico promedio = 2
      const topicA = await Topic.create({
        title: 'Node Event Loop',
        category: 'hard_skill',
        type: 'theory',
        nextReviewAt: past1Day,
        history: [{ score: 2, userInput: 'test', aiFeedback: 'review needed' }],
      });

      // Tópico B: vencido hace 2 días, score histórico promedio = 4
      const topicB = await Topic.create({
        title: 'CSS Grid & Flexbox',
        category: 'hard_skill',
        type: 'practice',
        nextReviewAt: past2Days,
        history: [{ score: 4, userInput: 'test', aiFeedback: 'good job' }],
      });

      // Tópico C: vencido hace 2 días, score histórico promedio = 2 (más retrasado que topicA con mismo score)
      const topicC = await Topic.create({
        title: 'Arquitectura Hexagonal',
        category: 'hard_skill',
        type: 'theory',
        nextReviewAt: past2Days,
        history: [{ score: 2, userInput: 'test', aiFeedback: 'review needed' }],
      });

      const res = await request(app).get('/api/topics/due');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);

      // Prioridad esperada:
      // topicC (score 2, vencido hace 2 días)
      // topicA (score 2, vencido hace 1 día)
      // topicB (score 4, vencido hace 2 días)
      expect(res.body[0]._id).toBe(topicC._id.toString());
      expect(res.body[1]._id).toBe(topicA._id.toString());
      expect(res.body[2]._id).toBe(topicB._id.toString());
    });
  });

  describe('POST /api/topics/review', () => {
    it('retorna 400 si faltan topicId o score', async () => {
      const res = await request(app).post('/api/topics/review').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('retorna 400 si score no está entre 1 y 5', async () => {
      const topic = await Topic.create({
        title: 'Git Rebasing',
        category: 'hard_skill',
        type: 'practice',
      });

      const res = await request(app).post('/api/topics/review').send({
        topicId: topic._id,
        score: 6,
      });
      expect(res.status).toBe(400);
    });

    it('retorna 404 si el topicId no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).post('/api/topics/review').send({
        topicId: nonExistentId,
        score: 4,
      });
      expect(res.status).toBe(404);
    });

    it('registra exitosamente una revisión, actualiza SRS y reprograma nextReviewAt en el futuro', async () => {
      const topic = await Topic.create({
        title: 'State Management in React',
        category: 'hard_skill',
        type: 'practice',
        srsStage: 0,
        easeFactor: 2.5,
        intervalDays: 0,
        nextReviewAt: new Date(Date.now() - 1000), // vencido
      });

      const reviewPayload = {
        topicId: topic._id.toString(),
        score: 4,
        userInput: 'Usar context para estado global liviano o Zustand para alto rendimiento',
        aiFeedback: 'Excelente análisis de trade-offs',
      };

      const res = await request(app).post('/api/topics/review').send(reviewPayload);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Review recorded successfully');
      expect(res.body.topic).toBeDefined();

      const updatedTopic = res.body.topic;
      expect(updatedTopic.srsStage).toBe(1);
      expect(updatedTopic.intervalDays).toBe(1);
      expect(new Date(updatedTopic.nextReviewAt).getTime()).toBeGreaterThan(Date.now());

      // Verificar historial
      expect(updatedTopic.history.length).toBe(1);
      expect(updatedTopic.history[0].score).toBe(4);
      expect(updatedTopic.history[0].userInput).toBe(reviewPayload.userInput);
      expect(updatedTopic.history[0].aiFeedback).toBe(reviewPayload.aiFeedback);

      // Verificar persistencia real en MongoDB
      const topicInDb = await Topic.findById(topic._id);
      expect(topicInDb.srsStage).toBe(1);
      expect(topicInDb.history.length).toBe(1);
      expect(topicInDb.nextReviewAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('aplica cálculo SM-2 en revisiones consecutivas escalando intervalos', async () => {
      const topic = await Topic.create({
        title: 'Docker Multi-stage Builds',
        category: 'hard_skill',
        type: 'theory',
        srsStage: 1,
        easeFactor: 2.5,
        intervalDays: 1,
      });

      // Segunda revisión exitosa (score 4) -> avanza a stage 2, intervalo = 6 días
      const res = await request(app).post('/api/topics/review').send({
        topicId: topic._id.toString(),
        score: 4,
      });

      expect(res.status).toBe(200);
      expect(res.body.topic.srsStage).toBe(2);
      expect(res.body.topic.intervalDays).toBe(6);

      // Tercera revisión con score 5 -> avanza a stage 3, EF = 2.6, intervalo = Math.round(6 * 2.6) = 16
      const res2 = await request(app).post('/api/topics/review').send({
        topicId: topic._id.toString(),
        score: 5,
      });

      expect(res2.status).toBe(200);
      expect(res2.body.topic.srsStage).toBe(3);
      expect(res2.body.topic.easeFactor).toBe(2.6);
      expect(res2.body.topic.intervalDays).toBe(16);
      expect(res2.body.topic.history.length).toBe(2);
    });

    it('resetea srsStage a 0 e intervalo a 1 si el score es 1 o 2', async () => {
      const topic = await Topic.create({
        title: 'Microfrontends Communication',
        category: 'hard_skill',
        type: 'theory',
        srsStage: 3,
        easeFactor: 2.5,
        intervalDays: 15,
      });

      const res = await request(app).post('/api/topics/review').send({
        topicId: topic._id.toString(),
        score: 2,
        userInput: 'No recordé CustomEvents',
        aiFeedback: 'Repasar comunicación entre iframes y web components',
      });

      expect(res.status).toBe(200);
      expect(res.body.topic.srsStage).toBe(0);
      expect(res.body.topic.intervalDays).toBe(1);
    });
  });
});
