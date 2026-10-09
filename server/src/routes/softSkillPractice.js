import express from 'express';
import { Topic } from '../models/Topic.js';
import { SessionLog } from '../models/SessionLog.js';
import { calculateNextReview } from '../utils/srsCalculator.js';
import {
  startSoftSkillSparring,
  replySoftSkillSparring,
} from '../services/softSkillSparringService.js';

export const softSkillPracticeRouter = express.Router();

/**
 * POST /api/practice/soft-skill/start
 * Body: { topicId }
 * Inicia el escenario conflictivo de consultoría con el rol del cliente y la pregunta inicial.
 */
softSkillPracticeRouter.post('/soft-skill/start', async (req, res) => {
  try {
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const scenarioData = await startSoftSkillSparring(topic);

    return res.status(200).json({
      topicId: topic._id,
      title: topic.title,
      type: topic.type,
      category: topic.category,
      level: topic.level || 'junior',
      role: scenarioData.role,
      roleDescription: scenarioData.roleDescription,
      avatar: scenarioData.avatar,
      scenario: scenarioData.scenario,
      initialQuestion: scenarioData.initialQuestion,
    });
  } catch (error) {
    console.error('Error starting soft skill sparring:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/practice/soft-skill/reply
 * Body: { topicId, conversationHistory, userAudioTranscript, role, roleDescription }
 * Si es turno intermedio: devuelve la réplica escéptica del stakeholder.
 * Si es turno final (3er turno de usuario): evalúa el desempeño, aplica srsCalculator y guarda el SessionLog.
 */
softSkillPracticeRouter.post('/soft-skill/reply', async (req, res) => {
  try {
    const { topicId, conversationHistory = [], userAudioTranscript, role, roleDescription } = req.body;

    if (!topicId || !userAudioTranscript || !userAudioTranscript.trim()) {
      return res.status(400).json({
        error: 'topicId and userAudioTranscript are required',
      });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const sparringResult = await replySoftSkillSparring({
      topic,
      conversationHistory,
      userAudioTranscript,
      role,
      roleDescription,
    });

    if (!sparringResult.isFinalTurn) {
      // Turno intermedio: retornamos la contrapregunta del stakeholder
      return res.status(200).json({
        isFinalTurn: false,
        role: sparringResult.role || role,
        roleDescription: sparringResult.roleDescription || roleDescription,
        reply: sparringResult.reply,
      });
    }

    // Turno final: procesar veredicto formal y actualizar SRS
    const { evaluation } = sparringResult;
    const score = evaluation.score;

    // Recalcular métricas SRS
    const srsResult = calculateNextReview(
      topic.srsStage,
      topic.easeFactor,
      score,
      topic.intervalDays
    );

    topic.srsStage = srsResult.srsStage;
    topic.easeFactor = srsResult.easeFactor;
    topic.intervalDays = srsResult.intervalDays;
    topic.nextReviewAt = srsResult.nextReviewAt;

    // Historial del Topic
    topic.history.push({
      score,
      userInput: userAudioTranscript,
      aiFeedback: evaluation.feedback,
      reviewedAt: new Date(),
    });

    await topic.save();

    // Historial completo para SessionLog
    const fullConversation = [
      ...conversationHistory,
      { speaker: 'user', text: userAudioTranscript, timestamp: new Date() },
    ];

    const sessionLog = await SessionLog.create({
      topicId: topic._id,
      challenge: `Sparring de consultoría como ${sparringResult.role || role}`,
      userSolution: userAudioTranscript,
      score,
      feedback: evaluation.feedback,
      missingTradeoffs: evaluation.missingTradeoffs || [],
      strengths: evaluation.strengths || [],
      businessClarity: evaluation.businessClarity,
      tradeOffDefense: evaluation.tradeOffDefense,
      assertivenessScore: evaluation.assertivenessScore,
      conversationHistory: fullConversation,
      role: sparringResult.role || role,
      reviewedAt: new Date(),
    });

    return res.status(200).json({
      isFinalTurn: true,
      role: sparringResult.role || role,
      roleDescription: sparringResult.roleDescription || roleDescription,
      level: topic.level || 'junior',
      score: evaluation.score,
      feedback: evaluation.feedback,
      businessClarity: evaluation.businessClarity,
      tradeOffDefense: evaluation.tradeOffDefense,
      assertivenessScore: evaluation.assertivenessScore,
      missingTradeoffs: evaluation.missingTradeoffs,
      strengths: evaluation.strengths,
      nextReviewAt: topic.nextReviewAt,
      srsStage: topic.srsStage,
      intervalDays: topic.intervalDays,
      sessionLogId: sessionLog._id,
    });
  } catch (error) {
    console.error('Error replying soft skill sparring:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
