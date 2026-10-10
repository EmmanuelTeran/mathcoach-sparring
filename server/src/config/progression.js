/**
 * Constantes y umbrales de progresión adaptativa y composición de rondas.
 * Fuente de verdad: .antigravity/graph.md (§1.1, §1.2, §1.3).
 */

/** Puntuación promedio mínima de ronda para aspirar a promoción (escala 0-5). */
export const PROMOTION_MIN_SCORE = 4.0;

/** Tasa mínima de aprobación (ejercicios con score >= 3) para aspirar a promoción. */
export const PROMOTION_MIN_PASS_RATE = 0.8;

/** Intervalo fijo de días para el primer repaso tras ascender de dificultad. */
export const PROMOTION_INTERVAL_DAYS = 3;

/** Presupuesto de tiempo experto en minutos por ronda de práctica (legado / fallback). */
export const ROUND_BUDGET_MIN = 15;

/** Presupuestos de tiempo experto en minutos por categoría (§1.1 de graph.md). */
export const ROUND_BUDGETS = {
  technique: 30,
  application: 30,
  proof: 15,
};

/** Score mínimo considerado como ejercicio aprobado individualmente. */
export const EXERCISE_PASS_SCORE = 3;

/** Score mínimo considerado como ronda aprobada globalmente (evita reinicio SM-2). */
export const ROUND_PASS_SCORE = 3.0;

/** Dificultad mínima en el sistema. */
export const MIN_DIFFICULTY = 1;

/** Dificultad máxima en el sistema (tope adaptativo). */
export const MAX_DIFFICULTY = 3;

/** Límites de cantidad de ejercicios por categoría en una ronda (§1.1 de graph.md). */
export const CATEGORY_LIMITS = {
  technique: { min: 6, max: 18 },
  application: { min: 2, max: 6 },
  proof: { min: 1, max: 1 },
};
