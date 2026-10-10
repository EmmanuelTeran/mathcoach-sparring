import express from 'express';
import { MathTopic } from '../models/MathTopic.js';
import { TopicTrack } from '../models/TopicTrack.js';
import { ensureTracksForTopic } from '../services/trackService.js';

export const topicsRouter = express.Router();

/**
 * GET /api/topics
 * Devuelve la lista ordenada de temas curriculares, cada uno enriquecido
 * con sus 3 pistas de progreso (technique, application, proof).
 */
topicsRouter.get('/', async (req, res) => {
  try {
    const topics = await MathTopic.find().sort({ order: 1, createdAt: 1 }).lean();

    const enrichedTopics = await Promise.all(
      topics.map(async (topic) => {
        let tracks = await TopicTrack.find({ topicId: topic._id }).lean();

        // Si el tema aún no tiene sus pistas creadas en BD, las inicializa de forma idempotente
        if (!tracks || tracks.length < 3) {
          await ensureTracksForTopic(topic._id);
          tracks = await TopicTrack.find({ topicId: topic._id }).lean();
        }

        // Ordenar pistas consistentemente: technique, application, proof
        const categoryOrder = { technique: 1, application: 2, proof: 3 };
        tracks.sort((a, b) => (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99));

        return {
          ...topic,
          tracks,
        };
      })
    );

    return res.status(200).json(enrichedTopics);
  } catch (error) {
    console.error('Error fetching topics with tracks:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
