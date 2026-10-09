import express from 'express';
import mongoose from 'mongoose';
import { Topic } from '../models/Topic.js';
import { SessionLog } from '../models/SessionLog.js';
import { calculateNextReview } from '../utils/srsCalculator.js';
import { evaluateCodingSolution } from '../services/geminiService.js';

export const codingPracticeRouter = express.Router();

/**
 * GET /api/practice/coding/challenges
 * Query: ?level=junior|mid|senior
 */
codingPracticeRouter.get('/coding/challenges', async (req, res) => {
  try {
    const { level } = req.query;
    const query = { codingChallenge: { $exists: true } };

    if (level && ['junior', 'mid', 'senior'].includes(level)) {
      query.level = level;
    }

    const topics = await Topic.find(query).lean();
    const now = new Date();

    const levelOrder = { junior: 1, mid: 2, senior: 3 };

    topics.sort((a, b) => {
      const orderA = levelOrder[a.level] || 99;
      const orderB = levelOrder[b.level] || 99;
      if (orderA !== orderB) return orderA - orderB;

      const dateA = new Date(a.nextReviewAt).getTime();
      const dateB = new Date(b.nextReviewAt).getTime();
      return dateA - dateB;
    });

    const result = topics.map((t) => ({
      _id: t._id,
      title: t.title,
      level: t.level || 'junior',
      srsStage: t.srsStage,
      nextReviewAt: t.nextReviewAt,
      isDue: new Date(t.nextReviewAt) <= now,
      codingChallenge: t.codingChallenge,
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/practice/coding/evaluate
 */
codingPracticeRouter.post('/coding/evaluate', async (req, res) => {
  try {
    const { topicId, code, testResults } = req.body;

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'code is required' });
    }

    if (code.length > 20000) {
      return res.status(400).json({ error: 'code exceeds 20000 characters' });
    }

    if (
      !testResults ||
      typeof testResults !== 'object' ||
      !Number.isInteger(testResults.passedCount) ||
      testResults.passedCount < 0 ||
      !Number.isInteger(testResults.totalCount) ||
      testResults.totalCount < 0 ||
      testResults.passedCount > testResults.totalCount
    ) {
      return res.status(400).json({ error: 'testResults is invalid' });
    }

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (!topic.codingChallenge) {
      return res.status(422).json({ error: 'Topic has no coding challenge' });
    }

    if (testResults.totalCount !== topic.codingChallenge.testCases.length) {
      return res.status(400).json({ error: 'testResults do not match challenge test cases' });
    }

    const { passedCount, totalCount } = testResults;
    const allTestsPassed = passedCount === totalCount && totalCount > 0;

    let score;
    let feedback;
    let complexity = null;
    let readability = '';
    let naming = '';
    let strengths = [];
    let improvements = [];
    let aiReviewed = false;

    if (allTestsPassed) {
      aiReviewed = true;
      const aiEval = await evaluateCodingSolution({ topic, code, testResults });
      score = aiEval.score;
      feedback = aiEval.feedback;
      complexity = aiEval.complexity;
      readability = aiEval.readability || '';
      naming = aiEval.naming || '';
      strengths = aiEval.strengths || [];
      improvements = aiEval.improvements || [];
    } else {
      score = passedCount === 0 ? 1 : 2;
      feedback = `${passedCount}/${totalCount} tests pasaron. Corrige los casos fallidos antes de la auditoría de calidad.`;
      improvements = ['Hacer pasar todos los test cases'];
      aiReviewed = false;
    }

    const srsResult = calculateNextReview(topic.srsStage, topic.easeFactor, score, topic.intervalDays);

    topic.srsStage = srsResult.srsStage;
    topic.easeFactor = srsResult.easeFactor;
    topic.intervalDays = srsResult.intervalDays;
    topic.nextReviewAt = srsResult.nextReviewAt;

    topic.history.push({
      score,
      userInput: code,
      aiFeedback: feedback,
      reviewedAt: new Date(),
    });

    await topic.save();

    const sessionLog = await SessionLog.create({
      topicId: topic._id,
      challenge: topic.codingChallenge.description,
      userSolution: code,
      score,
      feedback,
      strengths,
      missingTradeoffs: improvements,
      reviewedAt: new Date(),
    });

    return res.json({
      score,
      feedback,
      allTestsPassed,
      aiReviewed,
      passedCount,
      totalCount,
      complexity,
      readability,
      naming,
      strengths,
      improvements,
      nextReviewAt: topic.nextReviewAt.toISOString(),
      srsStage: topic.srsStage,
      intervalDays: topic.intervalDays,
      sessionLogId: sessionLog._id,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
