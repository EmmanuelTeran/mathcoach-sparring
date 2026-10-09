import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';

export const dashboardRouter = express.Router();

/**
 * GET /api/dashboard/summary
 * Retorna las métricas de resumen para la vista del Dashboard:
 * - dueCount: total pendientes
 * - dueHardSkills: retos técnicos pendientes
 * - dueSoftSkills: simulaciones pendientes
 * - criticalTopics: temas con score < 3
 * - recommendedNext: tema seleccionado según acoplamiento pedagógico
 */
dashboardRouter.get('/summary', getDashboardSummary);
