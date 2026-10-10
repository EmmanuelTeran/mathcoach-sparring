import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { curatedTopics } from '../seed-data/index.js';
import { seedDatabase } from '../scripts/seed.js';
import { MathTopic } from '../src/models/MathTopic.js';
import { TopicTrack } from '../src/models/TopicTrack.js';
import { Exercise } from '../src/models/Exercise.js';

describe('Curated Catalog Audit & Seed Idempotency Suite (MATH-US-09)', () => {
  // ========================================================
  // BLOQUE 1: Auditoría Estática de Estructura y Cuotas
  // ========================================================
  describe('Auditoría de Datos Curados (seed-data)', () => {
    it('debe contener los 8 temas curriculares distribuidos en sus 4 áreas canónicas', () => {
      expect(curatedTopics.length).toBe(8);

      const algebraTopics = curatedTopics.filter(
        (t) => t.metadata.area === 'algebra'
      );
      const calculusTopics = curatedTopics.filter(
        (t) => t.metadata.area === 'calculo' || t.metadata.area === 'analisis'
      );
      const trigTopics = curatedTopics.filter(
        (t) => t.metadata.area === 'trigonometria'
      );
      const geomTopics = curatedTopics.filter(
        (t) => t.metadata.area === 'geometria'
      );

      expect(algebraTopics.length).toBe(3);
      expect(calculusTopics.length).toBe(3);
      expect(trigTopics.length).toBe(1);
      expect(geomTopics.length).toBe(1);
    });

    it('cada tema debe poseer metadatos obligatorios válidos', () => {
      for (const topic of curatedTopics) {
        expect(topic.slug).toBeTruthy();
        expect(typeof topic.slug).toBe('string');
        expect(topic.metadata).toBeDefined();
        expect(topic.metadata.title).toBeTruthy();
        expect(['algebra', 'calculo', 'analisis', 'trigonometria', 'geometria']).toContain(
          topic.metadata.area
        );
        expect(topic.metadata.source).toBeTruthy();
        expect(typeof topic.metadata.order).toBe('number');
        expect(typeof topic.metadata.description).toBe('string');
      }
    });

    it('todos los externalKey deben ser únicos y seguir formato canónico', () => {
      const seenKeys = new Set();
      const keyPattern = /^[a-z0-9]+-[a-z0-9]+-(tech|app|proof)-d[1-3]-\d{2}$/;

      for (const topic of curatedTopics) {
        for (const ex of topic.exercises) {
          expect(ex.externalKey).toMatch(keyPattern);
          expect(seenKeys.has(ex.externalKey)).toBe(false);
          seenKeys.add(ex.externalKey);
        }
      }

      // El catálogo global ampliado (8 temas x 33 ejercicios) = 264 ejercicios
      expect(seenKeys.size).toBe(264);
    });

    it('cada ejercicio debe tener statement y referenceSolution exhaustivos en Markdown + KaTeX balanceado', () => {
      for (const topic of curatedTopics) {
        for (const ex of topic.exercises) {
          // Statement no vacío
          expect(ex.statement).toBeTruthy();
          expect(ex.statement.length).toBeGreaterThanOrEqual(15);

          // Solución de referencia explicativa >= 20 caracteres
          expect(ex.referenceSolution).toBeTruthy();
          expect(ex.referenceSolution.length).toBeGreaterThanOrEqual(20);

          // Validación de balanceo de delimitadores KaTeX/LaTeX
          // 1. Delimitadores inline $ (que no sean parte de $$)
          const textWithoutBlock = ex.statement.replace(/\$\$/g, '');
          const dollarMatches = textWithoutBlock.match(/\$/g) || [];
          expect(dollarMatches.length % 2).toBe(0);

          // 2. Delimitadores en bloque $$
          const blockMatches = (ex.statement.match(/\$\$/g) || []).length;
          expect(blockMatches % 2).toBe(0);
        }
      }
    });

    it('las cuotas mínimas de volumen deben cumplirse por cada tema y dificultad', () => {
      const categories = ['technique', 'application', 'proof'];
      const difficulties = [1, 2, 3];

      for (const topic of curatedTopics) {
        for (const diff of difficulties) {
          // Técnica: >= 6 ejercicios y >= 30 minutos acumulados
          const techExercises = topic.exercises.filter(
            (e) => e.category === 'technique' && e.difficulty === diff
          );
          expect(techExercises.length).toBeGreaterThanOrEqual(6);
          const techMinutes = techExercises.reduce(
            (acc, e) => acc + e.expertMinutes,
            0
          );
          expect(techMinutes).toBeGreaterThanOrEqual(30);

          // Aplicación: >= 3 ejercicios
          const appExercises = topic.exercises.filter(
            (e) => e.category === 'application' && e.difficulty === diff
          );
          expect(appExercises.length).toBeGreaterThanOrEqual(3);

          // Demostración: >= 2 ejercicios
          const proofExercises = topic.exercises.filter(
            (e) => e.category === 'proof' && e.difficulty === diff
          );
          expect(proofExercises.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('los rangos de expertMinutes y la secuencia de order deben ser estrictos y sin huecos', () => {
      for (const topic of curatedTopics) {
        const categories = ['technique', 'application', 'proof'];
        const difficulties = [1, 2, 3];

        for (const cat of categories) {
          for (const diff of difficulties) {
            const group = topic.exercises
              .filter((e) => e.category === cat && e.difficulty === diff)
              .sort((a, b) => a.order - b.order);

            // Validar secuencia de orden creciente sin saltos: 1, 2, 3...
            group.forEach((ex, idx) => {
              expect(ex.order).toBe(idx + 1);

              // Validar rangos calibrados de expertMinutes
              if (cat === 'technique') {
                expect(ex.expertMinutes).toBeGreaterThanOrEqual(1);
                expect(ex.expertMinutes).toBeLessThanOrEqual(5);
              } else if (cat === 'application') {
                expect(ex.expertMinutes).toBeGreaterThanOrEqual(5);
                expect(ex.expertMinutes).toBeLessThanOrEqual(15);
              } else if (cat === 'proof') {
                expect(ex.expertMinutes).toBeGreaterThanOrEqual(8);
                expect(ex.expertMinutes).toBeLessThanOrEqual(15);
              }
            });
          }
        }
      }
    });

    it('debe ser viable construir al menos 2 rondas disjuntas y válidas por cada celda de técnica', () => {
      // Simulación de composición de rondas (§1.1):
      // Ronda técnica: acumulado >= 15 min con count entre 3 y 10
      for (const topic of curatedTopics) {
        for (const diff of [1, 2, 3]) {
          const exercises = topic.exercises.filter(
            (e) => e.category === 'technique' && e.difficulty === diff
          );

          // Ronda 1
          const round1 = [];
          let round1Minutes = 0;
          for (const ex of exercises) {
            round1.push(ex);
            round1Minutes += ex.expertMinutes;
            if (round1Minutes >= 15 && round1.length >= 3) break;
          }

          // Ronda 2 con los restantes
          const remaining = exercises.filter((ex) => !round1.includes(ex));
          const round2 = [];
          let round2Minutes = 0;
          for (const ex of remaining) {
            round2.push(ex);
            round2Minutes += ex.expertMinutes;
            if (round2Minutes >= 15 && round2.length >= 3) break;
          }

          expect(round1.length).toBeGreaterThanOrEqual(3);
          expect(round1Minutes).toBeGreaterThanOrEqual(15);
          expect(round2.length).toBeGreaterThanOrEqual(3);
          expect(round2Minutes).toBeGreaterThanOrEqual(15);

          // Comprobar intersección vacía (rondas disjuntas)
          const intersection = round1.some((e) => round2.includes(e));
          expect(intersection).toBe(false);
        }
      }
    });
  });

  // ========================================================
  // BLOQUE 2: Idempotencia Absoluta en Base de Datos (MongoMemoryServer)
  // ========================================================
  describe('Prueba de Integración e Idempotencia del Seed', () => {
    let mongoServer;

    beforeAll(async () => {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    });

    afterAll(async () => {
      await mongoose.disconnect();
      if (mongoServer) {
        await mongoServer.stop();
      }
    });

    it('ejecuta seedDatabase() y asegura la estructura de 8 temas, 24 pistas y 264 ejercicios', async () => {
      const summary1 = await seedDatabase({ log: false });

      expect(summary1.topicsProcessed).toBe(8);
      expect(summary1.tracksProcessed).toBe(24);
      expect(summary1.exercisesProcessed).toBe(264);

      const topicCount1 = await MathTopic.countDocuments();
      const trackCount1 = await TopicTrack.countDocuments();
      const exerciseCount1 = await Exercise.countDocuments();

      expect(topicCount1).toBe(8);
      expect(trackCount1).toBe(24);
      expect(exerciseCount1).toBe(264);

      // Verificar que cada pista tenga dificultad 1 y dueDate
      const sampleTracks = await TopicTrack.find();
      for (const track of sampleTracks) {
        expect(track.difficulty).toBe(1);
        expect(track.dueDate).toBeInstanceOf(Date);
        expect(track.repetition).toBe(0);
        expect(track.efactor).toBe(2.5);
      }

      // ----------------------------------------------------
      // SEGUNDA EJECUCIÓN CONSECUTIVA (Prueba de Idempotencia)
      // ----------------------------------------------------
      const summary2 = await seedDatabase({ log: false });

      const topicCount2 = await MathTopic.countDocuments();
      const trackCount2 = await TopicTrack.countDocuments();
      const exerciseCount2 = await Exercise.countDocuments();

      // Comprobación de duplicidad cero
      expect(topicCount2).toBe(topicCount1);
      expect(trackCount2).toBe(trackCount1);
      expect(exerciseCount2).toBe(exerciseCount1);
    });

    it('no reinicia el progreso SM-2 ni dificultad de pistas modificadas previamente', async () => {
      // Modificar intencionalmente una pista simulando progreso del usuario
      const track = await TopicTrack.findOne();
      expect(track).not.toBeNull();

      track.difficulty = 2;
      track.repetition = 3;
      track.interval = 6;
      track.efactor = 2.6;
      await track.save();

      // Ejecutar seed nuevamente
      await seedDatabase({ log: false });

      // Verificar que la pista retuvo su progreso intacto
      const updatedTrack = await TopicTrack.findById(track._id);
      expect(updatedTrack.difficulty).toBe(2);
      expect(updatedTrack.repetition).toBe(3);
      expect(updatedTrack.interval).toBe(6);
      expect(updatedTrack.efactor).toBe(2.6);
    });
  });
});
