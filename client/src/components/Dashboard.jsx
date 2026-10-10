import React, { useState, useEffect } from 'react';
import {
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  BookOpen,
  Layers,
  Award,
} from 'lucide-react';
import { CATEGORIES } from '../constants/categories';

const API_BASE = 'http://localhost:5000/api';

/**
 * Renderiza el indicador visual de 3 segmentos para la dificultad (1 a 3).
 */
function DifficultySegments({ difficulty = 1 }) {
  return (
    <div className="flex items-center gap-1" title={`Dificultad ${difficulty} de 3`}>
      {[1, 2, 3].map((lvl) => (
        <span
          key={lvl}
          className={`h-2 w-2.5 rounded-sm transition-colors ${
            lvl <= difficulty
              ? lvl === 1
                ? 'bg-emerald-400'
                : lvl === 2
                ? 'bg-amber-400'
                : 'bg-rose-500'
              : 'bg-slate-700/60'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Badge cromático para el último score registrado.
 */
function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-[11px] font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
        -
      </span>
    );
  }

  let badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  if (score >= 4) {
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  } else if (score >= 3) {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }

  return (
    <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border ${badgeColor}`}>
      {Number(score).toFixed(1)}/5
    </span>
  );
}

/**
 * Formatea y evalúa la fecha de vencimiento SRS.
 */
function formatDueDate(dueDateStr) {
  if (!dueDateStr) return { text: 'Sin fecha', isDue: false };
  const due = new Date(dueDateStr);
  const now = new Date();
  const isDue = due <= now;

  const diffHours = Math.round((due.getTime() - now.getTime()) / (1000 * 3600));

  if (isDue) {
    return { text: 'Vencido', isDue: true };
  }
  if (diffHours < 24) {
    return { text: 'Vence hoy', isDue: false };
  }
  return {
    text: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    isDue: false,
  };
}

export function Dashboard({ onStartTraining }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (!res.ok) throw new Error('Error al cargar métricas del dashboard');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor para obtener las métricas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleTrainNow = () => {
    if (!summary || !summary.nextRecommended || !summary.nextRecommended.topic) return;
    const { topic, category } = summary.nextRecommended;
    onStartTraining('math-vision', {
      _id: topic._id,
      title: topic.title,
      category,
    });
  };

  const handleSelectTrack = (topic, category) => {
    if (!topic) return;
    onStartTraining('math-vision', {
      _id: topic._id,
      title: topic.title,
      category,
    });
  };

  if (loading) {
    return (
      <div id="dashboard-loading" className="w-full flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm">Analizando estado de retención y prioridades SRS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchSummary}
          className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-medium text-xs transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const {
    dueCount = 0,
    dueByCategory = { technique: 0, application: 0, proof: 0 },
    nextRecommended = null,
    criticalTracks = [],
    topics = [],
  } = summary || {};

  return (
    <div id="dashboard-view" className="w-full space-y-6">
      {/* Encabezado y botón de refrescar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Panel de Control Diario
          </h3>
          <p className="text-xs text-slate-400">
            Métricas de retención espaciada (SRS) y práctica activa por Tema y Categoría.
          </p>
        </div>
        <button
          id="btn-refresh-dashboard"
          onClick={fetchSummary}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition"
          title="Actualizar métricas"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* AC-1: Tarjetas de Resumen por Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Técnica */}
        <div
          id="card-due-technique"
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              {CATEGORIES.technique || 'Técnica'}
            </span>
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <span id="metric-due-technique" className="text-4xl font-extrabold text-white tracking-tight">
              {dueByCategory.technique ?? 0}
            </span>
            <span className="text-xs text-slate-400 ml-2">pendientes</span>
          </div>
          <div className="flex items-center text-xs text-blue-200/80">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>Procedimientos y álgebra formal</span>
          </div>
        </div>

        {/* Aplicación */}
        <div
          id="card-due-application"
          className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
              {CATEGORIES.application || 'Aplicación'}
            </span>
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <span id="metric-due-application" className="text-4xl font-extrabold text-white tracking-tight">
              {dueByCategory.application ?? 0}
            </span>
            <span className="text-xs text-slate-400 ml-2">pendientes</span>
          </div>
          <div className="flex items-center text-xs text-purple-200/80">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>Modelado y problemas contextuales</span>
          </div>
        </div>

        {/* Demostración */}
        <div
          id="card-due-proof"
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              {CATEGORIES.proof || 'Demostración'}
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <span id="metric-due-proof" className="text-4xl font-extrabold text-white tracking-tight">
              {dueByCategory.proof ?? 0}
            </span>
            <span className="text-xs text-slate-400 ml-2">pendientes</span>
          </div>
          <div className="flex items-center text-xs text-emerald-200/80">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>Rigor deductivo y teoremas</span>
          </div>
        </div>
      </div>

      {/* AC-3: Acción Hero: Entrenar ahora con recomendación SRS */}
      <div
        id="recommended-action-card"
        className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3 h-3 text-indigo-300" />
            <span>Recomendación del Coach SRS</span>
          </div>
          <h4 id="recommended-topic-title" className="text-lg font-bold text-white">
            {nextRecommended && nextRecommended.topic
              ? `${nextRecommended.topic.title} (${CATEGORIES[nextRecommended.category] || nextRecommended.category} - Dif. ${nextRecommended.difficulty})`
              : 'Todos los repasos están al día'}
          </h4>
          <p id="recommended-topic-meta" className="text-xs text-slate-400">
            {nextRecommended
              ? 'Priorizado automáticamente por el algoritmo de retención espaciada (SRS SM-2).'
              : '¡Excelente progreso! Puedes practicar cualquier pista libremente desde la matriz.'}
          </p>
        </div>

        <button
          id="btn-train-now"
          disabled={!nextRecommended}
          onClick={handleTrainNow}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
            nextRecommended
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <span>Entrenar ahora</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* AC-2: Matriz Interactiva Tema × Categoría */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Matriz Tema × Categoría
            </h4>
            <p className="text-xs text-slate-400">
              Explora el progreso en cada pista. Haz clic sobre cualquier celda para iniciar una ronda de práctica.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {topics.length} temas disponibles
          </span>
        </div>

        <div id="topics-matrix" className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Tema</th>
                <th className="py-3 px-4 text-center">Técnica</th>
                <th className="py-3 px-4 text-center">Aplicación</th>
                <th className="py-3 px-4 text-center">Demostración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topics.map((topic) => {
                const tracksMap = new Map((topic.tracks || []).map((t) => [t.category, t]));
                return (
                  <tr
                    key={topic._id}
                    id={`matrix-row-${topic._id}`}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-semibold text-slate-200">{topic.title}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{topic.area}</div>
                    </td>
                    {['technique', 'application', 'proof'].map((cat) => {
                      const track = tracksMap.get(cat);
                      const { text: dueText, isDue } = formatDueDate(track?.dueDate);
                      return (
                        <td
                          key={cat}
                          id={`matrix-cell-${topic._id}-${cat}`}
                          onClick={() => handleSelectTrack(topic, cat)}
                          className="py-3 px-3 text-center cursor-pointer hover:bg-indigo-950/40 rounded-lg transition-all group"
                          title={`Practicar ${topic.title} (${CATEGORIES[cat]})`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800 group-hover:border-indigo-500/50">
                            <DifficultySegments difficulty={track?.difficulty || 1} />
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <ScoreBadge score={track?.lastRoundScore} />
                              <span
                                className={`text-[10px] font-medium ${
                                  isDue ? 'text-amber-400 font-semibold' : 'text-slate-400'
                                }`}
                              >
                                {dueText}
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AC-4: Sección Áreas Críticas (Score < 3) */}
      <div id="critical-tracks-section" className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Áreas críticas (Score &lt; 3)</h4>
              <p className="text-xs text-slate-400">
                Pistas con errores conceptuales o desempeño bajo en rondas recientes.
              </p>
            </div>
          </div>
          <span
            id="critical-tracks-count"
            className="text-xs font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20"
          >
            {criticalTracks.length} detectadas
          </span>
        </div>

        {criticalTracks.length === 0 ? (
          <div
            id="no-critical-tracks-msg"
            className="p-6 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center space-y-1"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
            <p className="text-sm font-medium text-slate-300">¡Sin áreas críticas activas!</p>
            <p className="text-xs text-slate-500">
              Todas las pistas practicadas cuentan con evaluaciones aprobatorias (≥ 3).
            </p>
          </div>
        ) : (
          <div id="critical-tracks-list" className="divide-y divide-slate-800/80">
            {criticalTracks.map((crit, idx) => {
              const topic = crit.topic;
              if (!topic) return null;
              return (
                <div
                  key={`${topic._id}-${crit.category}-${idx}`}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Score {Number(crit.lastRoundScore).toFixed(1)}/5
                    </span>
                    <div>
                      <span className="text-sm font-medium text-slate-200">{topic.title}</span>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span className="capitalize font-semibold text-indigo-400">
                          {CATEGORIES[crit.category] || crit.category}
                        </span>
                        <span>•</span>
                        <span>Dificultad {crit.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    id={`btn-practice-critical-${topic._id}-${crit.category}`}
                    onClick={() => handleSelectTrack(topic, crit.category)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                  >
                    <span>Repasar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
