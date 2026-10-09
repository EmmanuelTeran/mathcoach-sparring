import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export const geminiSoftSkillCallHistory = [];

// Mockeamos @google/genai usando vi.mock para ejecución offline y determinista
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockImplementation(async ({ contents, config }) => {
          geminiSoftSkillCallHistory.push({ contents, config });
          const sys = config?.systemInstruction || '';

          // 1. Veredicto final (evaluación)
          if (sys.includes('Evaluador')) {
            return {
              text: JSON.stringify({
                score: 4,
                feedback: sys.includes('Junior') || sys.includes('Pedagógico')
                  ? 'Excelente comunicación en la interacción cotidiana de equipo. Estructuraste tu mensaje con claridad.'
                  : 'Buena articulación del balance entre costo de inactividad vs inversión en arquitectura resiliente.',
                businessClarity: 'Tradujo efectivamente el concepto a términos claros.',
                tradeOffDefense: 'Defendió correctamente su postura técnica.',
                assertivenessScore: 4,
                missingTradeoffs: ['No mencionó opciones intermedias.'],
                strengths: ['Excelente actitud colaborativa.', 'Enfoque centrado en la solución.'],
              }),
            };
          }

          // 2. Escenario inicial (start)
          if (sys.includes('actor de rol') || sys.includes('stakeholder')) {
            return {
              text: JSON.stringify({
                scenario: sys.includes('cotidiana')
                  ? 'En la daily matutina, el equipo necesita saber tu progreso en el ticket.'
                  : 'El cliente quiere recortar costos y eliminar la capa de redundancia.',
                initialQuestion: sys.includes('cotidiana')
                  ? 'Hola! ¿Podrías darme un resumen claro de tu estado, qué investigaste y si tienes algún bloqueo?'
                  : '¿Por qué necesitamos invertir tanto tiempo y dinero en alta disponibilidad si nuestro tráfico actual es bajo?',
              }),
            };
          }

          // 3. Réplica intermedia escéptica
          return {
            text: 'Eso suena razonable, pero ¿cómo planeas verificar que esta solución no genere efectos secundarios?',
          };
        }),
      },
    })),
  };
});

import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { Topic } from '../src/models/Topic.js';
import { SessionLog } from '../src/models/SessionLog.js';

describe('Soft Skill Sparring API Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    process.env.GEMINI_API_KEY = 'mock-soft-skill-key';
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
    geminiSoftSkillCallHistory.length = 0;
    await Topic.deleteMany({});
    await SessionLog.deleteMany({});
  });

  describe('POST /api/practice/soft-skill/start', () => {
    it('retorna 400 si no se envía topicId', async () => {
      const res = await request(app).post('/api/practice/soft-skill/start').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('topicId is required');
    });

    it('retorna 404 si el topicId no existe', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/practice/soft-skill/start')
        .send({ topicId: randomId });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Topic not found');
    });

    it('AC-2: inicia escenario para Junior con rol cercano (peer/PM) y prompt sin exigencias Senior de C-Level/ROI', async () => {
      const topic = await Topic.create({
        title: 'Daily Standup: Estructura Qué Hice, Qué Haré y Bloqueos',
        category: 'soft_skill',
        type: 'practice',
        level: 'junior',
      });

      const res = await request(app)
        .post('/api/practice/soft-skill/start')
        .send({ topicId: topic._id });

      expect(res.status).toBe(200);
      expect(res.body.topicId).toBe(topic._id.toString());
      expect(res.body.level).toBe('junior');
      expect(res.body.role).toBeDefined();
      expect(res.body.roleDescription).toBeDefined();
      expect(res.body.avatar).toBeDefined();
      expect(res.body.scenario).toBeDefined();
      expect(res.body.initialQuestion).toBeDefined();

      const lastCall = geminiSoftSkillCallHistory[geminiSoftSkillCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('cotidiana de equipo');
      expect(sysInstruction).toContain('nivel Junior');
      expect(sysInstruction).toContain('NO exijas visión estratégica de negocio, métricas financieras de ROI');
      expect(sysInstruction).not.toContain('stakeholder ejecutivo o cliente corporativo');
    });

    it('AC-2: inicia escenario para Senior con rol C-Level/Corporativo y exigencia de arquitectura/costos', async () => {
      const topic = await Topic.create({
        title: 'Defensa de Trade-Offs ante Stakeholders en Arquitectura de Microservicios',
        category: 'soft_skill',
        type: 'practice',
        level: 'senior',
      });

      const res = await request(app)
        .post('/api/practice/soft-skill/start')
        .send({ topicId: topic._id });

      expect(res.status).toBe(200);
      expect(res.body.level).toBe('senior');
      expect(res.body.roleDescription).toBeDefined();

      const lastCall = geminiSoftSkillCallHistory[geminiSoftSkillCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('stakeholder ejecutivo o cliente corporativo');
      expect(sysInstruction).toContain('arquitectura, costos o resiliencia');
    });
  });

  describe('POST /api/practice/soft-skill/reply', () => {
    it('retorna 400 si falta userAudioTranscript o topicId', async () => {
      const res = await request(app)
        .post('/api/practice/soft-skill/reply')
        .send({ topicId: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('AC-2: maneja turno intermedio para Junior con tono constructivo sin exigir ROI empresarial', async () => {
      const topic = await Topic.create({
        title: 'Pedir Ayuda: Formular Dudas con Hipótesis Previas',
        category: 'soft_skill',
        type: 'practice',
        level: 'junior',
      });

      const res = await request(app)
        .post('/api/practice/soft-skill/reply')
        .send({
          topicId: topic._id,
          role: 'Compañero Senior de Equipo',
          roleDescription: 'Tu compañero Senior en una sesión de 1:1 o revisión de código',
          conversationHistory: [
            { speaker: 'ai', text: '¿Podrías decirme qué investigaste antes de trabarte?' },
          ],
          userAudioTranscript: 'Revisé la documentación de Mongoose y probé populate(), pero sigue retornando null.',
        });

      expect(res.status).toBe(200);
      expect(res.body.isFinalTurn).toBe(false);
      expect(res.body.reply).toBeDefined();

      const lastCall = geminiSoftSkillCallHistory[geminiSoftSkillCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('Desarrollador Junior');
      expect(sysInstruction).toContain('NO exijas métricas financieras de ROI empresarial');
    });

    it('AC-2: maneja turno final para Junior evaluando estructura, síntesis y proactividad sin exigir liderazgo Senior', async () => {
      const topic = await Topic.create({
        title: 'Daily Standup: Estructura Qué Hice, Qué Haré y Bloqueos',
        category: 'soft_skill',
        type: 'practice',
        level: 'junior',
        srsStage: 0,
        easeFactor: 2.5,
        intervalDays: 0,
      });

      const conversationHistory = [
        { speaker: 'ai', text: 'Hola, ¿cuál es tu estatus hoy?' },
        { speaker: 'user', text: 'Ayer terminé el schema de Topic. Hoy haré las rutas de Express.' },
        { speaker: 'ai', text: '¿Tienes algún bloqueo?' },
        { speaker: 'user', text: 'Ninguno por ahora, las pruebas unitarias pasan en verde.' },
        { speaker: 'ai', text: 'Perfecto, ¿algo más para el equipo?' },
      ];

      const res = await request(app)
        .post('/api/practice/soft-skill/reply')
        .send({
          topicId: topic._id,
          role: 'Scrum Master / PM de Equipo',
          roleDescription: 'Scrum Master / PM en el Daily Standup matutino',
          conversationHistory,
          userAudioTranscript: 'Solo confirmar si alguien necesita apoyo con la integración de MongoDB.',
        });

      expect(res.status).toBe(200);
      expect(res.body.isFinalTurn).toBe(true);
      expect(res.body.level).toBe('junior');
      expect(res.body.score).toBe(4);
      expect(res.body.feedback).toBeDefined();

      const lastCall = geminiSoftSkillCallHistory[geminiSoftSkillCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';

      expect(sysInstruction).toContain('ADAPTADAS A NIVEL JUNIOR');
      expect(sysInstruction).toContain('Estructura y Claridad');
      expect(sysInstruction).toContain('Capacidad de Síntesis');
      expect(sysInstruction).toContain('Proactividad y Disposición al Feedback');
      expect(sysInstruction).toContain('NO exijas métricas financieras, ROI empresarial ni visión estratégica de Staff/Principal Engineer');
    });

    it('maneja el turno final de Senior: emite veredicto formal con criterios de consultoría y persiste en SessionLog', async () => {
      const topic = await Topic.create({
        title: 'Defensa de Trade-Offs en Migración Cloud',
        category: 'soft_skill',
        type: 'practice',
        level: 'senior',
        srsStage: 0,
        easeFactor: 2.5,
        intervalDays: 0,
      });

      const conversationHistory = [
        { speaker: 'ai', text: '¿Por qué no posponemos la migración?' },
        { speaker: 'user', text: 'Porque el costo de mantenimiento actual supera la inversión en la nube.' },
        { speaker: 'ai', text: 'Pero la migración tomará 3 meses según tu estimación.' },
        { speaker: 'user', text: 'Podemos hacer una migración por fases empezando por el servicio no crítico.' },
        { speaker: 'ai', text: '¿Qué pasa si hay downtime durante el corte de tráfico?' },
      ];

      const res = await request(app)
        .post('/api/practice/soft-skill/reply')
        .send({
          topicId: topic._id,
          role: 'Director de Negocio / Cliente Corporativo',
          roleDescription: 'Director Corporativo evaluando ROI y plazos de entrega',
          conversationHistory,
          userAudioTranscript:
            'Usaremos un despliegue Blue/Green con DNS ponderado y rollback inmediato si los errores 5xx suben del 0.1%, asegurando cero interrupción para los clientes.',
        });

      expect(res.status).toBe(200);
      expect(res.body.isFinalTurn).toBe(true);
      expect(res.body.level).toBe('senior');
      expect(res.body.score).toBe(4);
      expect(res.body.feedback).toBeDefined();
      expect(res.body.businessClarity).toBeDefined();
      expect(res.body.tradeOffDefense).toBeDefined();
      expect(res.body.assertivenessScore).toBe(4);
      expect(Array.isArray(res.body.missingTradeoffs)).toBe(true);
      expect(Array.isArray(res.body.strengths)).toBe(true);
      expect(res.body.srsStage).toBe(1);
      expect(res.body.intervalDays).toBe(1);
      expect(res.body.sessionLogId).toBeDefined();

      const lastCall = geminiSoftSkillCallHistory[geminiSoftSkillCallHistory.length - 1];
      const sysInstruction = lastCall?.config?.systemInstruction || '';
      expect(sysInstruction).toContain('Consultoría Técnica, Comunicación y Liderazgo de Ingeniería');

      // Verificar persistencia en Topic
      const updatedTopic = await Topic.findById(topic._id);
      expect(updatedTopic.srsStage).toBe(1);
      expect(updatedTopic.history.length).toBe(1);
      expect(updatedTopic.history[0].score).toBe(4);

      // Verificar persistencia en SessionLog
      const log = await SessionLog.findById(res.body.sessionLogId);
      expect(log).not.toBeNull();
      expect(log.topicId.toString()).toBe(topic._id.toString());
      expect(log.score).toBe(4);
      expect(log.assertivenessScore).toBe(4);
      expect(log.conversationHistory.length).toBe(6);
    });
  });
});
