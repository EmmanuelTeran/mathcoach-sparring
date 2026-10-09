import express from 'express';
import { Topic } from '../models/Topic.js';
import { calculateNextReview } from '../utils/srsCalculator.js';

export const topicsRouter = express.Router();

/**
 * GET /api/topics/due
 * Devuelve temas con nextReviewAt <= Date.now() ordenados por prioridad:
 * - Menor score promedio histórico primero (temas más problemáticos)
 * - Mayor retraso (nextReviewAt más antiguo primero)
 */
topicsRouter.get('/due', async (req, res) => {
  try {
    const now = new Date();
    const { level } = req.query;

    const validLevels = ['junior', 'mid', 'senior'];
    const levelFilter = level && validLevels.includes(level) ? { level } : {};

    // Filtramos tópicos cuya fecha de próxima revisión sea menor o igual a ahora
    const dueTopics = await Topic.find({
      nextReviewAt: { $lte: now },
      ...levelFilter,
    }).lean();

    // Ordenamiento por prioridad:
    // 1. Menor score histórico (promedio de history o 0 si no tiene historial)
    // 2. Mayor retraso (nextReviewAt ascendente, es decir, el más vencido primero)
    dueTopics.sort((a, b) => {
      const avgScoreA = a.history && a.history.length > 0
        ? a.history.reduce((acc, h) => acc + h.score, 0) / a.history.length
        : 0;
      const avgScoreB = b.history && b.history.length > 0
        ? b.history.reduce((acc, h) => acc + h.score, 0) / b.history.length
        : 0;

      if (avgScoreA !== avgScoreB) {
        return avgScoreA - avgScoreB; // Menor score histórico primero
      }

      const dateA = new Date(a.nextReviewAt).getTime();
      const dateB = new Date(b.nextReviewAt).getTime();
      return dateA - dateB; // Mayor retraso (fecha más antigua) primero
    });

    return res.status(200).json(dueTopics);
  } catch (error) {
    console.error('Error fetching due topics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/topics/review
 * Body: { topicId, score, userInput, aiFeedback }
 * Aplica el cálculo de srsCalculator, registra el log en el historial y actualiza el tópico en Mongo
 */
topicsRouter.post('/review', async (req, res) => {
  try {
    const { topicId, score, userInput = '', aiFeedback = '' } = req.body;

    if (!topicId || score === undefined || score === null) {
      return res.status(400).json({ error: 'topicId and score (1-5) are required' });
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 1 || numScore > 5) {
      return res.status(400).json({ error: 'score must be a number between 1 and 5' });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Calcular nuevos valores SRS
    const srsResult = calculateNextReview(
      topic.srsStage,
      topic.easeFactor,
      numScore,
      topic.intervalDays
    );

    // Actualizar campos del modelo
    topic.srsStage = srsResult.srsStage;
    topic.easeFactor = srsResult.easeFactor;
    topic.intervalDays = srsResult.intervalDays;
    topic.nextReviewAt = srsResult.nextReviewAt;

    // Agregar subdocumento a history
    topic.history.push({
      score: numScore,
      userInput,
      aiFeedback,
      reviewedAt: new Date(),
    });

    await topic.save();

    return res.status(200).json({
      message: 'Review recorded successfully',
      topic,
    });
  } catch (error) {
    console.error('Error recording topic review:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
