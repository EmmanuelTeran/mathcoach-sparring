import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';

export const dashboardRouter = express.Router();

/**
 * GET /api/dashboard/summary
 * Retorna las métricas de resumen para la vista del Dashboard:
 * - dueCount: total de pistas vencidas (dueDate <= now)
 * - dueByCategory: desglose por categoría (technique, application, proof)
 * - nextRecommended: pista prioritaria recomendada por SRS
 * - criticalTracks: pistas con lastRoundScore < 3
 * - topics: catálogo de temas y pistas para la matriz interactiva
 */
dashboardRouter.get('/summary', getDashboardSummary);
