import express from 'express';
import { Topic } from '../models/Topic.js';
import { SessionLog } from '../models/SessionLog.js';
import { calculateNextReview } from '../utils/srsCalculator.js';
import { generateHardSkillChallenge, evaluateHardSkillSolution, generateHint } from '../services/geminiService.js';

export const practiceRouter = express.Router();

/**
 * POST /api/practice/hard-skill/generate
 * Body: { topicId }
 * Obtiene el tema de MongoDB y genera un reto técnico adaptado con Gemini
 */
practiceRouter.post('/hard-skill/generate', async (req, res) => {
  try {
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const challenge = await generateHardSkillChallenge(topic);

    return res.status(200).json({
      topicId: topic._id,
      title: topic.title,
      type: topic.type,
      category: topic.category,
      level: topic.level || 'junior',
      challenge,
    });
  } catch (error) {
    console.error('Error generating hard skill challenge:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/practice/hard-skill/evaluate
 * Body: { topicId, challenge, userSolution }
 * Evalúa la solución técnica con Gemini, recalcula SRS y persiste SessionLog
 */
practiceRouter.post('/hard-skill/evaluate', async (req, res) => {
  try {
    const { topicId, challenge, userSolution } = req.body;

    if (!topicId || !challenge || userSolution === undefined || userSolution === null) {
      return res.status(400).json({
        error: 'topicId, challenge, and userSolution are required',
      });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // 1. Evaluar con el servicio de IA
    const evaluation = await evaluateHardSkillSolution({
      topic,
      challenge,
      userSolution,
    });

    const score = evaluation.score;

    // 2. Recalcular valores SRS con srsCalculator
    const srsResult = calculateNextReview(
      topic.srsStage,
      topic.easeFactor,
      score,
      topic.intervalDays
    );

    // 3. Actualizar topic en Mongo
    topic.srsStage = srsResult.srsStage;
    topic.easeFactor = srsResult.easeFactor;
    topic.intervalDays = srsResult.intervalDays;
    topic.nextReviewAt = srsResult.nextReviewAt;

    topic.history.push({
      score,
      userInput: userSolution,
      aiFeedback: evaluation.feedback,
      reviewedAt: new Date(),
    });

    await topic.save();

    // 4. Guardar SessionLog independiente
    const sessionLog = await SessionLog.create({
      topicId: topic._id,
      challenge,
      userSolution,
      score,
      feedback: evaluation.feedback,
      missingTradeoffs: evaluation.missingTradeoffs,
      strengths: evaluation.strengths,
      reviewedAt: new Date(),
    });

    return res.status(200).json({
      score: evaluation.score,
      feedback: evaluation.feedback,
      missingTradeoffs: evaluation.missingTradeoffs,
      strengths: evaluation.strengths,
      nextReviewAt: topic.nextReviewAt,
      srsStage: topic.srsStage,
      intervalDays: topic.intervalDays,
      sessionLogId: sessionLog._id,
    });
  } catch (error) {
    console.error('Error evaluating hard skill solution:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/practice/hard-skill/hint
 * Body: { topicId, challenge }
 * Genera una pista pedagógica socrática (analogía + preguntas guía) sin revelar código ni respuesta.
 */
practiceRouter.post('/hard-skill/hint', async (req, res) => {
  try {
    const { topicId, challenge } = req.body;

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }
    if (!challenge) {
      return res.status(400).json({ error: 'challenge is required' });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const hint = await generateHint({ topic, challenge });

    return res.status(200).json({
      analogy: hint.analogy,
      guidingQuestions: hint.guidingQuestions,
    });
  } catch (error) {
    console.error('Error generating hint:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
