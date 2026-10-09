/**
 * Igualdad estructural para comparación de resultados de tests.
 * Arrays sensibles al orden, Objetos insensibles al orden de claves.
 */
export function deepEqual(a, b) {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (a === null || b === null || typeof a !== 'object') {
    return Number.isNaN(a) && Number.isNaN(b);
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

function serializeValue(val) {
  if (typeof val === 'string') return val;
  try {
    const json = JSON.stringify(val);
    return json !== undefined ? json : String(val);
  } catch (err) {
    return String(val);
  }
}

/**
 * @param {Object} params
 * @param {string} params.code
 * @param {string} params.functionName
 * @param {Array<{input: any[], expected: any, isHidden?: boolean}>} params.testCases
 * @returns {import('./codeRunner').RunReport}
 */
export function executeTests({ code, functionName, testCases = [] }) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const logs = [];

  const fakeConsole = {
    log: (...args) => {
      if (logs.length < 200) {
        logs.push({ level: 'log', message: args.map(serializeValue).join(' ') });
      }
    },
    info: (...args) => {
      if (logs.length < 200) {
        logs.push({ level: 'info', message: args.map(serializeValue).join(' ') });
      }
    },
    warn: (...args) => {
      if (logs.length < 200) {
        logs.push({ level: 'warn', message: args.map(serializeValue).join(' ') });
      }
    },
    error: (...args) => {
      if (logs.length < 200) {
        logs.push({ level: 'error', message: args.map(serializeValue).join(' ') });
      }
    },
  };

  let fn;
  try {
    const fnConstructor = new Function(
      'console',
      '"use strict";\n' + code + '\n;return typeof ' + functionName + " === 'function' ? " + functionName + ' : undefined;'
    );
    fn = fnConstructor(fakeConsole);
  } catch (err) {
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      status: 'ERROR',
      passedCount: 0,
      totalCount: testCases.length,
      executionTimeMs: Math.max(0, Math.round((endTime - startTime) * 100) / 100),
      logs,
      results: [],
      error: {
        type: 'SyntaxError',
        message: err.message || 'Error de sintaxis en el código',
      },
    };
  }

  if (typeof fn !== 'function') {
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      status: 'ERROR',
      passedCount: 0,
      totalCount: testCases.length,
      executionTimeMs: Math.max(0, Math.round((endTime - startTime) * 100) / 100),
      logs,
      results: [],
      error: {
        type: 'ReferenceError',
        message: `La función "${functionName}" no está definida`,
      },
    };
  }

  let passedCount = 0;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const testInput = structuredClone(tc.input);
    const testStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let actual = undefined;
    let testError = undefined;
    let isPassed = false;

    try {
      actual = fn(...testInput);
      isPassed = deepEqual(actual, tc.expected);
    } catch (err) {
      isPassed = false;
      const errName = err.name || 'Error';
      const errMsg = err.message || String(err);
      testError = `${errName}: ${errMsg}`;
    }

    const testEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const testDuration = Math.max(0, Math.round((testEnd - testStart) * 100) / 100);

    if (isPassed) {
      passedCount++;
    }

    results.push({
      index: i,
      status: isPassed ? 'PASSED' : 'FAILED',
      input: tc.input,
      expected: tc.expected,
      actual,
      isHidden: !!tc.isHidden,
      executionTimeMs: testDuration,
      ...(testError ? { error: testError } : {}),
    });
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const executionTimeMs = Math.max(0, Math.round((endTime - startTime) * 100) / 100);

  return {
    status: passedCount === testCases.length ? 'PASSED' : 'FAILED',
    passedCount,
    totalCount: testCases.length,
    executionTimeMs,
    logs,
    results,
  };
}

/**
 * Ejecuta los tests en un Web Worker aislado con timeout. (Solo navegador)
 */
export function runCodeInWorker({ code, functionName, testCases, timeoutMs = 3000 }) {
  return new Promise((resolve) => {
    let worker;
    let timer;

    try {
      worker = new Worker(new URL('../workers/codeRunner.worker.js', import.meta.url), {
        type: 'module',
      });
    } catch (err) {
      // Fallback si Web Worker no puede instanciarse directamente
      const report = executeTests({ code, functionName, testCases });
      return resolve(report);
    }

    timer = setTimeout(() => {
      if (worker) {
        worker.terminate();
      }
      resolve({
        status: 'TIMEOUT',
        passedCount: 0,
        totalCount: testCases.length,
        executionTimeMs: timeoutMs,
        logs: [],
        results: [],
        error: {
          type: 'TimeoutError',
          message: `La ejecución superó ${timeoutMs} ms (¿bucle infinito?)`,
        },
      });
    }, timeoutMs);

    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({
        status: 'ERROR',
        passedCount: 0,
        totalCount: testCases.length,
        executionTimeMs: 0,
        logs: [],
        results: [],
        error: {
          type: 'SyntaxError',
          message: err.message || 'Error en Worker',
        },
      });
    };

    worker.postMessage({ code, functionName, testCases });
  });
}
