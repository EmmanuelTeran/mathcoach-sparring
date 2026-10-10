import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic } from '../src/models/MathTopic.js';
import { TopicTrack } from '../src/models/TopicTrack.js';

describe('Dashboard Controller Integration Tests (GET /api/dashboard/summary)', () => {
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
    await TopicTrack.deleteMany({});
    await MathTopic.deleteMany({});
  });

  it('1. Colección vacía: retorna 200 con conteos en cero, arreglos vacíos y nextRecommended en null', async () => {
    const res = await request(app).get('/api/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      dueCount: 0,
      dueByCategory: {
        technique: 0,
        application: 0,
        proof: 0,
      },
      nextRecommended: null,
      criticalTracks: [],
      topics: [],
    });
  });

  it('2. Cómputo de vencimientos por categoría (dueCount y dueByCategory)', async () => {
    const topic = await MathTopic.create({
      slug: 'fracciones-algebraicas',
      title: 'Fracciones Algebraicas',
      area: 'algebra',
      order: 1,
    });

    const now = Date.now();

    // Pista 1: Técnica vencida (hace 2 horas)
    await TopicTrack.create({
      topicId: topic._id,
      category: 'technique',
      difficulty: 1,
      dueDate: new Date(now - 7200 * 1000),
      lastRoundScore: 4.0,
    });

    // Pista 2: Aplicación vencida (hace 1 hora)
    await TopicTrack.create({
      topicId: topic._id,
      category: 'application',
      difficulty: 2,
      dueDate: new Date(now - 3600 * 1000),
      lastRoundScore: 3.5,
    });

    // Pista 3: Demostración no vencida (vence en 2 días)
    await TopicTrack.create({
      topicId: topic._id,
      category: 'proof',
      difficulty: 1,
      dueDate: new Date(now + 2 * 24 * 3600 * 1000),
      lastRoundScore: null,
    });

    const res = await request(app).get('/api/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body.dueCount).toBe(2);
    expect(res.body.dueByCategory).toEqual({
      technique: 1,
      application: 1,
      proof: 0,
    });
  });

  it('3. Determinación de la pista recomendada (nextRecommended) coincidente con /api/rounds/queue', async () => {
    const topicA = await MathTopic.create({
      slug: 'factorizacion',
      title: 'Factorización',
      area: 'algebra',
      order: 1,
    });

    const topicB = await MathTopic.create({
      slug: 'derivadas',
      title: 'Derivadas',
      area: 'calculo',
      order: 2,
    });

    const now = Date.now();

    // Track 1: topicA technique, dueDate hace 10 días, score = 4.5
    await TopicTrack.create({
      topicId: topicA._id,
      category: 'technique',
      difficulty: 2,
      dueDate: new Date(now - 10 * 86400 * 1000),
      lastRoundScore: 4.5,
    });

    // Track 2: topicB proof, dueDate hace 2 días, score = 2.0 (menor score que track 1)
    const trackBProof = await TopicTrack.create({
      topicId: topicB._id,
      category: 'proof',
      difficulty: 1,
      dueDate: new Date(now - 2 * 86400 * 1000),
      lastRoundScore: 2.0,
    });

    // Track 3: topicA application, dueDate hace 1 día, score = null (null va primero por prioridad)
    const trackAApp = await TopicTrack.create({
      topicId: topicA._id,
      category: 'application',
      difficulty: 1,
      dueDate: new Date(now - 86400 * 1000),
      lastRoundScore: null,
    });

    const res = await request(app).get('/api/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body.nextRecommended).not.toBeNull();
    // Debe priorizar trackAApp porque lastRoundScore es null
    expect(res.body.nextRecommended.trackId).toBe(trackAApp._id.toString());
    expect(res.body.nextRecommended.topic.title).toBe('Factorización');
    expect(res.body.nextRecommended.category).toBe('application');
    expect(res.body.nextRecommended.difficulty).toBe(1);
  });

  it('4. Filtrado y ordenamiento de áreas críticas (criticalTracks): sólo lastRoundScore < 3', async () => {
    const topic = await MathTopic.create({
      slug: 'geometria-analitica',
      title: 'Geometría Analítica',
      area: 'geometria',
      order: 1,
    });

    // Score 2.5 (< 3) -> Crítica
    await TopicTrack.create({
      topicId: topic._id,
      category: 'technique',
      difficulty: 1,
      lastRoundScore: 2.5,
    });

    // Score 1.0 (< 3) -> Crítica (debe aparecer primero porque 1.0 < 2.5)
    await TopicTrack.create({
      topicId: topic._id,
      category: 'application',
      difficulty: 2,
      lastRoundScore: 1.0,
    });

    // Score 3.0 (>= 3) -> No es crítica
    await TopicTrack.create({
      topicId: topic._id,
      category: 'proof',
      difficulty: 1,
      lastRoundScore: 3.0,
    });

    const res = await request(app).get('/api/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body.criticalTracks).toHaveLength(2);
    // Orden ascendente por score: 1.0 primero, luego 2.5
    expect(res.body.criticalTracks[0].category).toBe('application');
    expect(res.body.criticalTracks[0].lastRoundScore).toBe(1.0);
    expect(res.body.criticalTracks[1].category).toBe('technique');
    expect(res.body.criticalTracks[1].lastRoundScore).toBe(2.5);
  });

  it('5. Matriz jerárquica por tema (topics) con pistas proyectadas ordenadas por order', async () => {
    const topic2 = await MathTopic.create({
      slug: 'integrales',
      title: 'Integrales',
      area: 'calculo',
      order: 2,
    });

    const topic1 = await MathTopic.create({
      slug: 'limites',
      title: 'Límites',
      area: 'calculo',
      order: 1,
    });

    await TopicTrack.create({
      topicId: topic1._id,
      category: 'technique',
      difficulty: 1,
      dueDate: new Date(),
      lastRoundScore: 4.8,
    });

    await TopicTrack.create({
      topicId: topic2._id,
      category: 'proof',
      difficulty: 3,
      dueDate: new Date(),
      lastRoundScore: 2.0,
    });

    const res = await request(app).get('/api/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body.topics).toHaveLength(2);
    // topic1 va primero debido a order: 1 vs order: 2
    expect(res.body.topics[0].title).toBe('Límites');
    expect(res.body.topics[0].tracks).toHaveLength(1);
    expect(res.body.topics[0].tracks[0].category).toBe('technique');
    expect(res.body.topics[0].tracks[0].difficulty).toBe(1);

    expect(res.body.topics[1].title).toBe('Integrales');
    expect(res.body.topics[1].tracks).toHaveLength(1);
    expect(res.body.topics[1].tracks[0].category).toBe('proof');
    expect(res.body.topics[1].tracks[0].difficulty).toBe(3);
  });
});
