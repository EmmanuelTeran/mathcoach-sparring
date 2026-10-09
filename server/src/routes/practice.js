import express from 'express';
import { MathTopic } from '../models/MathTopic.js';
import { calculateNextReview } from '../utils/srsCalculator.js';
import { evaluateMathVisionSolution } from '../services/geminiService.js';

export const practiceRouter = express.Router();

/**
 * POST /api/evaluate-math (también accesible como /api/practice/evaluate-math)
 * Body: { problemId, image, metadata? }
 * Evalúa con Gemini 1.5 Pro la imagen manuscrita, recalcula SRS SM-2 y persiste en MathTopic.
 */
practiceRouter.post('/evaluate-math', async (req, res) => {
  try {
    const { problemId, image } = req.body;

    // Validación defensiva de entrada
    if (!problemId || typeof problemId !== 'string' || !problemId.trim()) {
      return res.status(400).json({ error: 'problemId is required' });
    }

    if (!image || typeof image !== 'string' || !image.trim()) {
      return res.status(400).json({ error: 'image must be a valid base64 string' });
    }

    // Verificar si problemId es un ObjectId sintácticamente válido para Mongoose
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(problemId.trim());
    if (!isValidObjectId) {
      return res.status(404).json({ error: 'Math problem not found' });
    }

    const problem = await MathTopic.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Math problem not found' });
    }

    // Inferencia Multimodal con Gemini 1.5 Pro
    let aiResult;
    try {
      aiResult = await evaluateMathVisionSolution({
        topic: problem,
        imageBase64: image,
      });
    } catch (aiError) {
      console.error('Error in AI evaluation service:', aiError);
      return res.status(502).json({
        error: 'AI evaluation service unavailable',
        details: aiError.message,
      });
    }

    const score = Math.max(0, Math.min(5, Math.round(Number(aiResult.score) || 0)));

    // Motor SRS SM-2
    const srsResult = calculateNextReview(
      problem.repetition || 0,
      problem.efactor || 2.5,
      score,
      problem.interval || 0
    );

    return res.status(200).json({
      success: true,
      score,
      feedback_paso_a_paso: aiResult.feedback_paso_a_paso,
      hint: aiResult.hint,
      srs: {
        repetition: srsResult.repetition,
        interval: srsResult.interval,
        efactor: srsResult.efactor,
        dueDate: srsResult.dueDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Unhandled error evaluating math solution:', error);
    return res.status(500).json({
      error: 'AI evaluation service unavailable',
      details: error.message,
    });
  }
});
