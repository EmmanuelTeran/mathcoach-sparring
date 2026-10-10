import express from 'express';
import mongoose from 'mongoose';
import { TopicTrack } from '../models/TopicTrack.js';
import { MathTopic } from '../models/MathTopic.js';
import { Round } from '../models/Round.js';
import { Exercise } from '../models/Exercise.js';
import { VALID_CATEGORIES } from '../config/categories.js';
import { buildRound } from '../services/roundBuilder.js';

export const roundsRouter = express.Router();

/**
 * GET /api/rounds/queue
 * Lista las pistas que requieren repaso inmediato (dueDate <= now).
 * Orden estricto:
 * 1. Menor lastRoundScore (ascendente, con null primero).
 * 2. Mayor retraso (dueDate ascendente / más antiguo en el pasado).
 */
roundsRouter.get('/queue', async (req, res) => {
  try {
    const now = new Date();

    // Consultamos tracks vencidos
    const dueTracks = await TopicTrack.find({
      dueDate: { $lte: now },
    })
      .populate('topicId', 'title slug')
      .lean();

    // Ordenamiento estricto:
    // 1. lastRoundScore ASC con null primero (-1 si a es null y b no)
    // 2. dueDate ASC (mayor retraso primero)
    dueTracks.sort((a, b) => {
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

    const formattedQueue = dueTracks.map((track) => ({
      trackId: track._id,
      topic: track.topicId
        ? {
            _id: track.topicId._id,
            title: track.topicId.title,
            slug: track.topicId.slug,
          }
        : null,
      category: track.category,
      difficulty: track.difficulty,
      dueDate: track.dueDate,
      lastRoundScore: track.lastRoundScore,
    }));

    return res.status(200).json(formattedQueue);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/rounds
 * Creación o reutilización de ronda de práctica.
 * Body: { topicId, category }
 */
roundsRouter.post('/', async (req, res) => {
  try {
    const { topicId, category } = req.body;

    if (!topicId || !category) {
      return res.status(400).json({ error: 'topicId and category are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ error: 'Invalid topicId format' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const topic = await MathTopic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Buscar o garantizar track para la pista
    let track = await TopicTrack.findOne({ topicId, category });
    if (!track) {
      track = await TopicTrack.create({
        topicId,
        category,
        difficulty: 1,
      });
    }

    // Comportamiento Idempotente:
    // Si ya existe una ronda en estado 'pending' para este trackId, se reutiliza (200 OK)
    const existingPendingRound = await Round.findOne({
      trackId: track._id,
      status: 'pending',
    }).lean();

    if (existingPendingRound) {
      return res.status(200).json({
        roundId: existingPendingRound._id,
        topic: {
          _id: topic._id,
          title: topic.title,
          slug: topic.slug,
        },
        category: existingPendingRound.category,
        difficulty: existingPendingRound.difficulty,
        exercises: existingPendingRound.exercises,
        totalExpertMinutes: existingPendingRound.totalExpertMinutes,
      });
    }

    // Construir la nueva ronda
    let builtRound;
    try {
      builtRound = await buildRound(track);
    } catch (buildError) {
      if (buildError.statusCode === 422) {
        return res.status(422).json({ error: buildError.message });
      }
      throw buildError;
    }

    // Persistir el snapshot inmutable en Round
    const newRound = await Round.create({
      trackId: track._id,
      topicId: topic._id,
      category: track.category,
      difficulty: track.difficulty,
      exercises: builtRound.exercises,
      totalExpertMinutes: builtRound.totalExpertMinutes,
      status: 'pending',
    });

    // Mutar atómicamente timesServed y lastServedAt en Exercise
    const exerciseIds = builtRound.exercises.map((e) => e.exerciseId);
    const now = new Date();
    await Exercise.updateMany(
      { _id: { $in: exerciseIds } },
      {
        $inc: { timesServed: 1 },
        $set: { lastServedAt: now },
      }
    );

    const responsePayload = {
      roundId: newRound._id,
      topic: {
        _id: topic._id,
        title: topic.title,
        slug: topic.slug,
      },
      category: newRound.category,
      difficulty: newRound.difficulty,
      exercises: newRound.exercises,
      totalExpertMinutes: newRound.totalExpertMinutes,
    };

    if (builtRound.warning) {
      responsePayload.warning = builtRound.warning;
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/rounds/:id
 * Consulta de ronda existente por ID.
 */
roundsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid round ID' });
    }

    const round = await Round.findById(id).lean();
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    return res.status(200).json(round);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
