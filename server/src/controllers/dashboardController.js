/**
 * Stub compatible temporal de Dashboard Summary para MATH-US-08
 * Mantiene la compatibilidad con el frontend mientras llega el rediseño de MATH-US-14.
 */
export async function getDashboardSummary(req, res) {
  try {
    return res.status(200).json({
      dueCount: 0,
      criticalTopics: [],
      recommendedNext: null,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
