import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic } from '../src/models/MathTopic.js';

describe('MathTopic Model & SRS Fields', () => {
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
  });

  it('crea un MathTopic con metadatos matemáticos y valores SRS por defecto', async () => {
    const topic = await MathTopic.create({
      title: 'Factorización de Trinomio Cuadrado Perfecto',
      source: 'CONAMAT',
      level: 1,
      problemStatement: 'Factoriza la siguiente expresión algebraica: 4x^2 + 12x + 9',
    });

    expect(topic._id).toBeDefined();
    expect(topic.title).toBe('Factorización de Trinomio Cuadrado Perfecto');
    expect(topic.source).toBe('CONAMAT');
    expect(topic.level).toBe(1);
    expect(topic.problemStatement).toBe('Factoriza la siguiente expresión algebraica: 4x^2 + 12x + 9');

    // Campos SRS por defecto
    expect(topic.repetition).toBe(0);
    expect(topic.interval).toBe(0);
    expect(topic.efactor).toBe(2.5);
    expect(topic.dueDate).toBeInstanceOf(Date);

    // Compatibilidad con aliases SM-2
    expect(topic.srsStage).toBe(0);
    expect(topic.intervalDays).toBe(0);
    expect(topic.easeFactor).toBe(2.5);
    expect(topic.nextReviewAt).toBeInstanceOf(Date);
  });

  it('acepta los 3 niveles matemáticos válidos (1: Computacional, 2: Aplicación, 3: Demostración)', async () => {
    for (const level of [1, 2, 3]) {
      const topic = await MathTopic.create({
        title: `Ejercicio Nivel ${level}`,
        source: 'CONAMAT',
        level,
        problemStatement: `Enunciado para nivel ${level}`,
      });
      expect(topic.level).toBe(level);
    }
  });

  it('rechaza niveles inválidos fuera de 1, 2 o 3', async () => {
    await expect(
      MathTopic.create({
        title: 'Nivel Inválido',
        level: 4,
        problemStatement: 'Invalido',
      })
    ).rejects.toThrow();

    await expect(
      MathTopic.create({
        title: 'Nivel Cero',
        level: 0,
        problemStatement: 'Invalido',
      })
    ).rejects.toThrow();
  });

  it('permite registrar historial de revisiones con score de 0 a 5 y feedback_paso_a_paso', async () => {
    const topic = await MathTopic.create({
      title: 'Derivada por Definición',
      source: 'Stewart Cálculo',
      level: 3,
      problemStatement: 'Demuestra que la derivada de f(x) = x^2 es 2x usando la definición formal del límite.',
    });

    topic.history.push({
      score: 5,
      feedback_paso_a_paso: '1. Planteamiento de límite correcto. 2. Desarrollo algebraico sin fallas. 3. Conclusión formal impecable.',
      hint: 'Excelente desarrollo axiomático.',
      imageUrl: 'data:image/jpeg;base64,mockImage',
    });

    await topic.save();

    const updated = await MathTopic.findById(topic._id);
    expect(updated.history.length).toBe(1);
    expect(updated.history[0].score).toBe(5);
    expect(updated.history[0].feedback_paso_a_paso).toContain('Planteamiento de límite correcto');
    expect(updated.history[0].hint).toBe('Excelente desarrollo axiomático.');
  });

  it('permite sincronizar campos SRS mediante los aliases', async () => {
    const topic = new MathTopic({
      title: 'Integrales por Partes',
      source: 'Spivak',
      level: 2,
      problemStatement: 'Calcula integral de x * e^x dx',
      srsStage: 2,
      easeFactor: 2.6,
      intervalDays: 6,
    });

    expect(topic.repetition).toBe(2);
    expect(topic.efactor).toBe(2.6);
    expect(topic.interval).toBe(6);
  });
});
