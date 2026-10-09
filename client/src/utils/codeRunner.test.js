import { describe, it, expect } from 'vitest';
import { executeTests, deepEqual } from './codeRunner.js';

describe('codeRunner utils', () => {
  describe('deepEqual', () => {
    it('returns true for primitive equality and identical objects', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('hello', 'hello')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
    });

    it('returns false for mismatched types and values', () => {
      expect(deepEqual(0, false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual('1', 1)).toBe(false);
    });

    it('compares objects key-order insensitively', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    });

    it('compares arrays order-sensitively', () => {
      expect(deepEqual([1, 2], [1, 2])).toBe(true);
      expect(deepEqual([1, 2], [2, 1])).toBe(false);
      expect(deepEqual([[1, 6]], [[1, 6]])).toBe(true);
    });
  });

  describe('executeTests', () => {
    it('1. Código correcto → status PASSED, passedCount === totalCount, executionTimeMs >= 0', () => {
      const code = 'function add(a, b) { return a + b; }';
      const testCases = [
        { input: [1, 2], expected: 3 },
        { input: [10, -5], expected: 5 },
      ];
      const res = executeTests({ code, functionName: 'add', testCases });
      expect(res.status).toBe('PASSED');
      expect(res.passedCount).toBe(2);
      expect(res.totalCount).toBe(2);
      expect(res.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('2. Resultado incorrecto → test FAILED con expected y actual correctos; status FAILED', () => {
      const code = 'function add(a, b) { return a - b; }';
      const testCases = [{ input: [1, 2], expected: 3 }];
      const res = executeTests({ code, functionName: 'add', testCases });
      expect(res.status).toBe('FAILED');
      expect(res.results[0].status).toBe('FAILED');
      expect(res.results[0].expected).toBe(3);
      expect(res.results[0].actual).toBe(-1);
    });

    it('3. Código con error de sintaxis → status ERROR, error.type SyntaxError, results []', () => {
      const code = 'function f( {';
      const testCases = [{ input: [], expected: 1 }];
      const res = executeTests({ code, functionName: 'f', testCases });
      expect(res.status).toBe('ERROR');
      expect(res.error.type).toBe('SyntaxError');
      expect(res.results).toEqual([]);
    });

    it('4. Función inexistente → status ERROR, error.type ReferenceError, mensaje contiene functionName', () => {
      const code = 'const x = 10;';
      const testCases = [{ input: [], expected: 1 }];
      const res = executeTests({ code, functionName: 'missingFn', testCases });
      expect(res.status).toBe('ERROR');
      expect(res.error.type).toBe('ReferenceError');
      expect(res.error.message).toContain('missingFn');
      expect(res.results).toEqual([]);
    });

    it('5. throw en un solo caso → ese test FAILED con error que contiene mensaje; los demás se ejecutan y pasan', () => {
      const code = 'function check(n) { if (n === 0) throw new Error("Zero not allowed"); return n * 2; }';
      const testCases = [
        { input: [2], expected: 4 },
        { input: [0], expected: 0 },
        { input: [3], expected: 6 },
      ];
      const res = executeTests({ code, functionName: 'check', testCases });
      expect(res.status).toBe('FAILED');
      expect(res.passedCount).toBe(2);
      expect(res.results[1].status).toBe('FAILED');
      expect(res.results[1].error).toContain('Error: Zero not allowed');
      expect(res.results[2].status).toBe('PASSED');
    });

    it('6. console.log("a", 1) y console.warn({x:1}) → logs con mensajes serializados', () => {
      const code = 'function testLog() { console.log("a", 1); console.warn({x:1}); return true; }';
      const testCases = [{ input: [], expected: true }];
      const res = executeTests({ code, functionName: 'testLog', testCases });
      expect(res.logs).toEqual([
        { level: 'log', message: 'a 1' },
        { level: 'warn', message: '{"x":1}' },
      ]);
    });

    it('7. Límite de 200 logs respetado', () => {
      const code = 'function loopLog() { for(let i=0; i<300; i++) console.log(i); return true; }';
      const testCases = [{ input: [], expected: true }];
      const res = executeTests({ code, functionName: 'loopLog', testCases });
      expect(res.logs.length).toBe(200);
    });

    it('8. isHidden se propaga a results[i].isHidden', () => {
      const code = 'function f() { return 1; }';
      const testCases = [
        { input: [], expected: 1, isHidden: false },
        { input: [], expected: 1, isHidden: true },
      ];
      const res = executeTests({ code, functionName: 'f', testCases });
      expect(res.results[0].isHidden).toBe(false);
      expect(res.results[1].isHidden).toBe(true);
    });

    it('9. Aislamiento: código que muta su input no afecta al siguiente test con mismo objeto', () => {
      const sharedArray = [1, 2];
      const code = 'function mutate(arr) { arr.push(99); return arr.length; }';
      const testCases = [
        { input: [sharedArray], expected: 3 },
        { input: [sharedArray], expected: 3 },
      ];
      const res = executeTests({ code, functionName: 'mutate', testCases });
      expect(res.passedCount).toBe(2);
      expect(sharedArray).toEqual([1, 2]);
    });
  });
});
