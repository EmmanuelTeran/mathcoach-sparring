import { TopicTrack } from '../models/TopicTrack.js';
import { VALID_CATEGORIES } from '../config/categories.js';

/**
 * Garantiza de forma idempotente que un tema posea exactamente sus 3 pistas
 * (technique, application, proof) con dificultad inicial 1 y parámetros SM-2 por defecto.
 *
 * @param {string|import('mongoose').Types.ObjectId} topicId
 * @returns {Promise<Array<import('../models/TopicTrack.js').TopicTrack>>}
 */
export async function ensureTracksForTopic(topicId) {
  if (!topicId) {
    throw new Error('topicId is required');
  }

  const trackPromises = VALID_CATEGORIES.map(async (category) => {
    return TopicTrack.findOneAndUpdate(
      { topicId, category },
      {
        $setOnInsert: {
          difficulty: 1,
          repetition: 0,
          interval: 0,
          efactor: 2.5,
          dueDate: new Date(),
          lastRoundScore: null,
          roundsCompleted: 0,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  });

  return Promise.all(trackPromises);
}
