import { Topic } from '../models/Topic.js';
import { SessionLog } from '../models/SessionLog.js';

/**
 * Normaliza y extrae posibles palabras clave o subcategorías a partir de un título.
 * Por ejemplo: "React Fiber Architecture" -> ["react", "fiber"]
 * Permite emparejar temas teóricos y prácticos relacionados.
 */
function extractKeywords(title) {
  if (!title) return [];
  const stopwords = new Set([
    'de', 'la', 'el', 'en', 'y', 'a', 'para', 'con', 'por', 'sobre', 'vs',
    'the', 'and', 'of', 'in', 'to', 'for', 'with', 'on', 'at'
  ]);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ\s]/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word));
}

/**
 * Determina si dos temas están relacionados temáticamente (misma subcategoría/tema).
 */
function areTopicsRelated(titleA, titleB) {
  const kwA = extractKeywords(titleA);
  const kwB = extractKeywords(titleB);
  return kwA.some((word) => kwB.includes(word));
}

/**
 * Helper para obtener el último score registrado de un tema
 * Revisa el último elemento de topic.history o una consulta a SessionLog.
 */
function getLastScore(topic, sessionLogsByTopic = {}) {
  if (topic.history && topic.history.length > 0) {
    return topic.history[topic.history.length - 1].score;
  }
  if (sessionLogsByTopic[topic._id.toString()]) {
    return sessionLogsByTopic[topic._id.toString()];
  }
  return null;
}

/**
 * GET /api/dashboard/summary
 * Métricas consolidadas:
 * - dueCount: total de temas pendientes para hoy (nextReviewAt <= Date.now())
 * - dueHardSkills: cantidad de retos técnicos pendientes (type === 'theory' o category === 'hard_skill')
 * - dueSoftSkills: cantidad de simulaciones pendientes (type === 'practice' o category === 'soft_skill')
 * - criticalTopics: lista de temas cuyo último score registrado sea < 3 (ordenados de menor a mayor calificación)
 * - recommendedNext: tema más urgente seleccionado con lógica de acoplamiento:
 *   Si el tema más urgente es una soft skill, pero existe una contraparte técnica
 *   (o temas relacionados) con score < 3 (o pendiente crítica), se recomienda primero el reto de hard skill.
 */
export async function getDashboardSummary(req, res) {
  try {
    const now = new Date();
    const { level } = req.query;

    // Validar nivel si se proporciona
    const validLevels = ['junior', 'mid', 'senior'];
    const levelFilter = level && validLevels.includes(level) ? { level } : {};

    // 1. Obtener todos los temas pendientes para hoy (nextReviewAt <= now), con filtro opcional por nivel
    const dueTopics = await Topic.find({
      nextReviewAt: { $lte: now },
      ...levelFilter,
    }).lean();

    // Conteo total y desglose
    const dueCount = dueTopics.length;
    // Categorización estándar: hard skills (category: 'hard_skill' o type: 'theory' si no tiene categoría), soft skills (category: 'soft_skill' o type: 'practice' si no tiene categoría)
    const dueHardSkills = dueTopics.filter(
      (t) => t.category === 'hard_skill' || (!t.category && t.type === 'theory')
    ).length;
    const dueSoftSkills = dueTopics.filter(
      (t) => t.category === 'soft_skill' || (!t.category && t.type === 'practice')
    ).length;

    // 2. Obtener todos los tópicos para evaluar áreas críticas (scores < 3), con filtro opcional por nivel
    const allTopics = await Topic.find({ ...levelFilter }).lean();

    // Obtener los últimos logs de sesiones para temas que tal vez no tengan history en Topic
    const recentSessions = await SessionLog.aggregate([
      { $sort: { reviewedAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$topicId',
          latestScore: { $first: '$score' },
          latestFeedback: { $first: '$feedback' },
        },
      },
    ]);

    const sessionScoreMap = {};
    for (const session of recentSessions) {
      if (session._id) {
        sessionScoreMap[session._id.toString()] = session.latestScore;
      }
    }

    // Identificar temas críticos: último score registrado < 3
    const criticalTopicsWithScore = [];
    for (const topic of allTopics) {
      const lastScore = getLastScore(topic, sessionScoreMap);
      if (lastScore !== null && lastScore < 3) {
        criticalTopicsWithScore.push({
          _id: topic._id,
          title: topic.title,
          category: topic.category,
          type: topic.type,
          lastScore,
          srsStage: topic.srsStage,
          nextReviewAt: topic.nextReviewAt,
        });
      }
    }

    // Ordenar temas críticos de menor a mayor calificación (1 primero, luego 2)
    criticalTopicsWithScore.sort((a, b) => {
      if (a.lastScore !== b.lastScore) {
        return a.lastScore - b.lastScore;
      }
      return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
    });

    // 3. Determinar recomendación acoplada (recommendedNext)
    // Ordenar temas pendientes por urgencia (mayor retraso / fecha más antigua primero)
    const sortedDue = [...dueTopics].sort((a, b) => {
      const scoreA = getLastScore(a, sessionScoreMap) ?? 3;
      const scoreB = getLastScore(b, sessionScoreMap) ?? 3;
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
    });

    let recommendedNext = null;

    if (sortedDue.length > 0) {
      const candidate = sortedDue[0];

      // Verificamos si candidate es soft skill
      const isCandidateSoft =
        candidate.category === 'soft_skill' || candidate.type === 'practice';

      if (isCandidateSoft) {
        // Regla de acoplamiento:
        // Si el tema seleccionado es soft skill pero su contraparte técnica (o temas de la misma subcategoría)
        // tiene calificación < 3, recomienda primero el reto de hard skill para asegurar las bases teóricas
        // antes de la defensa verbal.
        const relatedHardCritical = criticalTopicsWithScore.find(
          (t) =>
            (t.category === 'hard_skill' || t.type === 'theory') &&
            areTopicsRelated(t.title, candidate.title)
        );

        if (relatedHardCritical) {
          const matchedTopic = allTopics.find(
            (t) => t._id.toString() === relatedHardCritical._id.toString()
          );
          recommendedNext = matchedTopic || candidate;
        } else {
          recommendedNext = candidate;
        }
      } else {
        recommendedNext = candidate;
      }
    } else if (criticalTopicsWithScore.length > 0) {
      // Si no hay pendientes para hoy pero hay áreas críticas, sugerir la más deficiente
      const topCritical = criticalTopicsWithScore[0];
      recommendedNext = allTopics.find(
        (t) => t._id.toString() === topCritical._id.toString()
      ) || null;
    }

    return res.status(200).json({
      dueCount,
      dueHardSkills,
      dueSoftSkills,
      criticalTopics: criticalTopicsWithScore,
      recommendedNext,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
