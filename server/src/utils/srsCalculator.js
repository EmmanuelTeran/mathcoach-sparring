/**
 * Algoritmo SRS (adaptación de SM-2 para DevCoach Sparring)
 *
 * @param {number} currentStage - Nivel actual de repetición (0, 1, 2, ...)
 * @param {number} easeFactor - Factor de facilidad previo (mínimo 1.3, default 2.5)
 * @param {number} score - Calificación de la sesión (1 a 5)
 * @param {number} [previousInterval=0] - Intervalo en días previo (opcional, default 0)
 * @returns {{ srsStage: number, easeFactor: number, intervalDays: number, nextReviewAt: Date }}
 */
export function calculateNextReview(currentStage, easeFactor, score, previousInterval = 0) {
  let srsStage = Number(currentStage) || 0;
  let ef = typeof easeFactor === 'number' && !isNaN(easeFactor) ? easeFactor : 2.5;
  const s = Math.max(1, Math.min(5, Math.round(Number(score) || 1)));

  // Fórmula estándar SM-2 para ajuste del Ease Factor:
  // EF' = EF + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02))
  const delta = 0.1 - (5 - s) * (0.08 + (5 - s) * 0.02);
  ef = parseFloat((ef + delta).toFixed(2));
  if (ef < 1.3) {
    ef = 1.3;
  }

  let intervalDays = 1;

  if (s < 3) {
    // Scores 1 y 2 (fallo o duda severa): reinicio total a etapa 0 y 1 día de intervalo
    srsStage = 0;
    intervalDays = 1;
  } else if (s === 3) {
    // Score 3 (aprobado raspado): intervalo corto de 3 días
    // Si estaba en 0 avanza a 1, si ya estaba avanzado mantiene la etapa
    srsStage = srsStage === 0 ? 1 : srsStage + 1;
    intervalDays = 3;
  } else {
    // Scores 4 y 5 (buen rendimiento / dominio)
    if (srsStage === 0) {
      srsStage = 1;
      intervalDays = 1;
    } else if (srsStage === 1) {
      srsStage = 2;
      intervalDays = 6;
    } else {
      // srsStage >= 2: escalado exponencial usando easeFactor
      const baseInterval = previousInterval > 0 ? previousInterval : 6;
      intervalDays = Math.max(1, Math.round(baseInterval * ef));
      srsStage += 1;
    }
  }

  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    srsStage,
    easeFactor: ef,
    intervalDays,
    nextReviewAt,
  };
}
