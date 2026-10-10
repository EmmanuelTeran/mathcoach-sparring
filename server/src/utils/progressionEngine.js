import {
  PROMOTION_MIN_SCORE,
  PROMOTION_MIN_PASS_RATE,
  PROMOTION_INTERVAL_DAYS,
  EXERCISE_PASS_SCORE,
  ROUND_PASS_SCORE,
  MIN_DIFFICULTY,
  MAX_DIFFICULTY,
} from '../config/progression.js';
import { calculateNextReview } from './srsCalculator.js';

/**
 * @typedef {Object} TrackState
 * @property {number} difficulty - Dificultad actual de la pista (1, 2 o 3).
 * @property {number} [repetition=0] - Repeticiones consecutivas previas.
 * @property {number} [interval=0] - Intervalo previo en días.
 * @property {number} [efactor=2.5] - Factor de facilidad SM-2 previo (mínimo 1.3).
 */

/**
 * @typedef {Object} SrsState
 * @property {number} repetition - Nueva etapa de repetición.
 * @property {number} interval - Nuevo intervalo en días.
 * @property {number} efactor - Factor de facilidad actualizado (>= 1.3).
 * @property {Date} dueDate - Fecha exacta del próximo repaso.
 */

/**
 * @typedef {Object} RoundOutcome
 * @property {number} roundScore - Promedio aritmético redondeado estrictamente a 1 decimal.
 * @property {number} passRate - Proporción de ejercicios con score >= 3 (0.0 a 1.0).
 * @property {boolean} promoted - true si asciende de dificultad para el próximo repaso.
 * @property {number} newDifficulty - Nueva dificultad (1, 2 o 3; nunca inferior a track.difficulty).
 * @property {SrsState} srs - Estado SM-2 actualizado.
 */

/**
 * Evalúa el resultado de una ronda y computa la nueva dificultad y el nuevo estado SRS.
 * Implementación funcional pura, sin efectos secundarios.
 *
 * @param {Object} params
 * @param {number[]} params.scores - Calificaciones individuales de cada ejercicio (rango 0 a 5).
 * @param {TrackState} params.track - Estado actual de la pista.
 * @param {Date|number} [params.now=new Date()] - Instante base para el cómputo de dueDate.
 * @returns {RoundOutcome}
 */
export function computeRoundOutcome({ scores, track, now = new Date() }) {
  // 1. Validación defensiva exhaustiva
  if (!Array.isArray(scores) || scores.length === 0) {
    throw new Error('scores must be a non-empty array of numbers');
  }

  for (const s of scores) {
    if (typeof s !== 'number' || !Number.isFinite(s) || s < 0 || s > 5) {
      throw new Error('Each score must be a number between 0 and 5');
    }
  }

  if (
    !track ||
    typeof track !== 'object' ||
    typeof track.difficulty !== 'number' ||
    ![1, 2, 3].includes(track.difficulty)
  ) {
    throw new Error('track.difficulty must be 1, 2, or 3');
  }

  const baseNow = now instanceof Date ? now : new Date(now);

  // 2. Cálculo de métricas de ronda
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const rawAverage = sum / scores.length;
  // Redondeo formal a 1 decimal
  const roundScore = Math.round(rawAverage * 10) / 10;

  const passedCount = scores.filter((s) => s >= EXERCISE_PASS_SCORE).length;
  const passRate = passedCount / scores.length;

  // 3. Regla de promoción estricta (§1.2)
  const canPromote =
    track.difficulty < MAX_DIFFICULTY &&
    roundScore >= PROMOTION_MIN_SCORE &&
    passRate >= PROMOTION_MIN_PASS_RATE;

  const promoted = Boolean(canPromote);
  const newDifficulty = promoted ? track.difficulty + 1 : track.difficulty;

  // 4. Parámetros previos de SRS (con fallbacks robustos)
  const prevRepetition = typeof track.repetition === 'number' && Number.isFinite(track.repetition)
    ? track.repetition
    : 0;
  const prevInterval = typeof track.interval === 'number' && Number.isFinite(track.interval)
    ? track.interval
    : 0;
  const prevEfactor = typeof track.efactor === 'number' && Number.isFinite(track.efactor)
    ? track.efactor
    : 2.5;

  const roundedScoreInt = Math.round(roundScore);

  let srs;

  if (promoted) {
    // Caso Promoción:
    // Ascenso de nivel: repetition = 1, interval = PROMOTION_INTERVAL_DAYS (3 días)
    // efactor actualizado mediante fórmula SM-2 con la nota redondeada
    const standardSrs = calculateNextReview(prevRepetition, prevEfactor, roundedScoreInt, prevInterval);
    const dueDate = new Date(baseNow.getTime() + PROMOTION_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

    srs = {
      repetition: 1,
      interval: PROMOTION_INTERVAL_DAYS,
      efactor: standardSrs.efactor,
      dueDate,
    };
  } else if (roundScore < ROUND_PASS_SCORE) {
    // Caso Fallo (roundScore < 3.0):
    // Reinicio total SM-2: repetition = 0, interval = 1 día
    const standardSrs = calculateNextReview(prevRepetition, prevEfactor, roundedScoreInt, prevInterval);
    const dueDate = new Date(baseNow.getTime() + 1 * 24 * 60 * 60 * 1000);

    srs = {
      repetition: 0,
      interval: 1,
      efactor: standardSrs.efactor,
      dueDate,
    };
  } else {
    // Caso Aprobada sin Promoción o Dificultad 3 con Alto Rendimiento:
    // SM-2 estándar
    const standardSrs = calculateNextReview(prevRepetition, prevEfactor, roundedScoreInt, prevInterval);
    const dueDate = new Date(baseNow.getTime() + standardSrs.interval * 24 * 60 * 60 * 1000);

    srs = {
      repetition: standardSrs.repetition,
      interval: standardSrs.interval,
      efactor: standardSrs.efactor,
      dueDate,
    };
  }

  return {
    roundScore,
    passRate,
    promoted,
    newDifficulty,
    srs,
  };
}
