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
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

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
    if (!summary || !summary.recommendedNext) return;
    onStartTraining('math-vision', summary.recommendedNext);
  };

  const handleSelectCriticalTopic = (topic) => {
    onStartTraining('math-vision', topic);
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
    criticalTopics = [],
    recommendedNext = null,
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
            Métricas de retención espaciada (SRS) y práctica activa de matemáticas.
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

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarjeta: Repasos Pendientes */}
        <div
          id="card-due-today"
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Repasos pendientes
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
            <span>{dueCount === 0 ? '¡Al día! Todo repasado.' : 'Requieren tu práctica hoy'}</span>
          </div>
        </div>

        {/* Tarjeta: Áreas Críticas Resumen */}
        <div
          id="card-critical-summary"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Áreas críticas
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <span id="metric-critical-count" className="text-4xl font-bold text-white">
              {criticalTopics.length}
            </span>
            <span className="text-xs text-slate-400 ml-2">temas con score &lt; 3</span>
          </div>
          <div className="text-xs text-slate-400">
            Conceptos con errores algebraicos recientes
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
            <span>Recomendación del Coach Matemático</span>
          </div>
          <h4 id="recommended-topic-title" className="text-lg font-bold text-white">
            {recommendedNext ? recommendedNext.title : 'Todos los repasos están al día'}
          </h4>
          <p id="recommended-topic-meta" className="text-xs text-slate-400">
            {recommendedNext
              ? 'Priorizado por el modelo de repetición espaciada.'
              : 'Puedes explorar cualquier tema libremente desde los módulos de práctica.'}
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

      {/* Sección Áreas Críticas Detalladas */}
      <div id="critical-topics-section" className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Áreas críticas (Score &lt; 3)</h4>
              <p className="text-xs text-slate-400">
                Temas con fallos o dificultades conceptuales recientes.
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
              Todas tus sesiones evaluadas han obtenido calificaciones satisfactorias (≥ 3).
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
                      <span>Nivel {topic.level || 1}</span>
                      {topic.srsStage && (
                        <>
                          <span>•</span>
                          <span>Etapa SRS: {topic.srsStage}</span>
                        </>
                      )}
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

export default Dashboard;
