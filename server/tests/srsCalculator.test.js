import { describe, it, expect } from 'vitest';
import { calculateNextReview } from '../src/utils/srsCalculator.js';

describe('srsCalculator - calculateNextReview', () => {
  describe('Scores 1 y 2 (fallo/duda severa)', () => {
    it('resetea srsStage = 0 e intervalDays = 1 para score 1 independientemente de la etapa previa', () => {
      const result = calculateNextReview(3, 2.5, 1);
      expect(result.srsStage).toBe(0);
      expect(result.intervalDays).toBe(1);
      // easeFactor disminuye pero respeta el mínimo
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('resetea srsStage = 0 e intervalDays = 1 para score 2', () => {
      const result = calculateNextReview(5, 2.1, 2);
      expect(result.srsStage).toBe(0);
      expect(result.intervalDays).toBe(1);
      expect(result.easeFactor).toBeLessThan(2.1);
    });
  });

  describe('Score 3 (aprobado raspado)', () => {
    it('mantiene intervalo corto de 3 días y avanza a stage 1', () => {
      const result = calculateNextReview(0, 2.5, 3);
      expect(result.intervalDays).toBe(3);
      expect(result.srsStage).toBe(1);
    });

    it('mantiene intervalo de 3 días si ya estaba en etapa avanzada pero con score raspado', () => {
      const result = calculateNextReview(2, 2.3, 3);
      expect(result.intervalDays).toBe(3);
      expect(result.srsStage).toBe(3);
    });
  });

  describe('Scores 4 y 5 (buen rendimiento / dominio)', () => {
    it('en etapa 0, score 4 establece stage 1 e intervalo inicial de 1 día', () => {
      const result = calculateNextReview(0, 2.5, 4);
      expect(result.srsStage).toBe(1);
      expect(result.intervalDays).toBe(1);
      expect(result.easeFactor).toBe(2.5); // SM-2 para score 4 no cambia EF (0.1 - (5-4)*(0.08 + (5-4)*0.02) = 0)
    });

    it('en etapa 1, score 4 establece stage 2 e intervalo de 6 días', () => {
      const result = calculateNextReview(1, 2.5, 4);
      expect(result.srsStage).toBe(2);
      expect(result.intervalDays).toBe(6);
    });

    it('en etapa 2 o superior, escala intervalo exponencialmente usando easeFactor (intervalo * easeFactor)', () => {
      // De stage 2 con intervalDays = 6 y easeFactor = 2.5
      // 6 * 2.5 = 15 días
      const result = calculateNextReview(2, 2.5, 4, 6);
      expect(result.srsStage).toBe(3);
      expect(result.intervalDays).toBe(15);
    });

    it('score 5 incrementa el easeFactor y escala exponencialmente', () => {
      // easeFactor para score 5 aumenta: 2.5 + (0.1 - 0) = 2.6
      const result = calculateNextReview(2, 2.5, 5, 6);
      expect(result.srsStage).toBe(3);
      expect(result.easeFactor).toBe(2.6);
      // Math.round(6 * 2.6) = 16
      expect(result.intervalDays).toBe(16);
    });
  });

  describe('Límite inferior de easeFactor (1.3)', () => {
    it('nunca permite que el easeFactor descienda por debajo de 1.3', () => {
      let ef = 1.4;
      // Repetidos fallos con score 1
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(0, ef, 1);
        ef = result.easeFactor;
      }
      expect(ef).toBe(1.3);
    });

    it('si se ingresa un easeFactor ya en 1.3 y score 1, se mantiene en 1.3', () => {
      const result = calculateNextReview(0, 1.3, 1);
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe('Cálculo de nextReviewAt', () => {
    it('devuelve una fecha nextReviewAt en el futuro según intervalDays', () => {
      const before = Date.now();
      const result = calculateNextReview(0, 2.5, 4);
      const after = Date.now();

      expect(result.nextReviewAt).toBeInstanceOf(Date);
      const diffMs = result.nextReviewAt.getTime() - before;
      const expectedMs = result.intervalDays * 24 * 60 * 60 * 1000;
      // Permitimos pequeña holgura de ms
      expect(diffMs).toBeGreaterThanOrEqual(expectedMs - 50);
      expect(diffMs).toBeLessThanOrEqual(expectedMs + (after - before) + 50);
    });
  });
});
