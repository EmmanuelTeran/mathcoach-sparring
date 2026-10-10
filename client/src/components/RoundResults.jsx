import React from 'react';
import {
  Trophy,
  ArrowUpRight,
  Minus,
  Calendar,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  RotateCcw,
  LayoutDashboard,
} from 'lucide-react';
import { CATEGORIES } from '../constants/categories';

/**
 * RoundResults:
 * Pantalla dedicada a visualizar el balance pedagógico de la ronda finalizada:
 * - Score global de la ronda (#round-results)
 * - Veredicto adaptativo y próximo repaso SRS (#round-progression)
 * - Desglose individual de cada ejercicio (#round-exercise-result-<order>)
 */
export function RoundResults({
  round = {},
  evaluation = {},
  onRestart,
  onGoToDashboard,
}) {
  const {
    roundScore = 0,
    passRate = 0,
    promoted = false,
    previousDifficulty = 1,
    newDifficulty = 1,
    nextReviewAt = null,
    results = [],
    overall_feedback = '',
  } = evaluation;

  const categoryLabel = CATEGORIES[round.category] || round.category || 'Técnica';

  // Formato amigable de fecha SRS
  const formattedNextReview = nextReviewAt
    ? new Date(nextReviewAt).toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Próxima sesión';

  const renderBadgeForScore = (score = 0) => {
    if (score >= 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" /> Aprobado ({score}/5)
        </span>
      );
    }
    if (score >= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          En Progreso ({score}/5)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
        Revisar Conceptos ({score}/5)
      </span>
    );
  };

  return (
    <div id="round-results" className="w-full max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* TARJETA SUPERIOR RESUMEN GLOBAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>Ronda de Práctica Completada</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              {round.topic?.title || 'Evaluación de Ronda'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Categoría: <span className="font-semibold text-slate-300">{categoryLabel}</span> • Dificultad {previousDifficulty}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Score Global
              </span>
              <span className="text-2xl font-black text-indigo-400 font-mono">
                {Number(roundScore).toFixed(1)} / 5.0
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Aprobación
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {Math.round(passRate * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* DICTAMEN DE PROGRESIÓN (#round-progression) */}
        <div
          id="round-progression"
          className={`mt-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            promoted
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                promoted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              {promoted ? <ArrowUpRight className="w-6 h-6" /> : <Minus className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {promoted
                  ? `¡Felicidades! Subes a dificultad ${newDifficulty} en ${categoryLabel} para el próximo repaso`
                  : `Te mantienes en dificultad ${previousDifficulty} en ${categoryLabel}`}
              </h4>
              <p className="text-xs opacity-80 mt-0.5">
                {promoted
                  ? 'Has demostrado dominio conceptual y rigor algebraico para avanzar de nivel.'
                  : 'Consolida tu técnica antes de incrementar la complejidad del catálogo.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 shrink-0">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Repaso agendado: <strong className="text-white">{formattedNextReview}</strong></span>
          </div>
        </div>

        {overall_feedback && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <strong className="text-indigo-400 block mb-1">Dictamen del Sparring:</strong>
            {overall_feedback}
          </div>
        )}
      </div>

      {/* DESGLOSE POR EJERCICIO */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
          Desglose Detallado por Ejercicio ({results.length})
        </h3>

        {results.map((res, resIdx) => {
          const exerciseMeta = round.exercises?.find((e) => e.order === res.order);
          const metaIdx = round.exercises?.findIndex((e) => e.order === res.order) ?? -1;
          const displayNumber = metaIdx >= 0 ? metaIdx + 1 : resIdx + 1;
          return (
            <div
              key={res.order}
              id={`round-exercise-result-${res.order}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 text-xs font-bold flex items-center justify-center">
                    {displayNumber}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Ejercicio #{displayNumber}
                  </h4>
                </div>
                {renderBadgeForScore(res.score)}
              </div>

              {exerciseMeta?.statement && (
                <div className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 font-mono">
                  {exerciseMeta.statement}
                </div>
              )}

              {/* Paso a paso */}
              {res.feedback_paso_a_paso && (
                <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-400 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>Auditoría de Procedimiento</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">
                    {res.feedback_paso_a_paso}
                  </p>
                </div>
              )}

              {/* Hint */}
              {res.hint && (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">Pista Metodológica</span>
                    <p className="leading-relaxed">{res.hint}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ACCIONES FINALES */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        {onGoToDashboard && (
          <button
            type="button"
            onClick={onGoToDashboard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition border border-slate-700"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
        )}

        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/25 active:scale-95 ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Iniciar Nueva Práctica</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default RoundResults;
