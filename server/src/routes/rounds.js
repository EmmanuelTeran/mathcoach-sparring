import express from 'express';
import mongoose from 'mongoose';
import { TopicTrack } from '../models/TopicTrack.js';
import { MathTopic } from '../models/MathTopic.js';
import { Round } from '../models/Round.js';
import { Exercise } from '../models/Exercise.js';
import { VALID_CATEGORIES } from '../config/categories.js';
import { buildRound } from '../services/roundBuilder.js';
import { evaluateRoundSolutions } from '../services/geminiService.js';
import { computeRoundOutcome } from '../utils/progressionEngine.js';

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
      if (dueTimeA !== dueTimeB) {
        return dueTimeA - dueTimeB;
      }

      const catOrder = { technique: 1, application: 2, proof: 3 };
      return (catOrder[a.category] || 99) - (catOrder[b.category] || 99);
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

/**
 * POST /api/rounds/:id/evaluate
 * Evalúa las soluciones manuscritas de la ronda contra 1..6 imágenes.
 * Actualiza atómicamente Round y TopicTrack con computeRoundOutcome.
 */
roundsRouter.post('/:id/evaluate', async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    // 1. Validar ID de la ronda
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid round ID' });
    }

    // 2. Validar images (array de 1 a 6 cadenas Base64)
    if (!images || !Array.isArray(images) || images.length < 1 || images.length > 6) {
      return res.status(400).json({ error: 'images must be an array of 1 to 6 base64 strings' });
    }

    for (const img of images) {
      if (typeof img !== 'string' || !img.trim()) {
        return res.status(400).json({ error: 'Invalid image data' });
      }
      const clean = img.replace(/^data:image\/[a-zA-Z+]+;base64,/, '').trim();
      if (!clean) {
        return res.status(400).json({ error: 'Invalid image data' });
      }
    }

    // 3. Obtener la ronda
    const round = await Round.findById(id);
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    // 4. Validar que no esté ya evaluada (409 Conflict)
    if (round.status === 'evaluated') {
      return res.status(409).json({ error: 'Round already evaluated' });
    }

    // 5. Obtener el topic y los ejercicios con sus referenceSolutions
    const [topic, topicTrack, exerciseDocs] = await Promise.all([
      MathTopic.findById(round.topicId).lean(),
      TopicTrack.findById(round.trackId),
      Exercise.find({ _id: { $in: round.exercises.map((e) => e.exerciseId) } }).lean(),
    ]);

    if (!topicTrack) {
      return res.status(404).json({ error: 'Topic track not found' });
    }

    const exerciseMap = new Map();
    exerciseDocs.forEach((ex) => {
      exerciseMap.set(ex._id.toString(), ex);
    });

    // El estudiante ve los ejercicios numerados por posición en la ronda (1..N),
    // no por su `order` de catálogo (que puede ser 4, 5, 6...). La IA debe usar la misma numeración.
    const positionToOrder = new Map();
    const exercisesForAi = round.exercises.map((snap, idx) => {
      const fullEx = exerciseMap.get(snap.exerciseId.toString());
      positionToOrder.set(idx + 1, snap.order);
      return {
        order: idx + 1,
        statement: snap.statement,
        referenceSolution: fullEx?.referenceSolution || '',
      };
    });

    // 6. Ejecutar inferencia de IA
    let aiEvaluation;
    try {
      aiEvaluation = await evaluateRoundSolutions({
        round: {
          category: round.category,
          difficulty: round.difficulty,
          topicTitle: topic?.title || 'Tema de Práctica',
        },
        exercises: exercisesForAi,
        imagesBase64: images,
      });
    } catch (aiError) {
      console.error('Error in evaluateRoundSolutions:', aiError);
      return res.status(502).json({
        error: 'AI evaluation service unavailable',
        details: aiError.message,
      });
    }

    // Traducir la numeración posicional de la IA de vuelta al `order` del snapshot
    aiEvaluation.exercises = (aiEvaluation.exercises || []).map((ex) => ({
      ...ex,
      order: positionToOrder.get(Number(ex.order)) ?? ex.order,
    }));

    // 7. Verificar si faltan ejercicios (422 Unprocessable Entity)
    const missingOrders = [];
    aiEvaluation.exercises.forEach((ex) => {
      if (ex.found === false) {
        missingOrders.push(ex.order);
      }
    });

    // También comprobar si algún ejercicio esperado no vino en el retorno
    round.exercises.forEach((expected) => {
      const returned = aiEvaluation.exercises.find((e) => e.order === expected.order);
      if (!returned || returned.found === false) {
        if (!missingOrders.includes(expected.order)) {
          missingOrders.push(expected.order);
        }
      }
    });

    if (missingOrders.length > 0) {
      missingOrders.sort((a, b) => a - b);
      return res.status(422).json({
        error: 'exercises_not_found',
        missing: missingOrders,
      });
    }

    // 8. Mapear resultados a los ejercicios de la ronda
    const resultsMap = new Map();
    aiEvaluation.exercises.forEach((evaluatedEx) => {
      resultsMap.set(evaluatedEx.order, evaluatedEx);
    });

    const mappedResults = round.exercises.map((snap) => {
      const evalItem = resultsMap.get(snap.order);
      return {
        exerciseId: snap.exerciseId,
        order: snap.order,
        score: evalItem?.score ?? 0,
        feedback_paso_a_paso: evalItem?.feedback_paso_a_paso || '',
        hint: evalItem?.hint || '',
      };
    });

    // 9. Cómputo de Progresión y SRS
    const scores = mappedResults.map((r) => r.score);
    const outcome = computeRoundOutcome({
      scores,
      track: topicTrack.toObject ? topicTrack.toObject() : topicTrack,
      now: new Date(),
    });

    // 10. Persistencia atómica en Round y TopicTrack
    const evaluatedAt = new Date();

    // Actualizar Round
    round.status = 'evaluated';
    round.results = mappedResults.map((r) => ({
      exerciseId: r.exerciseId,
      score: r.score,
      feedback_paso_a_paso: r.feedback_paso_a_paso,
      hint: r.hint,
    }));
    round.roundScore = outcome.roundScore;
    round.passRate = outcome.passRate;
    round.promoted = outcome.promoted;
    round.previousDifficulty = topicTrack.difficulty;
    round.newDifficulty = outcome.newDifficulty;
    round.evaluatedAt = evaluatedAt;

    // Actualizar TopicTrack
    topicTrack.difficulty = outcome.newDifficulty;
    topicTrack.repetition = outcome.srs.repetition;
    topicTrack.interval = outcome.srs.interval;
    topicTrack.efactor = outcome.srs.efactor;
    topicTrack.dueDate = outcome.srs.dueDate;
    topicTrack.lastRoundScore = outcome.roundScore;
    topicTrack.roundsCompleted = (topicTrack.roundsCompleted || 0) + 1;

    // Guardar concurrentemente ambas entidades
    await Promise.all([round.save(), topicTrack.save()]);

    return res.status(200).json({
      roundScore: outcome.roundScore,
      passRate: outcome.passRate,
      promoted: outcome.promoted,
      previousDifficulty: round.previousDifficulty,
      newDifficulty: outcome.newDifficulty,
      nextReviewAt: outcome.srs.dueDate.toISOString(),
      results: mappedResults.map((r) => ({
        exerciseId: r.exerciseId,
        order: r.order,
        score: r.score,
        feedback_paso_a_paso: r.feedback_paso_a_paso,
        hint: r.hint,
      })),
      overall_feedback: aiEvaluation.overall_feedback || 'Evaluación de ronda completada.',
    });
  } catch (error) {
    console.error('Unhandled error in round evaluation:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

