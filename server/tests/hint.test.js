import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app.js';
import { Topic } from '../src/models/Topic.js';
import * as geminiService from '../src/services/geminiService.js';

let mongod;

beforeEach(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  vi.restoreAllMocks();
});

describe('AC-1: Topic model has level field', () => {
  it('defaults to junior when level is not specified', async () => {
    const topic = await Topic.create({
      title: 'Test Topic',
      category: 'hard_skill',
      type: 'theory',
    });
    expect(topic.level).toBe('junior');
  });

  it('accepts valid enum values for level', async () => {
    const junior = await Topic.create({ title: 'Topic A', category: 'hard_skill', type: 'theory', level: 'junior' });
    const mid = await Topic.create({ title: 'Topic B', category: 'hard_skill', type: 'theory', level: 'mid' });
    const senior = await Topic.create({ title: 'Topic C', category: 'hard_skill', type: 'theory', level: 'senior' });
    expect(junior.level).toBe('junior');
    expect(mid.level).toBe('mid');
    expect(senior.level).toBe('senior');
  });

  it('rejects invalid level values', async () => {
    await expect(
      Topic.create({ title: 'Bad Topic', category: 'hard_skill', type: 'theory', level: 'expert' })
    ).rejects.toThrow();
  });
});

describe('AC-2: POST /api/practice/hard-skill/hint', () => {
  let topicId;

  beforeEach(async () => {
    const topic = await Topic.create({
      title: 'Event Loop Internals',
      category: 'hard_skill',
      type: 'theory',
      level: 'senior',
    });
    topicId = topic._id.toString();
  });

  it('returns 400 when topicId is missing', async () => {
    const res = await request(app)
      .post('/api/practice/hard-skill/hint')
      .send({ challenge: 'Explica el event loop' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when challenge is missing', async () => {
    const res = await request(app)
      .post('/api/practice/hard-skill/hint')
      .send({ topicId });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when topic not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/practice/hard-skill/hint')
      .send({ topicId: fakeId, challenge: 'Explica el event loop' });
    expect(res.status).toBe(404);
  });

  it('returns analogy and guidingQuestions from Gemini mock', async () => {
    vi.spyOn(geminiService, 'generateHint').mockResolvedValue({
      analogy: 'El event loop es como un cocinero single-threaded.',
      guidingQuestions: [
        '¿Qué pasa con las callbacks cuando el stack está lleno?',
        '¿Cómo difiere microtask queue de macrotask queue?',
      ],
    });

    const res = await request(app)
      .post('/api/practice/hard-skill/hint')
      .send({ topicId, challenge: 'Explica el event loop' });

    expect(res.status).toBe(200);
    expect(res.body.analogy).toBe('El event loop es como un cocinero single-threaded.');
    expect(Array.isArray(res.body.guidingQuestions)).toBe(true);
    expect(res.body.guidingQuestions.length).toBeGreaterThan(0);
  });

  it('does not return direct code or answers in hint', async () => {
    vi.spyOn(geminiService, 'generateHint').mockResolvedValue({
      analogy: 'Una analogía pedagógica sin código.',
      guidingQuestions: ['¿Cuál es el primer principio?', '¿Qué consecuencias tiene?'],
    });

    const res = await request(app)
      .post('/api/practice/hard-skill/hint')
      .send({ topicId, challenge: 'Describe el event loop' });

    expect(res.status).toBe(200);
    // The response should NOT contain direct code blocks
    expect(res.body).not.toHaveProperty('code');
    expect(res.body).not.toHaveProperty('solution');
  });
});

describe('AC-3: GET /api/dashboard/summary with ?level filter', () => {
  beforeEach(async () => {
    await Topic.create([
      { title: 'JS Basics', category: 'hard_skill', type: 'theory', level: 'junior', nextReviewAt: new Date(Date.now() - 1000) },
      { title: 'Custom Hooks', category: 'hard_skill', type: 'theory', level: 'mid', nextReviewAt: new Date(Date.now() - 1000) },
      { title: 'Event Loop Senior', category: 'hard_skill', type: 'theory', level: 'senior', nextReviewAt: new Date(Date.now() - 1000) },
    ]);
  });

  it('filters dueTopics by level=junior', async () => {
    const res = await request(app).get('/api/dashboard/summary?level=junior');
    expect(res.status).toBe(200);
    expect(res.body.dueCount).toBe(1);
  });

  it('filters dueTopics by level=mid', async () => {
    const res = await request(app).get('/api/dashboard/summary?level=mid');
    expect(res.status).toBe(200);
    expect(res.body.dueCount).toBe(1);
  });

  it('returns all due topics when no level filter is applied', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.dueCount).toBe(3);
  });
});
