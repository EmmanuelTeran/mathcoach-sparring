import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Variable compartida para inspeccionar llamadas y systemInstruction enviados a Gemini
export const geminiCallHistory = [];

export const mockGenerateContent = vi.fn().mockImplementation(async ({ model, contents, config }) => {
  geminiCallHistory.push({ model, contents, config });

  // Si es llamada del pipeline multimodal matemático:
  if (model === 'gemini-1.5-pro' || (config?.systemInstruction && config.systemInstruction.includes('Profesor de Matemáticas') || config?.systemInstruction?.includes('Catedrático'))) {
    return {
      text: JSON.stringify({
        score: 4,
        feedback_paso_a_paso: 'Paso 1: Planteamiento correcto. Paso 2: Error menor en simplificación de signos.',
        hint: 'Recuerda que (a - b) = -(b - a) antes de simplificar.',
      }),
    };
  }

  // Si el systemInstruction pide evaluar y retornar JSON (hard skill legacy):
  if (config?.responseMimeType === 'application/json' || (config?.systemInstruction && config.systemInstruction.includes('Evaluador'))) {
    return {
      text: JSON.stringify({
        score: 5,
        feedback: 'Excelente dominio conceptual adaptado al nivel evaluado.',
        missingTradeoffs: ['Casos de borde menores'],
        strengths: ['Sintaxis limpia y comprensión de los fundamentos'],
      }),
    };
  }

  // En caso de generación de desafío:
  return {
    text: 'Desafío generado para ' + (contents || ''),
  };
});

// Mockeamos @google/genai usando vi.mock para ejecución offline determinista
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic, Topic } from '../src/models/MathTopic.js';
import { SessionLog } from '../src/models/SessionLog.js';

describe('Practice Hard Skills API Integration Tests', () => {
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

  describe('POST /api/practice/hard-skill/generate', () => {
    it('retorna 400 si no se envía topicId', async () => {
      const res = await request(app).post('/api/practice/hard-skill/generate').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('topicId is required');
    });

    it('retorna 404 si el topicId no existe en la base de datos', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/practice/hard-skill/generate')
        .send({ topicId: randomId });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Topic not found');
    });

    it('genera un desafío técnico adaptado retornando status 200 y el texto del reto', async () => {
      const topic = await Topic.create({
        title: 'Node.js Event Loop & Concurrency',
        problemStatement: 'Explica el funcionamiento de libuv y el event loop.',
        category: 'hard_skill',
        type: 'theory',
        level: 'senior',
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/generate')
        .send({ topicId: topic._id });

      expect(res.status).toBe(200);
      expect(res.body.topicId).toBe(topic._id.toString());
      expect(res.body.title).toBe(topic.title);
      expect(res.body.level).toBe('senior');
      expect(res.body.challenge).toBeDefined();
    });

    it('AC-1: en nivel Junior genera retos pedagógicos enfocados en sintaxis/bases y sin exigencias de Senior', async () => {
      const juniorTopic = await Topic.create({
        title: 'Métodos de Arrays en JS (map, filter, reduce)',
        problemStatement: 'Uso básico de map y filter en colecciones.',
        category: 'hard_skill',
        type: 'theory',
        level: 'junior',
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/generate')
        .send({ topicId: juniorTopic._id });

      expect(res.status).toBe(200);
      expect(res.body.level).toBe('junior');

      // Validar las instrucciones del sistema enviadas a Gemini
      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('Fullstack Junior');
      expect(sysInstruction).toContain('bases cotidianas');
      expect(sysInstruction).toContain('NO hagas preguntas sobre bajo nivel, internals de V8, libuv, concurrencia masiva');
      expect(sysInstruction).not.toContain('entrevistador técnico implacable para roles Fullstack Senior');
    });

    it('AC-1: en nivel Senior genera retos con rigor de arquitectura interna y trade-offs', async () => {
      const seniorTopic = await Topic.create({
        title: 'Libuv Event Loop & Thread Pool Starvation',
        problemStatement: 'Condiciones de carrera y saturación del thread pool.',
        category: 'hard_skill',
        type: 'theory',
        level: 'senior',
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/generate')
        .send({ topicId: seniorTopic._id });

      expect(res.status).toBe(200);
      expect(res.body.level).toBe('senior');

      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('roles Fullstack Senior');
      expect(sysInstruction).toContain('arquitectura interna');
      expect(sysInstruction).toContain('análisis crítico de trade-offs');
    });
  });

  describe('POST /api/practice/hard-skill/evaluate', () => {
    it('retorna 400 si faltan topicId, challenge o userSolution', async () => {
      const res = await request(app)
        .post('/api/practice/hard-skill/evaluate')
        .send({ topicId: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('topicId, challenge, and userSolution are required');
    });

    it('retorna 404 si el topicId no existe', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/practice/hard-skill/evaluate')
        .send({
          topicId: randomId,
          challenge: 'Alguna pregunta',
          userSolution: 'Alguna solución',
        });
      expect(res.status).toBe(404);
    });

    it('AC-1: evalúa con éxito a un perfil Junior sin penalizar por falta de trade-offs de alta concurrencia', async () => {
      const topic = await Topic.create({
        title: 'Async/Await vs Callbacks y Manejo de Errores',
        problemStatement: 'Manejo de errores con async/await y try/catch.',
        category: 'hard_skill',
        type: 'theory',
        level: 'junior',
        srsStage: 0,
        easeFactor: 2.5,
        intervalDays: 0,
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/evaluate')
        .send({
          topicId: topic._id,
          challenge: 'Explica cómo usar try/catch con async/await para manejar errores.',
          userSolution: 'Usamos try/catch alrededor de la llamada con await para atrapar la promesa rechazada de forma legible.',
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(5);

      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('NIVEL JUNIOR');
      expect(sysInstruction).toContain('NO penalices por falta de análisis de arquitectura interna de bajo nivel');
      expect(sysInstruction).not.toContain('nivel Staff/Principal Engineer');
    });

    it('evalúa con éxito la solución, actualiza Topic en Mongo con srsCalculator y guarda SessionLog', async () => {
      const topic = await Topic.create({
        title: 'React Concurrent Mode & Fiber',
        problemStatement: 'Funcionamiento interno de Fiber y renderizado concurrente.',
        category: 'hard_skill',
        type: 'practice',
        level: 'senior',
        srsStage: 0,
        easeFactor: 2.5,
        intervalDays: 0,
        nextReviewAt: new Date(Date.now() - 5000), // vencido
      });

      const res = await request(app)
        .post('/api/practice/hard-skill/evaluate')
        .send({
          topicId: topic._id,
          challenge: 'Explica cómo Fiber interrumpe el rendering y maneja prioridades con useTransition.',
          userSolution: 'Fiber organiza el trabajo en unidades discretas. useTransition marca updates de baja prioridad cediendo el hilo principal.',
        });

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(5);
      expect(res.body.feedback).toBeDefined();
      expect(Array.isArray(res.body.missingTradeoffs)).toBe(true);
      expect(Array.isArray(res.body.strengths)).toBe(true);
      expect(res.body.srsStage).toBe(1);
      expect(res.body.intervalDays).toBe(1);
      expect(new Date(res.body.nextReviewAt).getTime()).toBeGreaterThan(Date.now());
      expect(res.body.sessionLogId).toBeDefined();

      // Verificar que el topic se actualizó en la base de datos
      const updatedTopic = await Topic.findById(topic._id);
      expect(updatedTopic.srsStage).toBe(1);
      expect(updatedTopic.history.length).toBe(1);
      expect(updatedTopic.history[0].score).toBe(5);
      expect(updatedTopic.history[0].userInput).toContain('Fiber organiza');

      // Verificar que se creó el SessionLog correspondiente
      const sessionLog = await SessionLog.findById(res.body.sessionLogId);
      expect(sessionLog).not.toBeNull();
      expect(sessionLog.topicId.toString()).toBe(topic._id.toString());
      expect(sessionLog.score).toBe(5);
    });
  });

  describe('POST /api/evaluate-math (Multimodal Pipeline & SRS SM-2)', () => {
    it('AC-1: retorna 400 Bad Request si falta problemId o está vacío', async () => {
      const res = await request(app)
        .post('/api/evaluate-math')
        .send({ image: 'data:image/jpeg;base64,validbase64string' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('problemId is required');
    });

    it('AC-1: retorna 400 Bad Request si falta image o está vacía', async () => {
      const res = await request(app)
        .post('/api/evaluate-math')
        .send({ problemId: new mongoose.Types.ObjectId().toString(), image: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('image must be a valid base64 string');
    });

    it('AC-1: retorna 404 Not Found si el problemId no existe en MathTopic', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: nonExistentId,
          image: 'data:image/jpeg;base64,mockImageBase64Payload',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Math problem not found');
    });

    it('AC-1: retorna 404 Not Found si el problemId no es un ObjectId válido', async () => {
      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: 'invalid-id-format',
          image: 'data:image/jpeg;base64,mockImageBase64Payload',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Math problem not found');
    });

    it('AC-2, AC-3, AC-4 & AC-5: evalúa con éxito ejercicio Nivel 1 (CONAMAT), usa gemini-1.5-pro, actualiza SRS e historial', async () => {
      const mathProblem = await MathTopic.create({
        title: 'Factorización de Polinomios',
        source: 'CONAMAT',
        level: 1,
        problemStatement: 'Factoriza completamente la expresión: 3x^2 - 12x + 12',
        repetition: 0,
        efactor: 2.5,
        interval: 0,
      });

      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: mathProblem._id.toString(),
          image: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          metadata: {
            level: 1,
            source: 'CONAMAT',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.score).toBe(4);
      expect(res.body.feedback_paso_a_paso).toContain('Planteamiento correcto');
      expect(res.body.hint).toContain('Recuerda que (a - b)');
      expect(res.body.srs).toBeDefined();
      expect(res.body.srs.repetition).toBe(1);
      expect(res.body.srs.interval).toBe(1);
      expect(res.body.srs.efactor).toBeGreaterThanOrEqual(1.3);
      expect(res.body.srs.dueDate).toBeDefined();

      // Verificar que se invocó gemini-1.5-pro con system prompt de Nivel 1
      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      expect(lastCall.model).toBe('gemini-1.5-pro');
      expect(lastCall.config.systemInstruction).toContain('Nivel 1 - Computacional / Mecánico');
      expect(lastCall.config.responseMimeType).toBe('application/json');

      // Verificar persistencia atómica en MongoDB
      const updated = await MathTopic.findById(mathProblem._id);
      expect(updated.repetition).toBe(1);
      expect(updated.interval).toBe(1);
      expect(updated.history.length).toBe(1);
      expect(updated.history[0].score).toBe(4);
      expect(updated.history[0].feedback_paso_a_paso).toContain('Planteamiento correcto');
      expect(updated.history[0].hint).toContain('Recuerda que (a - b)');
      expect(updated.history[0].imageUrl).toBeDefined();
    });

    it('AC-2: evalúa con prompt estratificado de Cálculo en Nivel 2 (Stewart)', async () => {
      const stewartProblem = await MathTopic.create({
        title: 'Optimización y Derivadas',
        source: 'Stewart',
        level: 2,
        problemStatement: 'Halla las dimensiones del cilindro de volumen máximo inscrito en una esfera de radio R.',
        repetition: 1,
        efactor: 2.5,
        interval: 1,
      });

      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: stewartProblem._id.toString(),
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        });

      expect(res.status).toBe(200);
      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      expect(lastCall.config.systemInstruction).toContain('Nivel 2 - Modelado y Aplicación');
    });

    it('AC-2: evalúa con prompt de Rigor Formal y Demostraciones en Nivel 3 (Spivak)', async () => {
      const spivakProblem = await MathTopic.create({
        title: 'Demostración Épsilon-Delta',
        source: 'Spivak',
        level: 3,
        problemStatement: 'Demuestra formalmente usando la definición épsilon-delta que lim_{x->2} (3x - 1) = 5.',
        repetition: 0,
        efactor: 2.5,
        interval: 0,
      });

      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: spivakProblem._id.toString(),
          image: 'mockSpivakBase64Photo',
        });

      expect(res.status).toBe(200);
      const lastCall = geminiCallHistory[geminiCallHistory.length - 1];
      expect(lastCall.config.systemInstruction).toContain('Nivel 3 - Spivak / Rigor Axiomático');
    });

    it('AC-6: maneja fallo de la API de Gemini retornando 502 Bad Gateway sin crashear', async () => {
      const problem = await MathTopic.create({
        title: 'Problema con error de red',
        source: 'CONAMAT',
        level: 1,
        problemStatement: 'x + 1 = 2',
      });

      // Forzar fallo de API temporalmente
      mockGenerateContent.mockRejectedValueOnce(new Error('Quota exceeded or network timeout'));

      const res = await request(app)
        .post('/api/evaluate-math')
        .send({
          problemId: problem._id.toString(),
          image: 'validMockBase64',
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe('AI evaluation service unavailable');
      expect(res.body.details).toContain('Quota exceeded');
    });
  });
});

