import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic } from '../src/models/MathTopic.js';
import { Exercise } from '../src/models/Exercise.js';
import { TopicTrack } from '../src/models/TopicTrack.js';
import { Round } from '../src/models/Round.js';
import { ensureTracksForTopic } from '../src/services/trackService.js';

describe('MATH-US-08 Domain Models and Services', () => {
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
    await Exercise.deleteMany({});
    await TopicTrack.deleteMany({});
    await Round.deleteMany({});
  });

  describe('MathTopic Model', () => {
    it('crea exitosamente un tema con campos válidos y slug en minúsculas', async () => {
      const topic = await MathTopic.create({
        slug: 'FACTORIZACION-POLINOMIOS',
        title: 'Factorización de Polinomios',
        area: 'algebra',
        source: 'CONAMAT',
        order: 1,
        description: 'Casos fundamentales de factorización.',
      });

      expect(topic._id).toBeDefined();
      expect(topic.slug).toBe('factorizacion-polinomios');
      expect(topic.title).toBe('Factorización de Polinomios');
      expect(topic.area).toBe('algebra');
      expect(topic.order).toBe(1);
    });

    it('rechaza áreas inválidas fuera de las permitidas', async () => {
      await expect(
        MathTopic.create({
          slug: 'tema-invalido',
          title: 'Tema Inválido',
          area: 'astronomia', // no está en enum
        })
      ).rejects.toThrow();
    });

    it('rechaza si falta slug o title', async () => {
      await expect(
        MathTopic.create({
          title: 'Sin Slug',
          area: 'algebra',
        })
      ).rejects.toThrow();

      await expect(
        MathTopic.create({
          slug: 'sin-titulo',
          area: 'algebra',
        })
      ).rejects.toThrow();
    });

    it('falla por duplicidad de slug', async () => {
      await MathTopic.create({
        slug: 'derivadas-basicas',
        title: 'Derivadas Básicas 1',
        area: 'calculo',
      });

      await expect(
        MathTopic.create({
          slug: 'derivadas-basicas',
          title: 'Derivadas Básicas 2',
          area: 'calculo',
        })
      ).rejects.toThrow();
    });
  });

  describe('Exercise Model', () => {
    let testTopic;

    beforeEach(async () => {
      testTopic = await MathTopic.create({
        slug: 'limites',
        title: 'Límites',
        area: 'calculo',
      });
    });

    it('crea exitosamente un ejercicio asociado a un tema', async () => {
      const exercise = await Exercise.create({
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        order: 1,
        statement: 'Calcula $\\lim_{x \\to 0} \\frac{\\sin(x)}{x}$',
        referenceSolution: 'El límite notable estándar es 1.',
        expertMinutes: 3,
        externalKey: 'lim-notable-tech-d1-01',
      });

      expect(exercise._id).toBeDefined();
      expect(exercise.expertMinutes).toBe(3);
      expect(exercise.timesServed).toBe(0);
      expect(exercise.lastServedAt).toBeNull();
    });

    it('rechaza category no permitida', async () => {
      await expect(
        Exercise.create({
          topicId: testTopic._id,
          category: 'invalid_category',
          difficulty: 1,
          order: 1,
          statement: 'Ejercicio inválido',
          expertMinutes: 2,
          externalKey: 'ex-inv-01',
        })
      ).rejects.toThrow();
    });

    it('rechaza difficulty fuera del rango [1, 2, 3]', async () => {
      await expect(
        Exercise.create({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 4,
          order: 1,
          statement: 'Ejercicio dificultad 4',
          expertMinutes: 2,
          externalKey: 'ex-inv-diff-4',
        })
      ).rejects.toThrow();

      await expect(
        Exercise.create({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 0,
          order: 1,
          statement: 'Ejercicio dificultad 0',
          expertMinutes: 2,
          externalKey: 'ex-inv-diff-0',
        })
      ).rejects.toThrow();
    });

    it('rechaza expertMinutes <= 0 o no numérico', async () => {
      await expect(
        Exercise.create({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: 1,
          statement: 'Minutos cero',
          expertMinutes: 0,
          externalKey: 'ex-zero-min',
        })
      ).rejects.toThrow();

      await expect(
        Exercise.create({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: 1,
          statement: 'Minutos negativos',
          expertMinutes: -5,
          externalKey: 'ex-neg-min',
        })
      ).rejects.toThrow();
    });

    it('rechaza si falta statement o externalKey', async () => {
      await expect(
        Exercise.create({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: 1,
          expertMinutes: 2,
          externalKey: 'ex-no-stmt',
        })
      ).rejects.toThrow();

      await expect(
        Exercise.create({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          order: 1,
          statement: 'Sin external key',
          expertMinutes: 2,
        })
      ).rejects.toThrow();
    });

    it('falla por duplicidad de externalKey', async () => {
      await Exercise.create({
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        order: 1,
        statement: 'Statement 1',
        expertMinutes: 2,
        externalKey: 'duplicate-key-01',
      });

      await expect(
        Exercise.create({
          topicId: testTopic._id,
          category: 'application',
          difficulty: 2,
          order: 2,
          statement: 'Statement 2',
          expertMinutes: 5,
          externalKey: 'duplicate-key-01',
        })
      ).rejects.toThrow();
    });
  });

  describe('TopicTrack Model', () => {
    let testTopic;

    beforeEach(async () => {
      testTopic = await MathTopic.create({
        slug: 'geometria-analitica',
        title: 'Geometría Analítica',
        area: 'geometria',
      });
    });

    it('crea exitosamente una pista con defaults de SM-2 y dificultad 1', async () => {
      const track = await TopicTrack.create({
        topicId: testTopic._id,
        category: 'technique',
      });

      expect(track._id).toBeDefined();
      expect(track.difficulty).toBe(1);
      expect(track.repetition).toBe(0);
      expect(track.interval).toBe(0);
      expect(track.efactor).toBe(2.5);
      expect(track.lastRoundScore).toBeNull();
      expect(track.roundsCompleted).toBe(0);
      expect(track.dueDate).toBeDefined();
    });

    it('rechaza categoría o dificultad inválida', async () => {
      await expect(
        TopicTrack.create({
          topicId: testTopic._id,
          category: 'magic',
          difficulty: 1,
        })
      ).rejects.toThrow();

      await expect(
        TopicTrack.create({
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 5,
        })
      ).rejects.toThrow();
    });

    it('impide duplicidad de pista para el mismo par topicId + category', async () => {
      await TopicTrack.create({
        topicId: testTopic._id,
        category: 'technique',
      });

      await expect(
        TopicTrack.create({
          topicId: testTopic._id,
          category: 'technique',
        })
      ).rejects.toThrow();
    });
  });

  describe('Round Model', () => {
    let testTopic;
    let testTrack;
    let testExercise;

    beforeEach(async () => {
      testTopic = await MathTopic.create({
        slug: 'trig-identidades',
        title: 'Identidades Trigonométricas',
        area: 'trigonometria',
      });

      testTrack = await TopicTrack.create({
        topicId: testTopic._id,
        category: 'technique',
      });

      testExercise = await Exercise.create({
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        order: 1,
        statement: 'Demuestra $\\sin^2(x) + \\cos^2(x) = 1$',
        expertMinutes: 4,
        externalKey: 'trig-id-tech-01',
      });
    });

    it('crea exitosamente una ronda con snapshots en status pending', async () => {
      const round = await Round.create({
        trackId: testTrack._id,
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        exercises: [
          {
            exerciseId: testExercise._id,
            order: 1,
            statement: testExercise.statement,
            expertMinutes: testExercise.expertMinutes,
          },
        ],
        totalExpertMinutes: 4,
        status: 'pending',
      });

      expect(round._id).toBeDefined();
      expect(round.status).toBe('pending');
      expect(round.exercises.length).toBe(1);
      expect(round.results.length).toBe(0);
      expect(round.promoted).toBe(false);
    });

    it('rechaza si exercises está vacío', async () => {
      await expect(
        Round.create({
          trackId: testTrack._id,
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          exercises: [],
          totalExpertMinutes: 0,
        })
      ).rejects.toThrow();
    });

    it('rechaza si status no es pending o evaluated', async () => {
      await expect(
        Round.create({
          trackId: testTrack._id,
          topicId: testTopic._id,
          category: 'technique',
          difficulty: 1,
          exercises: [
            {
              exerciseId: testExercise._id,
              order: 1,
              statement: testExercise.statement,
              expertMinutes: 4,
            },
          ],
          totalExpertMinutes: 4,
          status: 'cancelled',
        })
      ).rejects.toThrow();
    });

    it('persiste resultados de evaluación válidos con scores en rango 0-5', async () => {
      const round = await Round.create({
        trackId: testTrack._id,
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        exercises: [
          {
            exerciseId: testExercise._id,
            order: 1,
            statement: testExercise.statement,
            expertMinutes: 4,
          },
        ],
        totalExpertMinutes: 4,
        status: 'evaluated',
        results: [
          {
            exerciseId: testExercise._id,
            score: 5,
            feedback_paso_a_paso: 'Demostración impecable',
            hint: 'Excelente',
          },
        ],
        roundScore: 5,
        passRate: 1,
        promoted: true,
        previousDifficulty: 1,
        newDifficulty: 2,
        evaluatedAt: new Date(),
      });

      expect(round.status).toBe('evaluated');
      expect(round.roundScore).toBe(5);
      expect(round.promoted).toBe(true);
      expect(round.results[0].score).toBe(5);
    });
  });

  describe('ensureTracksForTopic Service', () => {
    let testTopic;

    beforeEach(async () => {
      testTopic = await MathTopic.create({
        slug: 'analisis-real',
        title: 'Análisis Real',
        area: 'analisis',
      });
    });

    it('genera exactamente las 3 pistas (technique, application, proof) con dificultad 1', async () => {
      const tracks = await ensureTracksForTopic(testTopic._id);

      expect(tracks.length).toBe(3);
      const categories = tracks.map((t) => t.category).sort();
      expect(categories).toEqual(['application', 'proof', 'technique']);

      tracks.forEach((track) => {
        expect(track.topicId.toString()).toBe(testTopic._id.toString());
        expect(track.difficulty).toBe(1);
        expect(track.repetition).toBe(0);
        expect(track.interval).toBe(0);
        expect(track.efactor).toBe(2.5);
        expect(track.dueDate).toBeDefined();
      });
    });

    it('es idempotente: múltiples llamadas no duplican pistas ni resetean el progreso', async () => {
      // Primera llamada
      await ensureTracksForTopic(testTopic._id);

      // Modificamos una pista simulando progreso
      await TopicTrack.updateOne(
        { topicId: testTopic._id, category: 'technique' },
        { difficulty: 2, repetition: 3, interval: 15, efactor: 2.7 }
      );

      // Segunda llamada
      const secondCallTracks = await ensureTracksForTopic(testTopic._id);
      expect(secondCallTracks.length).toBe(3);

      const allTracksInDb = await TopicTrack.find({ topicId: testTopic._id });
      expect(allTracksInDb.length).toBe(3);

      const techTrack = allTracksInDb.find((t) => t.category === 'technique');
      expect(techTrack.difficulty).toBe(2);
      expect(techTrack.repetition).toBe(3);
      expect(techTrack.interval).toBe(15);
      expect(techTrack.efactor).toBe(2.7);
    });
  });
});
