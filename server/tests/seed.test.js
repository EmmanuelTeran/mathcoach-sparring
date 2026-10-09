import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/db.js';
import { Topic } from '../src/models/Topic.js';
import { seedTopics, SEED_TOPICS } from '../src/scripts/seed.js';

describe('Seed Script Integration Tests', () => {
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
  });

  it('siembra el catálogo completo multinivel de 68 temas en la base de datos limpia', async () => {
    expect(SEED_TOPICS.length).toBe(68);

    const stats = await seedTopics();
    expect(stats.upsertedCount).toBe(68);
    expect(stats.totalCount).toBe(68);

    const count = await Topic.countDocuments();
    expect(count).toBe(68);
  });

  it('valida que cada nivel (Junior, Mid, Senior) tenga al menos 10 tópicos y distribución Hard/Soft', async () => {
    await seedTopics();

    const juniorTopics = await Topic.find({ level: 'junior' });
    const midTopics = await Topic.find({ level: 'mid' });
    const seniorTopics = await Topic.find({ level: 'senior' });

    expect(juniorTopics.length).toBeGreaterThanOrEqual(10);
    expect(midTopics.length).toBeGreaterThanOrEqual(10);
    expect(seniorTopics.length).toBeGreaterThanOrEqual(10);

    // Junior: 12 hard + 10 soft
    const juniorHard = juniorTopics.filter((t) => t.category === 'hard_skill');
    const juniorSoft = juniorTopics.filter((t) => t.category === 'soft_skill');
    expect(juniorHard.length).toBe(12);
    expect(juniorSoft.length).toBe(10);

    // Mid: 8 hard + 6 soft
    const midHard = midTopics.filter((t) => t.category === 'hard_skill');
    const midSoft = midTopics.filter((t) => t.category === 'soft_skill');
    expect(midHard.length).toBe(8);
    expect(midSoft.length).toBe(6);

    // Senior: 17 hard + 15 soft
    const seniorHard = seniorTopics.filter((t) => t.category === 'hard_skill');
    const seniorSoft = seniorTopics.filter((t) => t.category === 'soft_skill');
    expect(seniorHard.length).toBe(17);
    expect(seniorSoft.length).toBe(15);

    // Validar escenarios clave de Junior Soft Skills
    const juniorTitles = juniorSoft.map((t) => t.title);
    expect(juniorTitles.some((t) => t.toLowerCase().includes('daily'))).toBe(true);
    expect(juniorTitles.some((t) => t.toLowerCase().includes('pedir ayuda'))).toBe(true);
    expect(juniorTitles.some((t) => t.toLowerCase().includes('demo'))).toBe(true);
    expect(juniorTitles.some((t) => t.toLowerCase().includes('code review'))).toBe(true);

    // US-10: Exactamente 6 tópicos con codingChallenge, 2 por nivel
    const codingTopics = await Topic.find({ codingChallenge: { $exists: true } });
    expect(codingTopics.length).toBe(6);
    expect(codingTopics.filter((t) => t.level === 'junior').length).toBe(2);
    expect(codingTopics.filter((t) => t.level === 'mid').length).toBe(2);
    expect(codingTopics.filter((t) => t.level === 'senior').length).toBe(2);
  });

  it('verifica la integridad del seed probando soluciones de referencia para los 6 retos', async () => {
    await seedTopics();
    const codingTopics = await Topic.find({ codingChallenge: { $exists: true } });

    const solutions = {
      sumEvenNumbers: (numbers) => numbers.filter((n) => n % 2 === 0).reduce((a, b) => a + b, 0),
      capitalizeWords: (sentence) =>
        sentence
          ? sentence
              .split(' ')
              .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
              .join(' ')
          : '',
      groupBy: (items, key) =>
        items.reduce((acc, item) => {
          const val = item[key];
          if (!acc[val]) acc[val] = [];
          acc[val].push(item);
          return acc;
        }, {}),
      isBalanced: (str) => {
        const stack = [];
        const pairs = { ')': '(', ']': '[', '}': '{' };
        for (const char of str) {
          if (['(', '[', '{'].includes(char)) stack.push(char);
          else if ([')', ']', '}'].includes(char)) {
            if (stack.pop() !== pairs[char]) return false;
          }
        }
        return stack.length === 0;
      },
      twoSum: (nums, target) => {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const diff = target - nums[i];
          if (map.has(diff)) return [map.get(diff), i];
          map.set(nums[i], i);
        }
        return [];
      },
      mergeIntervals: (intervals) => {
        if (!intervals.length) return [];
        const sorted = structuredClone(intervals).sort((a, b) => a[0] - b[0]);
        const res = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
          const last = res[res.length - 1];
          const curr = sorted[i];
          if (curr[0] <= last[1]) last[1] = Math.max(last[1], curr[1]);
          else res.push(curr);
        }
        return res;
      },
    };

    for (const t of codingTopics) {
      const challenge = t.codingChallenge;
      const fn = solutions[challenge.functionName];
      expect(fn).toBeDefined();

      for (const tc of challenge.testCases) {
        const actual = fn(...tc.input);
        expect(actual).toEqual(tc.expected);
      }
    }
  });

  it('es completamente idempotente: no duplica registros al ejecutarse múltiples veces', async () => {
    const firstRun = await seedTopics();
    expect(firstRun.upsertedCount).toBe(68);
    expect(firstRun.totalCount).toBe(68);

    const secondRun = await seedTopics();
    expect(secondRun.upsertedCount).toBe(0);
    expect(secondRun.totalCount).toBe(68);

    const thirdRun = await seedTopics();
    expect(thirdRun.upsertedCount).toBe(0);
    expect(thirdRun.totalCount).toBe(68);

    const finalCount = await Topic.countDocuments();
    expect(finalCount).toBe(68);
  });

  it('respeta el progreso de SRS y no sobreescribe srsStage ni history existentes', async () => {
    await seedTopics();

    const sampleTopic = await Topic.findOne({ title: 'Event Loop Internals' });
    expect(sampleTopic).not.toBeNull();

    sampleTopic.srsStage = 2;
    sampleTopic.easeFactor = 2.6;
    sampleTopic.intervalDays = 6;
    sampleTopic.history.push({
      score: 5,
      userInput: 'Explicación del event loop y fases de libuv',
      aiFeedback: 'Excelente comprensión',
      reviewedAt: new Date(),
    });
    await sampleTopic.save();

    await seedTopics();

    const verifiedTopic = await Topic.findOne({ title: 'Event Loop Internals' });
    if (verifiedTopic) {
      expect(verifiedTopic.srsStage).toBe(2);
      expect(verifiedTopic.easeFactor).toBe(2.6);
      expect(verifiedTopic.intervalDays).toBe(6);
      expect(verifiedTopic.history.length).toBe(1);
    }
  });

  it('re-seed sobre BD existente añade codingChallenge a un tópico previamente sembrado sin él, preservando srsStage e historia', async () => {
    await Topic.create({
      title: 'Reto de Código: Suma de Números Pares',
      category: 'hard_skill',
      type: 'practice',
      level: 'junior',
      srsStage: 3,
      easeFactor: 2.8,
      history: [{ score: 4, userInput: 'code', aiFeedback: 'ok', reviewedAt: new Date() }],
    });

    await seedTopics();

    const updated = await Topic.findOne({ title: 'Reto de Código: Suma de Números Pares' });
    expect(updated).not.toBeNull();
    expect(updated.codingChallenge).toBeDefined();
    expect(updated.codingChallenge.functionName).toBe('sumEvenNumbers');
    expect(updated.srsStage).toBe(3);
    expect(updated.easeFactor).toBe(2.8);
    expect(updated.history.length).toBe(1);
  });

  it('actualiza el campo level en documentos existentes con bulkWrite forzando el nuevo level', async () => {
    await Topic.create({
      title: 'Event Loop Internals',
      category: 'hard_skill',
      type: 'theory',
      level: 'junior',
      srsStage: 3,
      easeFactor: 2.7,
    });

    await seedTopics();

    const updated = await Topic.findOne({ title: 'Event Loop Internals' });
    expect(updated).not.toBeNull();
    expect(updated.level).toBe('senior');
    expect(updated.srsStage).toBe(3);
    expect(updated.easeFactor).toBe(2.7);
  });
});
