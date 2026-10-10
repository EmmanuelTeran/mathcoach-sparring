import { describe, it, expect } from 'vitest';
import { selectExercisesForRound } from '../src/services/roundBuilder.js';

describe('roundBuilder Service (selectExercisesForRound)', () => {
  describe('Límites y Presupuesto por Categoría (ROUND_BUDGETS: Técnica 30 min / Aplicación 30 min / Demostración 15 min)', () => {
    it('Técnica con ejercicios cortos (2 min c/u): acumula hasta >= 30 min (15 ejercicios = 30 min)', () => {
      // 20 ejercicios de 2 min
      const candidates = Array.from({ length: 20 }, (_, i) => ({
        _id: `ex-${i + 1}`,
        order: i + 1,
        statement: `Ejercicio ${i + 1}`,
        expertMinutes: 2,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(15); // 15 * 2 = 30 min >= 30 min y >= 6 min
      expect(round.totalExpertMinutes).toBe(30);
      expect(round.warning).toBeUndefined();
    });

    it('Técnica con ejercicios de 1 min c/u: se detiene en el tope de 18 ejercicios (18 min acumulados)', () => {
      const candidates = Array.from({ length: 25 }, (_, i) => ({
        _id: `ex-${i + 1}`,
        order: i + 1,
        statement: `Ejercicio ${i + 1}`,
        expertMinutes: 1,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(18); // tope max: 18
      expect(round.totalExpertMinutes).toBe(18);
      expect(round.warning).toBeUndefined();
    });

    it('Técnica con ejercicios largos (5 min c/u): se detiene exactamente en 6 ejercicios al cumplir 30 min', () => {
      const candidates = Array.from({ length: 12 }, (_, i) => ({
        _id: `ex-${i + 1}`,
        order: i + 1,
        statement: `Ejercicio ${i + 1}`,
        expertMinutes: 5,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(6); // 6 * 5 = 30 min (cumple >= 30 min y min 6)
      expect(round.totalExpertMinutes).toBe(30);
      expect(round.warning).toBeUndefined();
    });

    it('Técnica con ejercicios de 10 min c/u: cumple el mínimo de 6 ejercicios aunque supere los 30 min', () => {
      // 3 ejercicios = 30 min (>= 30 min pero < min 6), necesita llegar a 6 ejercicios = 60 min
      const candidates = Array.from({ length: 10 }, (_, i) => ({
        _id: `ex-${i + 1}`,
        order: i + 1,
        statement: `Ejercicio ${i + 1}`,
        expertMinutes: 10,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(6);
      expect(round.totalExpertMinutes).toBe(60);
    });

    it('Aplicación con ejercicios largos (15 min c/u): genera ronda de 2 ejercicios (mínimo 2)', () => {
      const candidates = [
        {
          _id: 'app-1',
          order: 1,
          statement: 'Problema largo 1',
          expertMinutes: 15,
          timesServed: 0,
          lastServedAt: null,
        },
        {
          _id: 'app-2',
          order: 2,
          statement: 'Problema largo 2',
          expertMinutes: 15,
          timesServed: 0,
          lastServedAt: null,
        },
        {
          _id: 'app-3',
          order: 3,
          statement: 'Problema largo 3',
          expertMinutes: 15,
          timesServed: 0,
          lastServedAt: null,
        },
      ];

      const round = selectExercisesForRound(candidates, 'application');
      expect(round.exercises.length).toBe(2); // 15 + 15 = 30 min >= 30 min y cumple min 2
      expect(round.totalExpertMinutes).toBe(30);
      expect(round.exercises[0]._id).toBe('app-1');
      expect(round.exercises[1]._id).toBe('app-2');
    });

    it('Aplicación con ejercicios medianos (6 min c/u): acumula hasta 5 ejercicios (30 min)', () => {
      const candidates = Array.from({ length: 8 }, (_, i) => ({
        _id: `app-${i + 1}`,
        order: i + 1,
        statement: `Problema ${i + 1}`,
        expertMinutes: 6,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'application');
      expect(round.exercises.length).toBe(5); // 5 * 6 = 30 min >= 30 min
      expect(round.totalExpertMinutes).toBe(30);
    });

    it('Aplicación con ejercicios cortos (2 min c/u): se detiene en el tope de 6 ejercicios (12 min)', () => {
      const candidates = Array.from({ length: 10 }, (_, i) => ({
        _id: `app-${i + 1}`,
        order: i + 1,
        statement: `Problema corto ${i + 1}`,
        expertMinutes: 2,
        timesServed: 0,
        lastServedAt: null,
      }));

      const round = selectExercisesForRound(candidates, 'application');
      expect(round.exercises.length).toBe(6); // max 6
      expect(round.totalExpertMinutes).toBe(12);
    });

    it('Demostración: con 5 candidatos de 10 min c/u, toma exactamente 1 solo ejercicio (15 min nominales)', () => {
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
        { _id: 'e5', order: 5, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e6', order: 6, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e7', order: 7, expertMinutes: 5, timesServed: 1, lastServedAt: null },
      ];

      const round = selectExercisesForRound(candidates, 'technique');
      // 6 ejercicios de 5 min = 30 min. Prioridad a timesServed 0 (e2, e4, e5, e6) y luego timesServed 1 (e3, e7)
      const ids = round.exercises.map((e) => e._id);
      expect(ids).toContain('e2');
      expect(ids).toContain('e4');
      expect(ids).toContain('e5');
      expect(ids).toContain('e6');
      expect(ids).toContain('e3');
      expect(ids).toContain('e7');
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
      // 2 ejercicios en Aplicación para cumplir min: 2
      const candidates = [
        { _id: 'e1', order: 10, expertMinutes: 15, timesServed: 1, lastServedAt: null },
        { _id: 'e2', order: 20, expertMinutes: 15, timesServed: 0, lastServedAt: null },
        { _id: 'e3', order: 5, expertMinutes: 15, timesServed: 0, lastServedAt: null },
      ];

      const round = selectExercisesForRound(candidates, 'application');
      expect(round.exercises.length).toBe(2);
      // Los seleccionados deben ser e2 (order 20, timesServed 0) y e3 (order 5, timesServed 0)
      // Pero entregados al estudiante ordenados por order ASC: [order 5, order 20]
      const orders = round.exercises.map((e) => e.order);
      expect(orders).toEqual([5, 20]);
      expect(round.exercises.map((e) => e._id)).toEqual(['e3', 'e2']);
    });
  });

  describe('Catálogo Insuficiente / Errores', () => {
    it('agrega warning: "catalog_insufficient" cuando hay menos ejercicios que el mínimo de Técnica (min 6)', () => {
      // Técnica requiere al menos 6 ejercicios. Si sólo hay 3, se devuelven los 3 con warning
      const candidates = [
        { _id: 'e1', order: 1, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e2', order: 2, expertMinutes: 5, timesServed: 0, lastServedAt: null },
        { _id: 'e3', order: 3, expertMinutes: 5, timesServed: 0, lastServedAt: null },
      ];

      const round = selectExercisesForRound(candidates, 'technique');
      expect(round.exercises.length).toBe(3);
      expect(round.totalExpertMinutes).toBe(15);
      expect(round.warning).toBe('catalog_insufficient');
    });

    it('agrega warning: "catalog_insufficient" cuando hay menos ejercicios que el mínimo de Aplicación (min 2)', () => {
      // Aplicación requiere al menos 2 ejercicios. Si sólo hay 1, se devuelve con warning
      const candidates = [
        { _id: 'e1', order: 1, expertMinutes: 15, timesServed: 0, lastServedAt: null },
      ];

      const round = selectExercisesForRound(candidates, 'application');
      expect(round.exercises.length).toBe(1);
      expect(round.totalExpertMinutes).toBe(15);
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

