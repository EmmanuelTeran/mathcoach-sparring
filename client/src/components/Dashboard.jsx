import React, { useState, useEffect } from 'react';
import {
  Calendar,
  AlertTriangle,
  Brain,
  MessageSquare,
  Sparkles,
  ArrowRight,
  RefreshCw,
  TrendingDown,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Flame,
  GraduationCap,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const LEVEL_LABELS = { all: 'Todos', junior: 'Junior', mid: 'Mid', senior: 'Senior' };
const LEVEL_STYLES = {
  all: 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600',
  junior: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
  mid: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
  senior: 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
};
const LEVEL_ACTIVE = {
  all: 'bg-slate-500 text-white border-slate-400',
  junior: 'bg-emerald-600 text-white border-emerald-500',
  mid: 'bg-blue-600 text-white border-blue-500',
  senior: 'bg-purple-600 text-white border-purple-500',
};

export function Dashboard({ onStartTraining }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const fetchSummary = async (level = selectedLevel) => {
    setLoading(true);
    setError('');
    try {
      const url = level && level !== 'all'
        ? `${API_BASE}/dashboard/summary?level=${level}`
        : `${API_BASE}/dashboard/summary`;
      const res = await fetch(url);
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

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    fetchSummary(level);
  };

  useEffect(() => {
    fetchSummary(selectedLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrainNow = () => {
    if (!summary || !summary.recommendedNext) return;
    const topic = summary.recommendedNext;
    const tab =
      topic.category === 'soft_skill' || topic.type === 'practice'
        ? 'soft-skills'
        : 'hard-skills';
    onStartTraining(tab, topic);
  };

  const handleSelectCriticalTopic = (topic) => {
    const tab =
      topic.category === 'soft_skill' || topic.type === 'practice'
        ? 'soft-skills'
        : 'hard-skills';
    onStartTraining(tab, topic);
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
    dueHardSkills = 0,
    dueSoftSkills = 0,
    criticalTopics = [],
    recommendedNext = null,
  } = summary || {};

  return (
    <div id="dashboard-view" className="w-full space-y-6">
      {/* Encabezado y botón de refrescar */}
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Panel de Control Diario
            </h3>
            <p className="text-xs text-slate-400">
              Métricas de retención espaciada (SRS) y priorización acoplada de sparring.
            </p>
          </div>
          <button
            id="btn-refresh-dashboard"
            onClick={() => fetchSummary(selectedLevel)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition"
            title="Actualizar métricas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Nivel de Progresión (AC-5) */}
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" /> Filtrar por Nivel
          </p>
          <div id="level-selector-dashboard" className="flex flex-wrap gap-2">
            {['all', 'junior', 'mid', 'senior'].map((lvl) => (
              <button
                key={lvl}
                id={`level-btn-${lvl}-dashboard`}
                onClick={() => handleLevelChange(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedLevel === lvl
                    ? LEVEL_ACTIVE[lvl] + ' shadow-md'
                    : LEVEL_STYLES[lvl]
                }`}
              >
                {LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tarjeta Principal: Pendientes de Hoy */}
        <div
          id="card-due-today"
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Pendientes de Hoy
            </span>
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <span id="metric-due-count" className="text-4xl font-extrabold text-white tracking-tight">
              {dueCount}
            </span>
            <span className="text-xs text-slate-400 ml-2">temas a repasar</span>
          </div>
          <div className="flex items-center text-xs text-indigo-200/80">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>{dueCount === 0 ? '¡Al día! Gran trabajo.' : 'Requieren tu atención hoy'}</span>
          </div>
        </div>

        {/* Tarjeta: Hard Skills Pendientes */}
        <div
          id="card-due-hard-skills"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hard Skills (Técnico)
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Brain className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <span id="metric-due-hard-skills" className="text-3xl font-bold text-white">
              {dueHardSkills}
            </span>
            <span className="text-xs text-slate-400 ml-2">retos activos</span>
          </div>
          <div className="text-xs text-slate-500">
            Active recall & conceptos teóricos
          </div>
        </div>

        {/* Tarjeta: Soft Skills Pendientes */}
        <div
          id="card-due-soft-skills"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Soft Skills (Voz)
            </span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <span id="metric-due-soft-skills" className="text-3xl font-bold text-white">
              {dueSoftSkills}
            </span>
            <span className="text-xs text-slate-400 ml-2">simulaciones</span>
          </div>
          <div className="text-xs text-slate-500">
            Defensa y consultoría con stakeholders
          </div>
        </div>
      </div>

      {/* Tarjeta Destacada de Acción Principal: Entrenar Ahora */}
      <div
        id="recommended-action-card"
        className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3 h-3 text-indigo-300" />
            <span>Recomendación Inteligente del Coach</span>
          </div>
          <h4 id="recommended-topic-title" className="text-lg font-bold text-white">
            {recommendedNext ? recommendedNext.title : 'Todos los repasos están al día'}
          </h4>
          <p id="recommended-topic-meta" className="text-xs text-slate-400">
            {recommendedNext ? (
              <>
                Tipo:{' '}
                <span className="text-slate-300 font-medium">
                  {recommendedNext.category === 'soft_skill' ? 'Soft Skill (Voz)' : 'Hard Skill (Técnico)'}
                </span>{' '}
                • Priorizado por el algoritmo de acoplamiento pedagógico
              </>
            ) : (
              'Puedes explorar cualquier tema libremente desde los módulos de entrenamiento.'
            )}
          </p>
        </div>

        <button
          id="btn-train-now"
          disabled={!recommendedNext}
          onClick={handleTrainNow}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
            recommendedNext
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <span>Entrenar Ahora</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sección Áreas Críticas */}
      <div id="critical-topics-section" className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Áreas Críticas (Score &lt; 3)</h4>
              <p className="text-xs text-slate-400">
                Temas donde has mostrado dudas o trade-offs omitidos. Repásalos para asegurar tus bases.
              </p>
            </div>
          </div>
          <span
            id="critical-topics-count"
            className="text-xs font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20"
          >
            {criticalTopics.length} detectadas
          </span>
        </div>

        {criticalTopics.length === 0 ? (
          <div
            id="no-critical-topics-msg"
            className="p-6 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center space-y-1"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
            <p className="text-sm font-medium text-slate-300">¡Sin áreas críticas activas!</p>
            <p className="text-xs text-slate-500">
              Todas tus sesiones registradas han obtenido calificaciones satisfactorias (≥ 3).
            </p>
          </div>
        ) : (
          <div id="critical-topics-list" className="divide-y divide-slate-800/80">
            {criticalTopics.map((topic) => (
              <div
                key={topic._id}
                className="py-3 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg transition"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      topic.lastScore === 1
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Score {topic.lastScore}/5
                  </span>
                  <div>
                    <span className="text-sm font-medium text-slate-200">{topic.title}</span>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span>{topic.category === 'soft_skill' ? 'Soft Skill' : 'Hard Skill'}</span>
                      <span>•</span>
                      <span>Etapa SRS: {topic.srsStage}</span>
                    </div>
                  </div>
                </div>

                <button
                  id={`btn-review-critical-${topic._id}`}
                  onClick={() => handleSelectCriticalTopic(topic)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                >
                  <span>Repasar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
