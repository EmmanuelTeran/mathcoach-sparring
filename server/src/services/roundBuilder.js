import { Exercise } from '../models/Exercise.js';
import { ROUND_BUDGETS, ROUND_BUDGET_MIN, CATEGORY_LIMITS } from '../config/progression.js';

/**
 * Selecciona y conforma los ejercicios de una ronda según las reglas de negocio
 * de presupuesto temporal específico por categoría (ROUND_BUDGETS) y límites de categoría.
 *
 * Función síncrona / pura sobre una lista de ejercicios candidatos ya filtrados
 * por topicId, category y difficulty === track.difficulty.
 *
 * @param {Array<Object>} candidates Lista de ejercicios candidatos (pueden venir desordenados)
 * @param {string} category 'technique' | 'application' | 'proof'
 * @returns {{ exercises: Array<Object>, totalExpertMinutes: number, warning?: string }}
 */
export function selectExercisesForRound(candidates, category) {
  const limits = CATEGORY_LIMITS[category];
  if (!limits) {
    throw new Error(`Invalid category for round builder: ${category}`);
  }

  if (!candidates || candidates.length === 0) {
    throw new Error('No exercises available for this track');
  }

  const budgetMinutes = ROUND_BUDGETS[category] ?? ROUND_BUDGET_MIN;

  // Criterio de ordenamiento para selección (Rotación Justa):
  // 1. timesServed ASC (menos servidos primero)
  // 2. lastServedAt ASC (null primero, luego fecha más antigua)
  // 3. order ASC (desempate determinista)
  const sortedCandidates = [...candidates].sort((a, b) => {
    const timesA = a.timesServed ?? 0;
    const timesB = b.timesServed ?? 0;
    if (timesA !== timesB) {
      return timesA - timesB;
    }

    if (!a.lastServedAt && b.lastServedAt) return -1;
    if (a.lastServedAt && !b.lastServedAt) return 1;
    if (a.lastServedAt && b.lastServedAt) {
      const timeA = new Date(a.lastServedAt).getTime();
      const timeB = new Date(b.lastServedAt).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
    }

    return (a.order ?? 0) - (b.order ?? 0);
  });

  const selected = [];
  let totalMinutes = 0;

  for (const ex of sortedCandidates) {
    if (selected.length >= limits.max) {
      break;
    }

    selected.push(ex);
    totalMinutes += ex.expertMinutes;

    // Condición de parada según categoría y presupuesto
    if (category === 'proof') {
      // Demostración es exactamente 1 ejercicio (presupuesto nominal 15 min)
      break;
    } else if (category === 'application') {
      // Mínimo 2, máximo 6. Acumular hasta >= 30 min y al menos 2 ejercicios
      if (totalMinutes >= budgetMinutes && selected.length >= limits.min) {
        break;
      }
    } else if (category === 'technique') {
      // Mínimo 6, máximo 18. Acumular hasta >= 30 min y al menos 6 ejercicios
      if (totalMinutes >= budgetMinutes && selected.length >= limits.min) {
        break;
      }
    }
  }

  // Orden final de entrega al estudiante: order ASC (complejidad creciente)
  selected.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const result = {
    exercises: selected,
    totalExpertMinutes: totalMinutes,
  };

  if (selected.length < limits.min) {
    result.warning = 'catalog_insufficient';
  }

  return result;
}

/**
 * Orquesta la construcción completa de una ronda para un TopicTrack:
 * 1. Obtiene los ejercicios candidatos de la BD filtrando exactamente por topicId, category, track.difficulty.
 * 2. Si el catálogo está vacío (0 candidatos), lanza un error con status 422.
 * 3. Ejecuta selectExercisesForRound.
 * 4. Retorna el resultado estructurado para creación del snapshot.
 *
 * @param {import('../models/TopicTrack.js').TopicTrack} track
 * @returns {Promise<{
 *   exercises: Array<{ exerciseId: any, order: number, statement: string, expertMinutes: number }>,
 *   totalExpertMinutes: number,
 *   warning?: string
 * }>}
 */
export async function buildRound(track) {
  if (!track || !track.topicId || !track.category || !track.difficulty) {
    throw new Error('Valid track is required to build a round');
  }

  const candidates = await Exercise.find({
    topicId: track.topicId,
    category: track.category,
    difficulty: track.difficulty,
  }).lean();

  if (!candidates || candidates.length === 0) {
    const error = new Error('No exercises available for this track');
    error.statusCode = 422;
    throw error;
  }

  const selection = selectExercisesForRound(candidates, track.category);

  // Formato snapshot inmutable para el documento Round
  const snapshotExercises = selection.exercises.map((ex) => ({
    exerciseId: ex._id,
    order: ex.order,
    statement: ex.statement,
    expertMinutes: ex.expertMinutes,
  }));

  const response = {
    exercises: snapshotExercises,
    totalExpertMinutes: selection.totalExpertMinutes,
  };

  if (selection.warning) {
    response.warning = selection.warning;
  }

  return response;
}
