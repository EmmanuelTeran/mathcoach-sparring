import { describe, it, expect } from 'vitest';
import { selectExercisesForRound } from '../src/services/roundBuilder.js';

describe('roundBuilder Service (selectExercisesForRound)', () => {
  describe('Límites y Presupuesto por Categoría (ROUND_BUDGET_MIN = 15)', () => {
    it('Técnica con ejercicios cortos (2 min c/u): acumula hasta >= 15 min (8 ejercicios = 16 min)', () => {
      // 12 ejercicios de 2 min
      const candidates = Array.from({ length: 12 }, (_, i) => ({
        _id: `ex-${i + 1}`,
        order: i + 1,
        statement: `Ejercicio ${i + 1}`,
        expertMinutes: 2,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(8); // 8 * 2 = 16 min >= 15 min
      expect(round.totalExpertMinutes).toBe(16);
      expect(round.warning).toBeUndefined();
    });

    it('Técnica con ejercicios de 1 min c/u: se detiene en el tope de 10 ejercicios (10 min acumulados)', () => {
      const candidates = Array.from({ length: 15 }, (_, i) => ({
        _id: `ex-${i + 1}`,
        order: i + 1,
        statement: `Ejercicio ${i + 1}`,
        expertMinutes: 1,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(10);
      expect(round.totalExpertMinutes).toBe(10);
      expect(round.warning).toBeUndefined();
    });

    it('Técnica con ejercicios largos (5 min c/u): se detiene exactamente en 3 ejercicios al cumplir 15 min', () => {
      const candidates = Array.from({ length: 8 }, (_, i) => ({
        _id: `ex-${i + 1}`,
        order: i + 1,
        statement: `Ejercicio ${i + 1}`,
        expertMinutes: 5,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(3);
      expect(round.totalExpertMinutes).toBe(15);
      expect(round.warning).toBeUndefined();
    });

    it('Técnica con ejercicios de 10 min c/u: cumple el mínimo de 3 ejercicios aunque supere los 15 min', () => {
      // 1 ejercicio = 10 min, 2 ejercicios = 20 min (>= 15 min pero < min 3), 3 ejercicios = 30 min (cumple min 3)
      const candidates = Array.from({ length: 5 }, (_, i) => ({
        _id: `ex-${i + 1}`,
        order: i + 1,
        statement: `Ejercicio ${i + 1}`,
        expertMinutes: 10,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(3);
      expect(round.totalExpertMinutes).toBe(30);
    });

    it('Aplicación con ejercicio de 15 min: genera ronda de 1 solo ejercicio (1 <= N <= 3)', () => {
      const candidates = [
        {
          _id: 'app-1',
          order: 1,
          statement: 'Problema largo',
          expertMinutes: 15,
          timesServed: 0,
          lastServedAt: null,
        },
        {
          _id: 'app-2',
          order: 2,
          statement: 'Problema adicional',
          expertMinutes: 10,
          timesServed: 0,
          lastServedAt: null,
        },
      ];

      const round = selectExercisesForRound(candidates, 'application');
      expect(round.exercises.length).toBe(1);
      expect(round.totalExpertMinutes).toBe(15);
      expect(round.exercises[0]._id).toBe('app-1');
    });

    it('Aplicación con ejercicios medianos (6 min c/u): acumula hasta 3 ejercicios (18 min)', () => {
      const candidates = Array.from({ length: 5 }, (_, i) => ({
        _id: `app-${i + 1}`,
        order: i + 1,
        statement: `Problema ${i + 1}`,
        expertMinutes: 6,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'application');
      expect(round.exercises.length).toBe(3); // 6 + 6 + 6 = 18 min >= 15 min
      expect(round.totalExpertMinutes).toBe(18);
    });

    it('Demostración: con 5 candidatos de 10 min c/u, toma exactamente 1 solo ejercicio', () => {
      const candidates = Array.from({ length: 5 }, (_, i) => ({
        _id: `proof-${i + 1}`,
        order: i + 1,
        statement: `Demostración ${i + 1}`,
        expertMinutes: 10,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'proof');
      expect(round.exercises.length).toBe(1);
      expect(round.totalExpertMinutes).toBe(10);
      expect(round.exercises[0]._id).toBe('proof-1');
    });
  });

  describe('Priorización de Selección y Rotación Justa', () => {
    it('prioriza candidatos con menor timesServed', () => {
      const candidates = [
        { _id: 'e1', order: 1, expertMinutes: 5, timesServed: 3, lastServedAt: null },
        { _id: 'e2', order: 2, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e3', order: 3, expertMinutes: 5, timesServed: 1, lastServedAt: null },
        { _id: 'e4', order: 4, expertMinutes: 5, timesServed: 0, lastServedAt: null },
      ];

      const round = selectExercisesForRound(candidates, 'technique');
      // Los seleccionados deben ser los de timesServed 0 (e2, e4) y timesServed 1 (e3)
      const ids = round.exercises.map((e) => e._id);
      expect(ids).toContain('e2');
      expect(ids).toContain('e4');
      expect(ids).toContain('e3');
      expect(ids).not.toContain('e1');
    });

    it('prioriza candidatos con lastServedAt === null sobre los que ya tienen fecha', () => {
      const now = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const candidates = [
        { _id: 'e1', order: 1, expertMinutes: 5, timesServed: 1, lastServedAt: yesterday },
        { _id: 'e2', order: 2, expertMinutes: 5, timesServed: 1, lastServedAt: null },
        { _id: 'e3', order: 3, expertMinutes: 5, timesServed: 1, lastServedAt: now },
      ];

      const round = selectExercisesForRound(candidates, 'proof');
      expect(round.exercises.length).toBe(1);
      expect(round.exercises[0]._id).toBe('e2'); // null va primero
    });

    it('prioriza fecha más remota cuando ambos tienen lastServedAt', () => {
      const dateOlder = new Date('2026-10-01T10:00:00Z');
      const dateNewer = new Date('2026-10-08T10:00:00Z');
      const candidates = [
        { _id: 'e1', order: 1, expertMinutes: 5, timesServed: 1, lastServedAt: dateNewer },
        { _id: 'e2', order: 2, expertMinutes: 5, timesServed: 1, lastServedAt: dateOlder },
      ];

      const round = selectExercisesForRound(candidates, 'proof');
      expect(round.exercises.length).toBe(1);
      expect(round.exercises[0]._id).toBe('e2');
    });

    it('desempata por order ascendente cuando timesServed y lastServedAt son iguales', () => {
      const candidates = [
        { _id: 'e3', order: 3, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e1', order: 1, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e2', order: 2, expertMinutes: 5, timesServed: 0, lastServedAt: null },
      ];

      const round = selectExercisesForRound(candidates, 'proof');
      expect(round.exercises.length).toBe(1);
      expect(round.exercises[0]._id).toBe('e1');
    });
  });

  describe('Orden Final de Entrega al Estudiante (order ASC)', () => {
    it('garantiza que los ejercicios retornados estén estrictamente en orden creciente de order', () => {
      // e2 y e4 fueron seleccionados primero por timesServed: 0, luego e1 por timesServed: 1
      const candidates = [
        { _id: 'e1', order: 1, expertMinutes: 5, timesServed: 1, lastServedAt: null },
        { _id: 'e2', order: 5, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e3', order: 2, expertMinutes: 5, timesServed: 2, lastServedAt: null },
        { _id: 'e4', order: 3, expertMinutes: 5, timesServed: 0, lastServedAt: null },
      ];

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(3);
      // Los seleccionados deben ser e2 (order 5), e4 (order 3), e1 (order 1)
      // Pero entregados al estudiante ordenados por order ASC: [order 1, order 3, order 5]
      const orders = round.exercises.map((e) => e.order);
      expect(orders).toEqual([1, 3, 5]);
      expect(round.exercises.map((e) => e._id)).toEqual(['e1', 'e4', 'e2']);
    });
  });

  describe('Catálogo Insuficiente / Errores', () => {
    it('agrega warning: "catalog_insufficient" cuando hay menos ejercicios que el mínimo de la categoría', () => {
      // Técnica requiere al menos 3 ejercicios. Si sólo hay 2, se devuelven los 2 con warning
      const candidates = [
        { _id: 'e1', order: 1, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e2', order: 2, expertMinutes: 5, timesServed: 0, lastServedAt: null },
      ];

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(2);
      expect(round.totalExpertMinutes).toBe(10);
      expect(round.warning).toBe('catalog_insufficient');
    });

    it('lanza error si candidates está vacío', () => {
      expect(() => selectExercisesForRound([], 'technique')).toThrow('No exercises available for this track');
    });

    it('lanza error si category es inválida', () => {
      expect(() => selectExercisesForRound([{ _id: 'e1', expertMinutes: 5 }], 'unknown')).toThrow(
        'Invalid category'
      );
    });
  });
});
