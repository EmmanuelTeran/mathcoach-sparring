import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { Topic } from '../src/models/Topic.js';
import { SessionLog } from '../src/models/SessionLog.js';

describe('Dashboard API Integration Tests - GET /api/dashboard/summary', () => {
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
    await SessionLog.deleteMany({});
  });

  it('devuelve métricas en cero y arrays vacíos cuando no hay temas', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      dueCount: 0,
      dueHardSkills: 0,
      dueSoftSkills: 0,
      criticalTopics: [],
      recommendedNext: null,
    });
  });

  it('calcula correctamente dueCount, dueHardSkills y dueSoftSkills con temas vencidos hoy', async () => {
    const pastTime = new Date(Date.now() - 3600 * 1000);
    const futureTime = new Date(Date.now() + 86400 * 1000);

    // Hard skill vencida
    await Topic.create({
      title: 'Node Event Loop',
      category: 'hard_skill',
      type: 'theory',
      nextReviewAt: pastTime,
    });

    // Otra hard skill práctica vencida
    await Topic.create({
      title: 'React Custom Hooks',
      category: 'hard_skill',
      type: 'theory',
      nextReviewAt: pastTime,
    });

    // Soft skill vencida
    await Topic.create({
      title: 'Negociación de Deuda Técnica',
      category: 'soft_skill',
      type: 'practice',
      nextReviewAt: pastTime,
    });

    // Tema futuro (no debe sumar a pendientes de hoy)
    await Topic.create({
      title: 'Docker y Contenedores',
      category: 'hard_skill',
      type: 'theory',
      nextReviewAt: futureTime,
    });

    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.dueCount).toBe(3);
    expect(res.body.dueHardSkills).toBe(2);
    expect(res.body.dueSoftSkills).toBe(1);
  });

  it('detecta áreas críticas (score < 3) y las ordena de menor a mayor calificación', async () => {
    // Tema 1: último score 1 (crítico grave)
    const topic1 = await Topic.create({
      title: 'MongoDB Aggregation Pipeline',
      category: 'hard_skill',
      type: 'theory',
      history: [
        { score: 4, reviewedAt: new Date(Date.now() - 5000) },
        { score: 1, reviewedAt: new Date() }, // último score 1
      ],
    });

    // Tema 2: último score 2 (crítico moderado)
    const topic2 = await Topic.create({
      title: 'Arquitectura Microfrontends',
      category: 'hard_skill',
      type: 'theory',
      history: [
        { score: 2, reviewedAt: new Date() },
      ],
    });

    // Tema 3: último score 5 (tema aprobado, no debe ser crítico)
    await Topic.create({
      title: 'Testing Unitario con Vitest',
      category: 'hard_skill',
      type: 'theory',
      history: [
        { score: 5, reviewedAt: new Date() },
      ],
    });

    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.criticalTopics.length).toBe(2);
    // Orden ascendente de score: score 1 primero, luego score 2
    expect(res.body.criticalTopics[0].title).toBe('MongoDB Aggregation Pipeline');
    expect(res.body.criticalTopics[0].lastScore).toBe(1);
    expect(res.body.criticalTopics[1].title).toBe('Arquitectura Microfrontends');
    expect(res.body.criticalTopics[1].lastScore).toBe(2);
  });

  it('regla de recomendación acoplada: si la soft skill más urgente tiene base técnica deficiente (< 3), prioriza el reto técnico', async () => {
    const olderPast = new Date(Date.now() - 7200 * 1000); // Más vencido
    const newerPast = new Date(Date.now() - 3600 * 1000);

    // Soft skill vencida con fecha más antigua (sería la candidata por urgencia temporal directa)
    const softSkillTopic = await Topic.create({
      title: 'Defensa de Arquitectura React Fiber ante Dirección',
      category: 'soft_skill',
      type: 'practice',
      nextReviewAt: olderPast,
    });

    // Hard skill de la misma subcategoría o tema (React Fiber) con deficiencia (score 2)
    const hardSkillTopic = await Topic.create({
      title: 'React Fiber y Virtual DOM Internals',
      category: 'hard_skill',
      type: 'theory',
      nextReviewAt: newerPast,
      history: [{ score: 2, reviewedAt: new Date() }],
    });

    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.recommendedNext).not.toBeNull();
    // La regla de recomendación acoplada prioriza el reto de hard skill para cimentar la base
    expect(res.body.recommendedNext._id.toString()).toBe(hardSkillTopic._id.toString());
    expect(res.body.recommendedNext.title).toBe('React Fiber y Virtual DOM Internals');
  });

  it('recomienda la soft skill directamente si no hay deficiencia técnica previa (< 3)', async () => {
    const olderPast = new Date(Date.now() - 7200 * 1000);
    const newerPast = new Date(Date.now() - 3600 * 1000);

    // Soft skill más urgente
    const softSkillTopic = await Topic.create({
      title: 'Negociación de SLA y Costos Cloud con PM',
      category: 'soft_skill',
      type: 'practice',
      nextReviewAt: olderPast,
    });

    // Hard skill con buen dominio (score 4)
    await Topic.create({
      title: 'Arquitectura Cloud & AWS Lambda',
      category: 'hard_skill',
      type: 'theory',
      nextReviewAt: newerPast,
      history: [{ score: 4, reviewedAt: new Date() }],
    });

    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.recommendedNext).not.toBeNull();
    expect(res.body.recommendedNext._id.toString()).toBe(softSkillTopic._id.toString());
  });

  it('AC-3: calcula conteos aislados de dueCount, dueHardSkills y dueSoftSkills con filtro ?level=...', async () => {
    const pastTime = new Date(Date.now() - 3600 * 1000);

    // Junior: 2 hard skills, 1 soft skill
    await Topic.create({
      title: 'Variables y Scope en JS',
      category: 'hard_skill',
      type: 'theory',
      level: 'junior',
      nextReviewAt: pastTime,
    });
    await Topic.create({
      title: 'CRUD con Express',
      category: 'hard_skill',
      type: 'practice',
      level: 'junior',
      nextReviewAt: pastTime,
    });
    await Topic.create({
      title: 'Daily Standup Efectivo',
      category: 'soft_skill',
      type: 'practice',
      level: 'junior',
      nextReviewAt: pastTime,
    });

    // Mid: 1 hard skill, 2 soft skills
    await Topic.create({
      title: 'Custom Hooks Avanzados',
      category: 'hard_skill',
      type: 'theory',
      level: 'mid',
      nextReviewAt: pastTime,
    });
    await Topic.create({
      title: 'Negociación de Deuda Técnica Mid',
      category: 'soft_skill',
      type: 'practice',
      level: 'mid',
      nextReviewAt: pastTime,
    });
    await Topic.create({
      title: 'Refactorización Segura Mid',
      category: 'soft_skill',
      type: 'practice',
      level: 'mid',
      nextReviewAt: pastTime,
    });

    // Senior: 3 hard skills, 1 soft skill
    await Topic.create({
      title: 'Event Loop libuv',
      category: 'hard_skill',
      type: 'theory',
      level: 'senior',
      nextReviewAt: pastTime,
    });
    await Topic.create({
      title: 'Node.js Memory Leak Profiling',
      category: 'hard_skill',
      type: 'theory',
      level: 'senior',
      nextReviewAt: pastTime,
    });
    await Topic.create({
      title: 'Índices Compuestos y Query Planner',
      category: 'hard_skill',
      type: 'theory',
      level: 'senior',
      nextReviewAt: pastTime,
    });
    await Topic.create({
      title: 'Rechazo Asertivo de Microservicios Senior',
      category: 'soft_skill',
      type: 'practice',
      level: 'senior',
      nextReviewAt: pastTime,
    });

    // 1. Filtrar por Junior
    const resJunior = await request(app).get('/api/dashboard/summary?level=junior');
    expect(resJunior.status).toBe(200);
    expect(resJunior.body.dueCount).toBe(3);
    expect(resJunior.body.dueHardSkills).toBe(2);
    expect(resJunior.body.dueSoftSkills).toBe(1);

    // 2. Filtrar por Mid
    const resMid = await request(app).get('/api/dashboard/summary?level=mid');
    expect(resMid.status).toBe(200);
    expect(resMid.body.dueCount).toBe(3);
    expect(resMid.body.dueHardSkills).toBe(1);
    expect(resMid.body.dueSoftSkills).toBe(2);

    // 3. Filtrar por Senior
    const resSenior = await request(app).get('/api/dashboard/summary?level=senior');
    expect(resSenior.status).toBe(200);
    expect(resSenior.body.dueCount).toBe(4);
    expect(resSenior.body.dueHardSkills).toBe(3);
    expect(resSenior.body.dueSoftSkills).toBe(1);

    // 4. Sin filtro (Todos los niveles)
    const resAll = await request(app).get('/api/dashboard/summary');
    expect(resAll.status).toBe(200);
    expect(resAll.body.dueCount).toBe(10);
    expect(resAll.body.dueHardSkills).toBe(6);
    expect(resAll.body.dueSoftSkills).toBe(4);
  });
});

