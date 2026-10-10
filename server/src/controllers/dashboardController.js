import { MathTopic } from '../models/MathTopic.js';
import { TopicTrack } from '../models/TopicTrack.js';

/**
 * GET /api/dashboard/summary
 * Métricas de resumen para la vista del Dashboard de MathCoach Sparring:
 * - dueCount: Conteo total de pistas con dueDate <= now
 * - dueByCategory: Desglose de pistas vencidas por categoría (technique, application, proof)
 * - nextRecommended: Pista prioritaria recomendada por SRS (coherente con /api/rounds/queue)
 * - criticalTracks: Pistas con lastRoundScore !== null && lastRoundScore < 3 (ordenadas asc por score)
 * - topics: Lista de todos los MathTopic (ordenados por order asc) con sus TopicTracks proyectados
 */
export async function getDashboardSummary(req, res) {
  try {
    const now = new Date();

    // 1. Obtener todos los temas ordenados por 'order' ascendente
    const allTopics = await MathTopic.find({}).sort({ order: 1 }).lean();

    // 2. Obtener todas las pistas de la base de datos
    const allTracks = await TopicTrack.find({})
      .populate('topicId', 'title slug')
      .lean();

    // 3. Pistas vencidas: dueDate <= now
    const dueTracks = allTracks.filter((track) => track.dueDate && new Date(track.dueDate) <= now);

    const dueCount = dueTracks.length;
    const dueByCategory = {
      technique: dueTracks.filter((t) => t.category === 'technique').length,
      application: dueTracks.filter((t) => t.category === 'application').length,
      proof: dueTracks.filter((t) => t.category === 'proof').length,
    };

    // 4. Determinar nextRecommended con orden idéntico a /api/rounds/queue:
    //    1. lastRoundScore ASC (null primero)
    //    2. dueDate ASC (mayor retraso primero)
    let nextRecommended = null;
    if (dueTracks.length > 0) {
      const sortedDueTracks = [...dueTracks].sort((a, b) => {
        const scoreA = a.lastRoundScore;
        const scoreB = b.lastRoundScore;

        if (scoreA === null && scoreB !== null) return -1;
        if (scoreA !== null && scoreB === null) return 1;
        if (scoreA !== null && scoreB !== null && scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        const dueTimeA = new Date(a.dueDate).getTime();
        const dueTimeB = new Date(b.dueDate).getTime();
        return dueTimeA - dueTimeB;
      });

      const topTrack = sortedDueTracks[0];
      nextRecommended = {
        trackId: topTrack._id,
        topic: topTrack.topicId
          ? {
              _id: topTrack.topicId._id,
              title: topTrack.topicId.title,
            }
          : null,
        category: topTrack.category,
        difficulty: topTrack.difficulty,
      };
    }

    // 5. Pistas críticas: lastRoundScore !== null && lastRoundScore < 3
    //    Ordenadas por lastRoundScore ascendente
    const criticalTracksRaw = allTracks.filter(
      (track) => track.lastRoundScore !== null && track.lastRoundScore !== undefined && track.lastRoundScore < 3
    );

    criticalTracksRaw.sort((a, b) => a.lastRoundScore - b.lastRoundScore);

    const criticalTracks = criticalTracksRaw.map((track) => ({
      topic: track.topicId
        ? {
            _id: track.topicId._id,
            title: track.topicId.title,
          }
        : null,
      category: track.category,
      difficulty: track.difficulty,
      lastRoundScore: track.lastRoundScore,
    }));

    // 6. Matriz jerárquica por tema:
    // Agrupar pistas por topicId
    const tracksByTopicId = new Map();
    for (const track of allTracks) {
      const topicIdStr = track.topicId?._id ? track.topicId._id.toString() : track.topicId?.toString();
      if (!topicIdStr) continue;
      if (!tracksByTopicId.has(topicIdStr)) {
        tracksByTopicId.set(topicIdStr, []);
      }
      tracksByTopicId.get(topicIdStr).push({
        category: track.category,
        difficulty: track.difficulty,
        dueDate: track.dueDate,
        lastRoundScore: track.lastRoundScore,
      });
    }

    const topics = allTopics.map((topic) => ({
      _id: topic._id,
      title: topic.title,
      area: topic.area,
      tracks: tracksByTopicId.get(topic._id.toString()) || [],
    }));

    return res.status(200).json({
      dueCount,
      dueByCategory,
      nextRecommended,
      criticalTracks,
      topics,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
