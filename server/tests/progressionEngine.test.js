import { describe, it, expect } from 'vitest';
import { computeRoundOutcome } from '../src/utils/progressionEngine.js';
import {
  PROMOTION_MIN_SCORE,
  PROMOTION_MIN_PASS_RATE,
  PROMOTION_INTERVAL_DAYS,
  EXERCISE_PASS_SCORE,
  ROUND_PASS_SCORE,
  MIN_DIFFICULTY,
  MAX_DIFFICULTY,
} from '../src/config/progression.js';

describe('progressionEngine - computeRoundOutcome (TDD Suite)', () => {
  const fixedNow = new Date('2026-10-10T12:00:00.000Z');

  describe('AC-1: Métricas de Ronda y Validación Defensiva', () => {
    it('lanza error si scores no es un arreglo no vacío', () => {
      expect(() => computeRoundOutcome({ scores: [], track: { difficulty: 1 } }))
        .toThrow('scores must be a non-empty array of numbers');
      expect(() => computeRoundOutcome({ scores: null, track: { difficulty: 1 } }))
        .toThrow('scores must be a non-empty array of numbers');
      expect(() => computeRoundOutcome({ scores: undefined, track: { difficulty: 1 } }))
        .toThrow('scores must be a non-empty array of numbers');
      expect(() => computeRoundOutcome({ scores: 'not-an-array', track: { difficulty: 1 } }))
        .toThrow('scores must be a non-empty array of numbers');
    });

    it('lanza error si algún score no es un número finito entre 0 y 5', () => {
      expect(() => computeRoundOutcome({ scores: [-0.1], track: { difficulty: 1 } }))
        .toThrow('Each score must be a number between 0 and 5');
      expect(() => computeRoundOutcome({ scores: [5.1], track: { difficulty: 1 } }))
        .toThrow('Each score must be a number between 0 and 5');
      expect(() => computeRoundOutcome({ scores: [NaN], track: { difficulty: 1 } }))
        .toThrow('Each score must be a number between 0 and 5');
      expect(() => computeRoundOutcome({ scores: [Infinity], track: { difficulty: 1 } }))
        .toThrow('Each score must be a number between 0 and 5');
      expect(() => computeRoundOutcome({ scores: ['4'], track: { difficulty: 1 } }))
        .toThrow('Each score must be a number between 0 and 5');
      expect(() => computeRoundOutcome({ scores: [4, null], track: { difficulty: 1 } }))
        .toThrow('Each score must be a number between 0 and 5');
    });

    it('lanza error si track o track.difficulty es inválido', () => {
      expect(() => computeRoundOutcome({ scores: [4, 4], track: null }))
        .toThrow('track.difficulty must be 1, 2, or 3');
      expect(() => computeRoundOutcome({ scores: [4, 4], track: {} }))
        .toThrow('track.difficulty must be 1, 2, or 3');
      expect(() => computeRoundOutcome({ scores: [4, 4], track: { difficulty: 0 } }))
        .toThrow('track.difficulty must be 1, 2, or 3');
      expect(() => computeRoundOutcome({ scores: [4, 4], track: { difficulty: 4 } }))
        .toThrow('track.difficulty must be 1, 2, or 3');
      expect(() => computeRoundOutcome({ scores: [4, 4], track: { difficulty: '2' } }))
        .toThrow('track.difficulty must be 1, 2, or 3');
    });

    it('calcula roundScore como promedio aritmético redondeado estrictamente a 1 decimal', () => {
      // 5, 5, 5 -> 5.0
      const out1 = computeRoundOutcome({ scores: [5, 5, 5], track: { difficulty: 1 }, now: fixedNow });
      expect(out1.roundScore).toBe(5.0);

      // 4, 4, 3 -> 11 / 3 = 3.6666... -> 3.7
      const out2 = computeRoundOutcome({ scores: [4, 4, 3], track: { difficulty: 1 }, now: fixedNow });
      expect(out2.roundScore).toBe(3.7);

      // 4, 4, 5 -> 13 / 3 = 4.3333... -> 4.3
      const out3 = computeRoundOutcome({ scores: [4, 4, 5], track: { difficulty: 1 }, now: fixedNow });
      expect(out3.roundScore).toBe(4.3);

      // 4, 4, 4, 4, 3 -> 19 / 5 = 3.8
      const out4 = computeRoundOutcome({ scores: [4, 4, 4, 4, 3], track: { difficulty: 1 }, now: fixedNow });
      expect(out4.roundScore).toBe(3.8);
    });

    it('calcula passRate como proporción de ejercicios con score >= 3', () => {
      // 5, 4, 3, 2, 1 -> 3 aprobados de 5 -> 0.6
      const out1 = computeRoundOutcome({ scores: [5, 4, 3, 2, 1], track: { difficulty: 1 }, now: fixedNow });
      expect(out1.passRate).toBe(0.6);

      // 3, 3, 3 -> 3 de 3 -> 1.0
      const out2 = computeRoundOutcome({ scores: [3, 3, 3], track: { difficulty: 1 }, now: fixedNow });
      expect(out2.passRate).toBe(1.0);

      // 2, 2, 1, 0 -> 0 de 4 -> 0.0
      const out3 = computeRoundOutcome({ scores: [2, 2, 1, 0], track: { difficulty: 1 }, now: fixedNow });
      expect(out3.passRate).toBe(0.0);
    });
  });

  describe('AC-2: Regla de Promoción Estricta y Casos Límite (§1.2)', () => {
    it('promueve a dificultad 2 si difficulty=1, roundScore=4.0 y passRate=0.8 (caso frontera exacto)', () => {
      // 5, 5, 5, 5, 0 -> media = 20/5 = 4.0; aprobados = 4/5 = 0.8
      const result = computeRoundOutcome({
        scores: [5, 5, 5, 5, 0],
        track: { difficulty: 1, repetition: 0, interval: 0, efactor: 2.5 },
        now: fixedNow,
      });

      expect(result.roundScore).toBe(4.0);
      expect(result.passRate).toBe(0.8);
      expect(result.promoted).toBe(true);
      expect(result.newDifficulty).toBe(2);
      expect(result.srs.repetition).toBe(1);
      expect(result.srs.interval).toBe(PROMOTION_INTERVAL_DAYS);
      const expectedDueDate = new Date(fixedNow.getTime() + PROMOTION_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
      expect(result.srs.dueDate).toEqual(expectedDueDate);
    });

    it('promueve de dificultad 2 a 3 cuando cumple las tres condiciones', () => {
      const result = computeRoundOutcome({
        scores: [4, 4, 4, 4, 4],
        track: { difficulty: 2, repetition: 2, interval: 6, efactor: 2.5 },
        now: fixedNow,
      });

      expect(result.promoted).toBe(true);
      expect(result.newDifficulty).toBe(3);
      expect(result.srs.repetition).toBe(1);
      expect(result.srs.interval).toBe(PROMOTION_INTERVAL_DAYS);
    });

    it('no promueve si roundScore < 4.0 aunque passRate = 1.0 (caso rechazo por score)', () => {
      // [4, 4, 4, 4, 3.5] -> media = 19.5/5 = 3.9, passRate = 1.0
      const result = computeRoundOutcome({
        scores: [4, 4, 4, 4, 3.5],
        track: { difficulty: 1, repetition: 1, interval: 3, efactor: 2.5 },
        now: fixedNow,
      });

      expect(result.roundScore).toBe(3.9);
      expect(result.passRate).toBe(1.0);
      expect(result.promoted).toBe(false);
      expect(result.newDifficulty).toBe(1);
    });

    it('no promueve si passRate < 0.8 aunque roundScore >= 4.0 (caso rechazo por passRate)', () => {
      // [5, 5, 5, 2] -> media = 17/4 = 4.25 -> roundScore = 4.3; aprobados = 3/4 = 0.75
      const result = computeRoundOutcome({
        scores: [5, 5, 5, 2],
        track: { difficulty: 1, repetition: 0, interval: 0, efactor: 2.5 },
        now: fixedNow,
      });

      expect(result.roundScore).toBe(4.3);
      expect(result.passRate).toBe(0.75);
      expect(result.promoted).toBe(false);
      expect(result.newDifficulty).toBe(1);
    });

    it('en dificultad 3 nunca promueve (tope adaptativo) aun con puntuación perfecta', () => {
      const result = computeRoundOutcome({
        scores: [5, 5, 5, 5],
        track: { difficulty: 3, repetition: 2, interval: 6, efactor: 2.5 },
        now: fixedNow,
      });

      expect(result.roundScore).toBe(5.0);
      expect(result.passRate).toBe(1.0);
      expect(result.promoted).toBe(false);
      expect(result.newDifficulty).toBe(3);
      // Debe aplicar SM-2 estándar escalando el intervalo
      expect(result.srs.repetition).toBe(3);
      expect(result.srs.interval).toBeGreaterThan(6);
    });
  });

  describe('AC-3: Acoplamiento SRS SM-2 por Pista (§1.3)', () => {
    it('caso Fallo (roundScore < 3.0): reinicia SRS (repetition=0, interval=1, dueDate=+1d) y mantiene dificultad', () => {
      const result = computeRoundOutcome({
        scores: [2, 2, 2],
        track: { difficulty: 2, repetition: 4, interval: 15, efactor: 2.4 },
        now: fixedNow,
      });

      expect(result.roundScore).toBe(2.0);
      expect(result.promoted).toBe(false);
      expect(result.newDifficulty).toBe(2);
      expect(result.srs.repetition).toBe(0);
      expect(result.srs.interval).toBe(1);
      expect(result.srs.dueDate).toEqual(new Date(fixedNow.getTime() + 1 * 24 * 60 * 60 * 1000));
      expect(result.srs.efactor).toBeLessThan(2.4);
      expect(result.srs.efactor).toBeGreaterThanOrEqual(1.3);
    });

    it('caso Promoción: repetition=1, interval=3, dueDate=+3d y efactor actualizado según nota redondeada', () => {
      const result = computeRoundOutcome({
        scores: [5, 5, 5, 5],
        track: { difficulty: 1, repetition: 3, interval: 12, efactor: 2.5 },
        now: fixedNow,
      });

      expect(result.promoted).toBe(true);
      expect(result.newDifficulty).toBe(2);
      expect(result.srs.repetition).toBe(1);
      expect(result.srs.interval).toBe(3);
      expect(result.srs.dueDate).toEqual(new Date(fixedNow.getTime() + 3 * 24 * 60 * 60 * 1000));
      // efactor para score 5 aumenta a 2.6
      expect(result.srs.efactor).toBe(2.6);
    });

    it('caso Aprobada sin Promoción (roundScore >= 3.0 y !promoted): delega a SM-2 estándar', () => {
      // En repetition = 0 con score 3 (Math.round(3.3) = 3)
      const res0 = computeRoundOutcome({
        scores: [3, 4, 3], // media = 10/3 = 3.333 -> 3.3, passRate = 1.0 (no llega a 4.0)
        track: { difficulty: 1, repetition: 0, interval: 0, efactor: 2.5 },
        now: fixedNow,
      });
      expect(res0.promoted).toBe(false);
      expect(res0.newDifficulty).toBe(1);
      expect(res0.srs.repetition).toBe(1);
      expect(res0.srs.interval).toBe(3); // score 3 en SM-2 da interval 3

      // En repetition = 1 con score 4 (Math.round(3.8) = 4)
      const res1 = computeRoundOutcome({
        scores: [4, 4, 4, 3], // media = 15/4 = 3.75 -> 3.8, passRate = 1.0
        track: { difficulty: 1, repetition: 1, interval: 1, efactor: 2.5 },
        now: fixedNow,
      });
      expect(res1.promoted).toBe(false);
      expect(res1.srs.repetition).toBe(2);
      expect(res1.srs.interval).toBe(6);

      // En repetition = 2 con interval = 6 y score 4
      const res2 = computeRoundOutcome({
        scores: [4, 4, 4, 3], // media = 3.8 -> redondeado a 4
        track: { difficulty: 1, repetition: 2, interval: 6, efactor: 2.5 },
        now: fixedNow,
      });
      expect(res2.promoted).toBe(false);
      expect(res2.srs.repetition).toBe(3);
      expect(res2.srs.interval).toBe(15); // 6 * 2.5 = 15
    });

    it('usa valores por defecto para track cuando repetition, interval o efactor no se proveen', () => {
      const result = computeRoundOutcome({
        scores: [3, 3, 3],
        track: { difficulty: 1 },
        now: fixedNow,
      });

      expect(result.srs.efactor).toBeDefined();
      expect(result.srs.repetition).toBe(1);
    });

    it('funciona cuando now no se especifica explícitamente (usa Date.now())', () => {
      const before = Date.now();
      const result = computeRoundOutcome({
        scores: [5, 5, 5, 5],
        track: { difficulty: 1 },
      });
      const after = Date.now();

      expect(result.srs.dueDate).toBeInstanceOf(Date);
      const expectedOffset = 3 * 24 * 60 * 60 * 1000;
      expect(result.srs.dueDate.getTime()).toBeGreaterThanOrEqual(before + expectedOffset - 50);
      expect(result.srs.dueDate.getTime()).toBeLessThanOrEqual(after + expectedOffset + 50);
    });
  });

  describe('AC-4: Principio de No-Degradación', () => {
    it('mantiene dificultad 2 aunque todas las notas sean 0', () => {
      const result = computeRoundOutcome({
        scores: [0, 0, 0],
        track: { difficulty: 2, repetition: 3, interval: 10, efactor: 2.0 },
        now: fixedNow,
      });

      expect(result.roundScore).toBe(0.0);
      expect(result.passRate).toBe(0.0);
      expect(result.promoted).toBe(false);
      expect(result.newDifficulty).toBe(2);
      expect(result.srs.repetition).toBe(0);
      expect(result.srs.interval).toBe(1);
    });

    it('mantiene dificultad 3 aunque la nota sea 0', () => {
      const result = computeRoundOutcome({
        scores: [0],
        track: { difficulty: 3, repetition: 5, interval: 30, efactor: 2.5 },
        now: fixedNow,
      });

      expect(result.newDifficulty).toBe(3);
      expect(result.promoted).toBe(false);
    });
  });
});
