import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic } from '../src/models/MathTopic.js';
import { TopicTrack } from '../src/models/TopicTrack.js';
import { Exercise } from '../src/models/Exercise.js';
import { Round } from '../src/models/Round.js';

describe('Rounds API Integration Tests (/api/rounds)', () => {
  let mongoServer;
  let testTopic;
  let testTrack;

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
    await Round.deleteMany({});
    await Exercise.deleteMany({});
    await TopicTrack.deleteMany({});
    await MathTopic.deleteMany({});

    testTopic = await MathTopic.create({
      slug: 'fracciones-algebraicas',
      title: 'Fracciones Algebraicas',
      area: 'algebra',
      source: 'CONAMAT',
      order: 1,
      description: 'Simplificación y operaciones racionales',
    });

    testTrack = await TopicTrack.create({
      topicId: testTopic._id,
      category: 'technique',
      difficulty: 1,
      dueDate: new Date(Date.now() - 3600 * 1000), // vencido hace 1 hora
      lastRoundScore: null,
    });
  });

  describe('GET /api/rounds/queue', () => {
    it('devuelve sólo pistas vencidas ordenadas por menor lastRoundScore (null primero) y mayor retraso', async () => {
      // testTopic tiene testTrack: (testTopic, 'technique', diff 1, score null, vencido hace 1 hora)
      const topicB = await MathTopic.create({
        slug: 'limites',
        title: 'Límites',
        area: 'calculo',
        source: 'Stewart',
        order: 2,
      });

      // Pista 1: topicB - application, vencida hace 2 horas, score: null
      const track1 = await TopicTrack.create({
        topicId: topicB._id,
        category: 'application',
        difficulty: 1,
        dueDate: new Date(Date.now() - 2 * 3600 * 1000),
        lastRoundScore: null,
      });

      // Pista 2: topicB - proof, vencida hace 10 horas, score: 2.0
      const track2 = await TopicTrack.create({
        topicId: topicB._id,
        category: 'proof',
        difficulty: 1,
        dueDate: new Date(Date.now() - 10 * 3600 * 1000),
        lastRoundScore: 2.0,
      });

      // Pista 3: testTopic - proof, vencida hace 20 horas, score: 4.5
      const track3 = await TopicTrack.create({
        topicId: testTopic._id,
        category: 'proof',
        difficulty: 1,
        dueDate: new Date(Date.now() - 20 * 3600 * 1000),
        lastRoundScore: 4.5,
      });

      // Pista 4: futura (no vencida)
      await TopicTrack.create({
        topicId: testTopic._id,
        category: 'application',
        difficulty: 1,
        dueDate: new Date(Date.now() + 24 * 3600 * 1000),
        lastRoundScore: null,
      });

      const res = await request(app).get('/api/rounds/queue');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(4); // testTrack (score null), track1 (score null), track2 (2.0), track3 (4.5)

      // Criterio 1: nulls primero, ordenados por mayor retraso (dueDate menor):
      // track1 venció hace 2 horas, testTrack venció hace 1 hora -> track1 antes de testTrack
      expect(res.body[0].trackId).toBe(track1._id.toString());
      expect(res.body[0].lastRoundScore).toBeNull();
      expect(res.body[0].topic.title).toBe('Límites');

      expect(res.body[1].trackId).toBe(testTrack._id.toString());
      expect(res.body[1].lastRoundScore).toBeNull();
      expect(res.body[1].topic.title).toBe('Fracciones Algebraicas');

      // Criterio 2: luego scores numéricos ascendentes:
      expect(res.body[2].trackId).toBe(track2._id.toString());
      expect(res.body[2].lastRoundScore).toBe(2.0);

      expect(res.body[3].trackId).toBe(track3._id.toString());
      expect(res.body[3].lastRoundScore).toBe(4.5);
    });
  });

  describe('POST /api/rounds', () => {
    it('falla con 400 si faltan topicId o category', async () => {
      const res1 = await request(app).post('/api/rounds').send({ category: 'technique' });
      expect(res1.status).toBe(400);

      const res2 = await request(app).post('/api/rounds').send({ topicId: testTopic._id });
      expect(res2.status).toBe(400);
    });

    it('falla con 400 si topicId no es un ObjectId válido', async () => {
      const res = await request(app).post('/api/rounds').send({
        topicId: 'invalid-id',
        category: 'technique',
      });
      expect(res.status).toBe(400);
    });

    it('falla con 400 si category es inválida', async () => {
      const res = await request(app).post('/api/rounds').send({
        topicId: testTopic._id,
        category: 'invalida',
      });
      expect(res.status).toBe(400);
    });

    it('falla con 404 si topicId no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).post('/api/rounds').send({
        topicId: nonExistentId,
        category: 'technique',
      });
      expect(res.status).toBe(404);
    });

    it('falla con 422 si no hay ejercicios disponibles en el catálogo para esa pista', async () => {
      const res = await request(app).post('/api/rounds').send({
        topicId: testTopic._id,
        category: 'technique',
      });
      expect(res.status).toBe(422);
      expect(res.body.error).toContain('No exercises available');
    });

    it('crea exitosamente una ronda con 201 y persiste snapshot y muta timesServed / lastServedAt', async () => {
      // Crear 6 ejercicios en catálogo para technique d1 (6 * 5 min = 30 min)
      const exercises = await Exercise.create(
        Array.from({ length: 6 }, (_, i) => ({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: i + 1,
          statement: `E${i + 1} statement`,
          expertMinutes: 5,
          externalKey: `ex-tech-${i + 1}`,
        }))
      );

      const res = await request(app).post('/api/rounds').send({
        topicId: testTopic._id,
        category: 'technique',
      });

      expect(res.status).toBe(201);
      expect(res.body.roundId).toBeDefined();
      expect(res.body.category).toBe('technique');
      expect(res.body.difficulty).toBe(1);
      expect(res.body.exercises.length).toBe(6);
      expect(res.body.totalExpertMinutes).toBe(30);
      expect(res.body.warning).toBeUndefined();

      // Verificar que se incrementó timesServed y se fijó lastServedAt en los ejercicios servidos
      const updatedEx1 = await Exercise.findById(exercises[0]._id);
      expect(updatedEx1.timesServed).toBe(1);
      expect(updatedEx1.lastServedAt).not.toBeNull();

      // Verificar que el documento Round está en BD con status pending
      const roundInDb = await Round.findById(res.body.roundId);
      expect(roundInDb).toBeDefined();
      expect(roundInDb.status).toBe('pending');
      expect(roundInDb.exercises.length).toBe(6);
    });

    it('reutiliza ronda pending existente retornando 200 (Idempotencia)', async () => {
      // Crear 6 ejercicios
      await Exercise.create(
        Array.from({ length: 6 }, (_, i) => ({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: i + 1,
          statement: `E${i + 1}`,
          expertMinutes: 5,
          externalKey: `ex-tech-${i + 1}`,
        }))
      );

      // Primera llamada: 201 Created
      const res1 = await request(app).post('/api/rounds').send({
        topicId: testTopic._id,
        category: 'technique',
      });
      expect(res1.status).toBe(201);
      const createdRoundId = res1.body.roundId;

      // Segunda llamada: debe retornar 200 con la misma ronda
      const res2 = await request(app).post('/api/rounds').send({
        topicId: testTopic._id,
        category: 'technique',
      });
      expect(res2.status).toBe(200);
      expect(res2.body.roundId).toBe(createdRoundId);

      // Confirmar que no hay duplicados en la base de datos
      const roundsCount = await Round.countDocuments({ trackId: testTrack._id });
      expect(roundsCount).toBe(1);
    });

    it('retorna warning: "catalog_insufficient" cuando hay menos ejercicios que el mínimo', async () => {
      // Técnica requiere mínimo 6. Insertamos sólo 2
      await Exercise.create([
        {
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: 1,
          statement: 'E1',
          expertMinutes: 5,
          externalKey: 'ex-tech-1',
        },
        {
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: 2,
          statement: 'E2',
          expertMinutes: 5,
          externalKey: 'ex-tech-2',
        },
      ]);

      const res = await request(app).post('/api/rounds').send({
        topicId: testTopic._id,
        category: 'technique',
      });

      expect(res.status).toBe(201);
      expect(res.body.exercises.length).toBe(2);
      expect(res.body.warning).toBe('catalog_insufficient');
    });

    it('rota ejercicios al generar una nueva ronda tras evaluar la anterior', async () => {
      // Catálogo con 7 ejercicios de 5 min (Técnica necesita 6 ejercicios de 5 min para completar 30 min)
      await Exercise.create(
        Array.from({ length: 7 }, (_, i) => ({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: i + 1,
          statement: `E${i + 1}`,
          expertMinutes: 5,
          externalKey: `ex-${i + 1}`,
          timesServed: 0,
        }))
      );

      // Primera ronda: toma E1..E6 (timesServed: 0)
      const res1 = await request(app).post('/api/rounds').send({
        topicId: testTopic._id,
        category: 'technique',
      });
      expect(res1.status).toBe(201);
      const firstExerciseKeys = res1.body.exercises.map((e) => e.order);
      expect(firstExerciseKeys).toEqual([1, 2, 3, 4, 5, 6]);

      // Simulamos que la primera ronda fue evaluada para permitir generar una segunda
      await Round.findByIdAndUpdate(res1.body.roundId, { status: 'evaluated' });

      // Segunda ronda: E7 (timesServed: 0) DEBE tener prioridad sobre E1..E6 (timesServed: 1)
      const res2 = await request(app).post('/api/rounds').send({
        topicId: testTopic._id,
        category: 'technique',
      });
      expect(res2.status).toBe(201);
      const secondOrders = res2.body.exercises.map((e) => e.order);
      expect(secondOrders).toContain(7);
    });
  });

  describe('GET /api/rounds/:id', () => {
    it('retorna 400 si el ID es malformado', async () => {
      const res = await request(app).get('/api/rounds/invalid-id');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid round ID');
    });

    it('retorna 404 si la ronda no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/rounds/${nonExistentId}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Round not found');
    });

    it('retorna 200 con el documento completo de la ronda', async () => {
      const round = await Round.create({
        trackId: testTrack._id,
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        totalExpertMinutes: 15,
        status: 'pending',
        exercises: [
          {
            exerciseId: new mongoose.Types.ObjectId(),
            order: 1,
            statement: 'Test statement',
            expertMinutes: 15,
          },
        ],
      });

      const res = await request(app).get(`/api/rounds/${round._id}`);
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(round._id.toString());
      expect(res.body.status).toBe('pending');
      expect(res.body.exercises.length).toBe(1);
      expect(res.body.exercises[0].statement).toBe('Test statement');
    });
  });
});
