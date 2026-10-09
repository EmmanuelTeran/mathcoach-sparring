import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic } from '../src/models/MathTopic.js';
import { TopicTrack } from '../src/models/TopicTrack.js';

describe('Topics API Integration Tests (GET /api/topics)', () => {
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
    await MathTopic.deleteMany({});
    await TopicTrack.deleteMany({});
  });

  it('GET /api/topics retorna 200 y array vacío si no hay temas', async () => {
    const res = await request(app).get('/api/topics');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('GET /api/topics retorna la lista de temas con sus 3 pistas (tracks) embebidas y ordenadas', async () => {
    const topic1 = await MathTopic.create({
      slug: 'fracciones-algebraicas',
      title: 'Fracciones Algebraicas',
      area: 'algebra',
      source: 'CONAMAT',
      order: 1,
      description: 'Simplificación y operaciones racionales',
    });

    const topic2 = await MathTopic.create({
      slug: 'limites-trigonometricos',
      title: 'Límites Trigonométricos',
      area: 'calculo',
      source: 'Stewart',
      order: 2,
      description: 'Límites notables y continuidad',
    });

    const res = await request(app).get('/api/topics');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);

    // Validar topic 1
    const t1 = res.body.find((t) => t.slug === 'fracciones-algebraicas');
    expect(t1).toBeDefined();
    expect(t1.title).toBe('Fracciones Algebraicas');
    expect(t1.tracks).toBeDefined();
    expect(t1.tracks.length).toBe(3);

    const categories1 = t1.tracks.map((tr) => tr.category);
    expect(categories1).toEqual(['technique', 'application', 'proof']);
    t1.tracks.forEach((track) => {
      expect(track.difficulty).toBe(1);
      expect(track.repetition).toBe(0);
      expect(track.interval).toBe(0);
      expect(track.efactor).toBe(2.5);
      expect(track.dueDate).toBeDefined();
    });

    // Validar topic 2
    const t2 = res.body.find((t) => t.slug === 'limites-trigonometricos');
    expect(t2).toBeDefined();
    expect(t2.tracks.length).toBe(3);
    const categories2 = t2.tracks.map((tr) => tr.category);
    expect(categories2).toEqual(['technique', 'application', 'proof']);
  });
});
