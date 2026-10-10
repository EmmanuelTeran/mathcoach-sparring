import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic } from '../src/models/MathTopic.js';
import { TopicTrack } from '../src/models/TopicTrack.js';
import { Exercise } from '../src/models/Exercise.js';
import { Round } from '../src/models/Round.js';
import * as geminiService from '../src/services/geminiService.js';

describe('Round Evaluation Integration Tests (POST /api/rounds/:id/evaluate)', () => {
  let mongoServer;
  let testTopic;
  let testTrack;
  let testExercises;
  let testRound;

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
    vi.restoreAllMocks();
    await Round.deleteMany({});
    await Exercise.deleteMany({});
    await TopicTrack.deleteMany({});
    await MathTopic.deleteMany({});

    testTopic = await MathTopic.create({
      slug: 'algebra-basica',
      title: 'Álgebra Básica',
      area: 'algebra',
      source: 'CONAMAT',
      order: 1,
      description: 'Fundamentos de álgebra',
    });

    testTrack = await TopicTrack.create({
      topicId: testTopic._id,
      category: 'technique',
      difficulty: 1,
      repetition: 0,
      interval: 0,
      efactor: 2.5,
      dueDate: new Date(),
      lastRoundScore: null,
      roundsCompleted: 0,
    });

    testExercises = await Exercise.create([
      {
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        order: 1,
        statement: 'Simplifica: $$\\frac{x^2 - 4}{x - 2}$$',
        referenceSolution: 'Factorizar como $(x-2)(x+2)$ y cancelar $x-2$ para $x \\neq 2$, obteniendo $x+2$.',
        expertMinutes: 3,
        source: 'CONAMAT',
        externalKey: 'alg-eval-01',
      },
      {
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        order: 2,
        statement: 'Factoriza: $$x^2 + 5x + 6$$',
        referenceSolution: 'Buscar dos números que sumados den 5 y multiplicados 6: $(x+2)(x+3)$.',
        expertMinutes: 4,
        source: 'CONAMAT',
        externalKey: 'alg-eval-02',
      },
      {
        topicId: testTopic._id,
        category: 'technique',
        difficulty: 1,
        order: 3,
        statement: 'Resuelve: $$2x + 4 = 10$$',
        referenceSolution: '$2x = 6 \\implies x = 3$.',
        expertMinutes: 3,
        source: 'CONAMAT',
        externalKey: 'alg-eval-03',
      },
    ]);

    testRound = await Round.create({
      trackId: testTrack._id,
      topicId: testTopic._id,
      category: 'technique',
      difficulty: 1,
      exercises: testExercises.map((e, idx) => ({
        exerciseId: e._id,
        order: idx + 1,
        statement: e.statement,
        expertMinutes: e.expertMinutes,
      })),
      totalExpertMinutes: 10,
      status: 'pending',
    });
  });

  describe('AC-1: Validaciones de Entrada y Manejo de Errores HTTP', () => {
    it('retorna 400 Bad Request si :id no es un ObjectId válido', async () => {
      const res = await request(app)
        .post('/api/rounds/invalid-round-id/evaluate')
        .send({ images: ['data:image/jpeg;base64,validbase64string'] });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid round ID/i);
    });

    it('retorna 400 Bad Request si images falta o no es un array', async () => {
      const res1 = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({});

      expect(res1.status).toBe(400);
      expect(res1.body.error).toMatch(/images must be an array/i);

      const res2 = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: 'not-an-array' });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toMatch(/images must be an array/i);
    });

    it('retorna 400 Bad Request si images tiene longitud 0 o mayor a 6', async () => {
      const resEmpty = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: [] });

      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.error).toMatch(/images must be an array of 1 to 6/i);

      const resTooMany = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({
          images: [
            'base64-1',
            'base64-2',
            'base64-3',
            'base64-4',
            'base64-5',
            'base64-6',
            'base64-7',
          ],
        });

      expect(resTooMany.status).toBe(400);
      expect(resTooMany.body.error).toMatch(/images must be an array of 1 to 6/i);
    });

    it('retorna 400 Bad Request si alguna imagen está vacía o no es string', async () => {
      const resEmptyString = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: ['   '] });

      expect(resEmptyString.status).toBe(400);
      expect(resEmptyString.body.error).toMatch(/Invalid image data/i);

      const resInvalidType = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: [12345] });

      expect(resInvalidType.status).toBe(400);
      expect(resInvalidType.body.error).toMatch(/Invalid image data/i);
    });

    it('retorna 404 Not Found si la ronda no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/rounds/${nonExistentId}/evaluate`)
        .send({ images: ['data:image/jpeg;base64,validbase64string'] });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Round not found/i);
    });

    it('retorna 409 Conflict si la ronda ya tiene status === "evaluated"', async () => {
      testRound.status = 'evaluated';
      await testRound.save();

      const res = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: ['data:image/jpeg;base64,validbase64string'] });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Round already evaluated/i);
    });

    it('retorna 422 Unprocessable Entity con array missing cuando falta algún ejercicio en las fotos y no muta la BD', async () => {
      vi.spyOn(geminiService, 'evaluateRoundSolutions').mockResolvedValueOnce({
        exercises: [
          { order: 1, found: true, score: 5, feedback_paso_a_paso: 'Bien', hint: '' },
          { order: 2, found: false, score: 0, feedback_paso_a_paso: 'No se encontró', hint: '' },
          { order: 3, found: true, score: 4, feedback_paso_a_paso: 'Bien', hint: '' },
        ],
        overall_feedback: 'Falta un ejercicio en las fotos enviadas.',
      });

      const res = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: ['data:image/jpeg;base64,page1', 'data:image/jpeg;base64,page2'] });

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('exercises_not_found');
      expect(res.body.missing).toEqual([2]);

      // Verificar que ni Round ni TopicTrack mutaron
      const dbRound = await Round.findById(testRound._id);
      expect(dbRound.status).toBe('pending');
      expect(dbRound.results).toHaveLength(0);
      expect(dbRound.roundScore).toBeNull();

      const dbTrack = await TopicTrack.findById(testTrack._id);
      expect(dbTrack.difficulty).toBe(1);
      expect(dbTrack.roundsCompleted).toBe(0);
    });

    it('retorna 502 Bad Gateway cuando Gemini falla o rechaza la llamada', async () => {
      vi.spyOn(geminiService, 'evaluateRoundSolutions').mockRejectedValueOnce(
        new Error('Gemini API 503 Overloaded')
      );

      const res = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: ['data:image/jpeg;base64,validstring'] });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe('AI evaluation service unavailable');
      expect(res.body.details).toMatch(/Gemini API 503 Overloaded/i);

      // La ronda sigue intacta
      const dbRound = await Round.findById(testRound._id);
      expect(dbRound.status).toBe('pending');
    });
  });

  describe('AC-2 & AC-3: Lógica de Negocio y Progresión Adaptativa con Inferencia Exitosa', () => {
    it('Caso 1 - Promoción Adaptativa: dificultad 1 -> 2, repetition = 1 e intervalo = 3 días', async () => {
      // Scores [5, 4, 4] -> sum = 13, avg = 4.333 -> roundScore = 4.3, passRate = 3/3 = 1.0 (ambos >= umbrales)
      vi.spyOn(geminiService, 'evaluateRoundSolutions').mockResolvedValueOnce({
        exercises: [
          { order: 1, found: true, score: 5, feedback_paso_a_paso: 'Paso 1: Perfecto', hint: 'Excelente' },
          { order: 2, found: true, score: 4, feedback_paso_a_paso: 'Paso 1: Detalle menor', hint: 'Atento a los signos' },
          { order: 3, found: true, score: 4, feedback_paso_a_paso: 'Paso 1: Muy bien', hint: 'Sigue así' },
        ],
        overall_feedback: 'Dominio notable de la técnica.',
      });

      const res = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: ['data:image/jpeg;base64,fotopagina1'] });

      expect(res.status).toBe(200);
      expect(res.body.roundScore).toBe(4.3);
      expect(res.body.passRate).toBe(1.0);
      expect(res.body.promoted).toBe(true);
      expect(res.body.previousDifficulty).toBe(1);
      expect(res.body.newDifficulty).toBe(2);
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].score).toBe(5);
      expect(res.body.results[0].order).toBe(1);
      expect(res.body.results[0].exerciseId).toBe(testExercises[0]._id.toString());
      expect(res.body.overall_feedback).toBe('Dominio notable de la técnica.');

      // Verificar persistencia en MongoDB para Round
      const updatedRound = await Round.findById(testRound._id);
      expect(updatedRound.status).toBe('evaluated');
      expect(updatedRound.roundScore).toBe(4.3);
      expect(updatedRound.passRate).toBe(1.0);
      expect(updatedRound.promoted).toBe(true);
      expect(updatedRound.previousDifficulty).toBe(1);
      expect(updatedRound.newDifficulty).toBe(2);
      expect(updatedRound.results).toHaveLength(3);
      expect(updatedRound.evaluatedAt).toBeInstanceOf(Date);

      // Verificar persistencia en MongoDB para TopicTrack
      const updatedTrack = await TopicTrack.findById(testTrack._id);
      expect(updatedTrack.difficulty).toBe(2);
      expect(updatedTrack.repetition).toBe(1);
      expect(updatedTrack.interval).toBe(3); // PROMOTION_INTERVAL_DAYS
      expect(updatedTrack.lastRoundScore).toBe(4.3);
      expect(updatedTrack.roundsCompleted).toBe(1);
      expect(new Date(res.body.nextReviewAt).getTime()).toBe(new Date(updatedTrack.dueDate).getTime());
    });

    it('Caso 2 - Permanencia Aprobada: dificultad 1 se mantiene, progresión SM-2 estándar', async () => {
      // Scores [3, 3, 4] -> sum = 10, avg = 3.333 -> roundScore = 3.3, passRate = 1.0 (no llega a 4.0 de score)
      vi.spyOn(geminiService, 'evaluateRoundSolutions').mockResolvedValueOnce({
        exercises: [
          { order: 1, found: true, score: 3, feedback_paso_a_paso: 'Aprobado con dudas', hint: 'Revisa' },
          { order: 2, found: true, score: 3, feedback_paso_a_paso: 'Aprobado con dudas', hint: 'Revisa' },
          { order: 3, found: true, score: 4, feedback_paso_a_paso: 'Bien planteado', hint: 'Bien' },
        ],
        overall_feedback: 'Buen esfuerzo, requiere afianzar.',
      });

      const res = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: ['data:image/jpeg;base64,fotopagina1'] });

      expect(res.status).toBe(200);
      expect(res.body.roundScore).toBe(3.3);
      expect(res.body.passRate).toBe(1.0);
      expect(res.body.promoted).toBe(false);
      expect(res.body.previousDifficulty).toBe(1);
      expect(res.body.newDifficulty).toBe(1);

      // Verificar persistencia en MongoDB
      const updatedTrack = await TopicTrack.findById(testTrack._id);
      expect(updatedTrack.difficulty).toBe(1);
      expect(updatedTrack.roundsCompleted).toBe(1);
      expect(updatedTrack.lastRoundScore).toBe(3.3);
      // SM-2 con repetition previa 0 y score redondeado a 3 -> repetition 1, interval 3 días
      expect(updatedTrack.repetition).toBe(1);
      expect(updatedTrack.interval).toBe(3);
    });

    it('Caso 3 - Fallo de Ronda: roundScore < 3.0 reinicia SM-2 (repetition = 0, intervalo = 1)', async () => {
      testTrack.difficulty = 2;
      testTrack.repetition = 3;
      testTrack.interval = 12;
      await testTrack.save();

      testRound.difficulty = 2;
      await testRound.save();

      // Scores [1, 2, 2] -> sum = 5, avg = 1.666 -> roundScore = 1.7, passRate = 0.0
      vi.spyOn(geminiService, 'evaluateRoundSolutions').mockResolvedValueOnce({
        exercises: [
          { order: 1, found: true, score: 1, feedback_paso_a_paso: 'Error de planteamiento', hint: 'Reestudiar' },
          { order: 2, found: true, score: 2, feedback_paso_a_paso: 'Planteamiento incompleto', hint: 'Reestudiar' },
          { order: 3, found: true, score: 2, feedback_paso_a_paso: 'Planteamiento incompleto', hint: 'Reestudiar' },
        ],
        overall_feedback: 'Fallo en la ronda, repaso necesario mañana.',
      });

      const res = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: ['data:image/jpeg;base64,fotopagina1'] });

      expect(res.status).toBe(200);
      expect(res.body.roundScore).toBe(1.7);
      expect(res.body.passRate).toBe(0.0);
      expect(res.body.promoted).toBe(false);
      expect(res.body.newDifficulty).toBe(2); // Sin degradación

      const updatedTrack = await TopicTrack.findById(testTrack._id);
      expect(updatedTrack.difficulty).toBe(2); // Dificultad se mantiene intacta
      expect(updatedTrack.repetition).toBe(0); // Reinicio SM-2
      expect(updatedTrack.interval).toBe(1); // 1 día de intervalo
      expect(updatedTrack.roundsCompleted).toBe(1);
      expect(updatedTrack.lastRoundScore).toBe(1.7);
    });

    it('Caso 4 - Dificultad 3 con Alto Rendimiento: no se promueve más allá de nivel 3 (tope)', async () => {
      testTrack.difficulty = 3;
      testTrack.repetition = 2;
      testTrack.interval = 6;
      await testTrack.save();

      testRound.difficulty = 3;
      await testRound.save();

      // Scores [5, 5, 5] -> roundScore = 5.0, passRate = 1.0
      vi.spyOn(geminiService, 'evaluateRoundSolutions').mockResolvedValueOnce({
        exercises: [
          { order: 1, found: true, score: 5, feedback_paso_a_paso: 'Impecable', hint: '' },
          { order: 2, found: true, score: 5, feedback_paso_a_paso: 'Impecable', hint: '' },
          { order: 3, found: true, score: 5, feedback_paso_a_paso: 'Impecable', hint: '' },
        ],
        overall_feedback: 'Maestría absoluta en Dificultad 3.',
      });

      const res = await request(app)
        .post(`/api/rounds/${testRound._id}/evaluate`)
        .send({ images: ['data:image/jpeg;base64,fotopagina1'] });

      expect(res.status).toBe(200);
      expect(res.body.roundScore).toBe(5.0);
      expect(res.body.promoted).toBe(false); // No puede ascender a 4
      expect(res.body.newDifficulty).toBe(3);

      const updatedTrack = await TopicTrack.findById(testTrack._id);
      expect(updatedTrack.difficulty).toBe(3);
      expect(updatedTrack.repetition).toBe(3); // SM-2 progresa normalmente
      expect(updatedTrack.interval).toBeGreaterThan(6);
    });
  });

  describe('AC-4: Certificación de Eliminación de la Ruta Legada', () => {
    it('verifica que POST /api/evaluate-math responde 404 Not Found', async () => {
      const res1 = await request(app)
        .post('/api/evaluate-math')
        .send({ problemId: testTopic._id, image: 'somebase64' });

      expect(res1.status).toBe(404);

      const res2 = await request(app)
        .post('/api/practice/evaluate-math')
        .send({ problemId: testTopic._id, image: 'somebase64' });

      expect(res2.status).toBe(404);
    });
  });
});
