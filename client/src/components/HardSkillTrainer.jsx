import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Award,
  RefreshCw,
  Code2,
  FileQuestion,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const LEVEL_LABELS = { junior: 'Junior', mid: 'Mid', senior: 'Senior' };
const LEVEL_COLORS = {
  junior: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
  mid: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
  senior: 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
};
const LEVEL_ACTIVE = {
  junior: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/25',
  mid: 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25',
  senior: 'bg-purple-600 text-white border-purple-500 shadow-purple-500/25',
};

export function HardSkillTrainer({ initialTopic }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopic?._id || '');
  const [selectedLevel, setSelectedLevel] = useState(initialTopic?.level || 'junior');
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [challengeData, setChallengeData] = useState(null);
  const [userSolution, setUserSolution] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  // Hint state
  const [loadingHint, setLoadingHint] = useState(false);
  const [hintData, setHintData] = useState(null);
  const [hintExpanded, setHintExpanded] = useState(false);
  const [hintError, setHintError] = useState('');

  // Cargar cola de temas pendientes, filtrada por nivel
  const fetchDueTopics = async (level = selectedLevel) => {
    setLoadingTopics(true);
    setErrorMessage('');
    try {
      const url = `${API_BASE}/topics/due${level ? `?level=${level}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar temas pendientes');
      const data = await res.json();

      // Filtrar sólo hard_skill si existen en el payload
      const hardSkills = data.filter((t) => t.category === 'hard_skill' || t.type === 'theory');
      const candidateList = hardSkills.length > 0 ? hardSkills : data;

      // Si recibimos initialTopic del nivel correcto y no está en la lista, lo agregamos al inicio
      let mergedTopics = [...candidateList];
      if (initialTopic && !candidateList.some((t) => t._id === initialTopic._id)) {
        mergedTopics = [initialTopic, ...candidateList];
      }
      setTopics(mergedTopics);

      if (initialTopic?._id) {
        setSelectedTopicId(initialTopic._id);
      } else if (mergedTopics.length > 0) {
        setSelectedTopicId(mergedTopics[0]._id);
      } else {
        setSelectedTopicId('');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudieron obtener temas pendientes. Asegúrate de que el servidor esté activo.');
    } finally {
      setLoadingTopics(false);
    }
  };

  // Cambio de nivel: recarga temas y limpia el desafío actual
  const handleLevelChange = (newLevel) => {
    setSelectedLevel(newLevel);
    setChallengeData(null);
    setEvaluationResult(null);
    setHintData(null);
    setUserSolution('');
    fetchDueTopics(newLevel);
  };

  // Solicitar pista pedagógica socrática
  const handleGetHint = async () => {
    if (!challengeData) return;
    setLoadingHint(true);
    setHintError('');
    setHintData(null);
    setHintExpanded(true);
    try {
      const res = await fetch(`${API_BASE}/practice/hard-skill/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: challengeData.topicId,
          challenge: challengeData.challenge,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al obtener la pista.');
      }
      const data = await res.json();
      setHintData(data);
    } catch (err) {
      console.error(err);
      setHintError(err.message || 'No se pudo obtener la pista pedagógica.');
    } finally {
      setLoadingHint(false);
    }
  };

  useEffect(() => {
    fetchDueTopics(selectedLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generar desafío técnico con Gemini
  const handleGenerateChallenge = async (overrideTopicId) => {
    const topicIdToUse = overrideTopicId || selectedTopicId;
    if (!topicIdToUse) {
      setErrorMessage('Por favor selecciona un tema primero.');
      return;
    }

    setLoadingChallenge(true);
    setErrorMessage('');
    setEvaluationResult(null);
    setUserSolution('');

    try {
      const res = await fetch(`${API_BASE}/practice/hard-skill/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topicIdToUse }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Fallo al generar el desafío.');
      }

      const data = await res.json();
      setChallengeData(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error al conectar con el servicio de IA.');
    } finally {
      setLoadingChallenge(false);
    }
  };

  // Evaluar solución
  const handleEvaluateSolution = async () => {
    if (!challengeData) return;
    if (!userSolution.trim()) {
      setErrorMessage('Escribe tu solución o explicación técnica antes de evaluar.');
      return;
    }

    setEvaluating(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE}/practice/hard-skill/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: challengeData.topicId,
          challenge: challengeData.challenge,
          userSolution,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al procesar la evaluación.');
      }

      const result = await res.json();
      setEvaluationResult(result);
      // Refrescar lista de temas pendientes con el nivel actual
      fetchDueTopics(selectedLevel);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error al contactar al evaluador.');
    } finally {
      setEvaluating(false);
    }
  };

  const activeLevel = challengeData?.level || selectedLevel;

  const getScoreBadge = (score) => {
    const lvlText = LEVEL_LABELS[activeLevel] || 'Junior';
    if (score >= 4) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Award className="w-4 h-4" />
          Score {score}/5 - Nivel {lvlText} Sólido
        </span>
      );
    }
    if (score === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4" />
          Score 3/5 - Nivel {lvlText} Aprobado con Brechas
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
        <AlertTriangle className="w-4 h-4" />
        Score {score}/5 - Requiere Repaso Urgente
      </span>
    );
  };

  return (
    <section className="w-full max-w-4xl mx-auto my-6 text-left" id="hard-skills-section">
      {/* Selector & Barra de Control */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Módulo Hard Skills: Active Recall
              </h2>
              <span
                id="dynamic-level-badge-hard-skills"
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase border ${
                  activeLevel === 'senior'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
                    : activeLevel === 'mid'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/20'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                }`}
              >
                NIVEL {LEVEL_LABELS[activeLevel]?.toUpperCase() || 'JUNIOR'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Desafíos técnicos adaptados por nivel sobre bases cotidianas, sintaxis, arquitectura interna y trade-offs fullstack.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              id="topic-selector"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
            >
              {topics.length === 0 ? (
                <option value="">(Sin temas pendientes en cola)</option>
              ) : (
                topics.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.type === 'theory' ? 'Teoría' : 'Práctica'})
                  </option>
                ))
              )}
            </select>

            <button
              id="btn-load-priority"
              onClick={() => {
                if (topics.length > 0) {
                  setSelectedTopicId(topics[0]._id);
                  handleGenerateChallenge(topics[0]._id);
                } else {
                  handleGenerateChallenge();
                }
              }}
              disabled={loadingTopics || loadingChallenge}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
            >
              {loadingChallenge ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{challengeData ? 'Nuevo Reto' : 'Cargar tema prioritario'}</span>
            </button>

            <button
              id="btn-refresh-due"
              onClick={() => fetchDueTopics(selectedLevel)}
              disabled={loadingTopics}
              title="Refrescar cola"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTopics ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Selector de Nivel de Progresión (AC-5) */}
        <div className="mt-4 pt-4 border-t border-slate-800/60">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Nivel de Progresión</p>
          <div id="level-selector-hard-skills" className="flex gap-2">
            {['junior', 'mid', 'senior'].map((lvl) => (
              <button
                key={lvl}
                id={`level-btn-${lvl}-hard-skills`}
                onClick={() => handleLevelChange(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedLevel === lvl
                    ? LEVEL_ACTIVE[lvl] + ' shadow-md'
                    : LEVEL_COLORS[lvl]
                }`}
              >
                {LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Visualizador del Desafío */}
      {challengeData && (
        <div className="space-y-6">
          <div
            id="challenge-card"
            className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-indigo-400" />
                <span id="challenge-type-badge" className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {challengeData.type === 'theory' ? 'Desafío Teórico' : 'Escenario Práctico'}{' '}
                  {LEVEL_LABELS[activeLevel] || 'Junior'}
                </span>
                <span
                  id="challenge-level-badge"
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                    activeLevel === 'senior'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : activeLevel === 'mid'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  NIVEL {LEVEL_LABELS[activeLevel]?.toUpperCase() || 'JUNIOR'}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                {challengeData.title}
              </span>
            </div>

            <div
              id="challenge-text"
              className="text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium"
            >
              {challengeData.challenge}
            </div>
          </div>

          {/* Área de Redacción Técnica */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor="user-solution-input"
                className="text-sm font-semibold text-slate-200 flex items-center gap-2"
              >
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Tu Solución Técnica o Justificación de Arquitectura</span>
              </label>
              <span className="text-xs text-slate-400">Tipografía monoespaciada para código y razonamiento</span>
            </div>

            <textarea
              id="user-solution-input"
              rows={8}
              value={userSolution}
              onChange={(e) => setUserSolution(e.target.value)}
              placeholder="Explica el funcionamiento interno, secuencia de eventos, y analiza los trade-offs (ej. latencia, consumo de memoria, escalabilidad) de tu solución..."
              className="w-full bg-slate-950 text-slate-200 font-mono text-sm rounded-xl p-4 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600 resize-y"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {/* AC-6: Botón de Pista / Modelo Mental */}
              <button
                id="btn-get-hint"
                onClick={() => { setHintExpanded(!hintExpanded); if (!hintData && !loadingHint) handleGetHint(); }}
                disabled={loadingHint || !challengeData}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 font-medium text-sm transition-all disabled:opacity-40"
              >
                {loadingHint ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lightbulb className="w-4 h-4" />
                )}
                <span>💡 Dame una pista / Modelo Mental</span>
                {hintData && (hintExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
              </button>

              <button
                id="btn-evaluate-solution"
                onClick={handleEvaluateSolution}
                disabled={evaluating || !userSolution.trim()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 text-sm"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Senior Evaluator Analizando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Evaluar Solución</span>
                  </>
                )}
              </button>
            </div>

            {/* Panel de Pista Pedagógica (AC-6) */}
            {hintExpanded && (
              <div
                id="hint-panel"
                className="mt-4 p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-3"
              >
                {loadingHint && (
                  <div className="flex items-center gap-2 text-amber-300 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>El tutor está formulando una pista socrática...</span>
                  </div>
                )}
                {hintError && (
                  <p className="text-rose-400 text-xs">{hintError}</p>
                )}
                {hintData && !loadingHint && (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                        🧠 Analogía del Mundo Real
                      </p>
                      <p id="hint-analogy" className="text-sm text-amber-100 leading-relaxed italic">
                        {hintData.analogy}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                        ❓ Preguntas Guía
                      </p>
                      <ul id="hint-questions" className="space-y-1.5">
                        {hintData.guidingQuestions.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                            <span className="text-amber-400 font-bold mt-0.5">{i + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      * El tutor socrático no revela la respuesta ni escribe código — te guía para que la descubras.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Panel de Resultados / Feedback del Evaluador Senior */}
          {evaluationResult && (
            <div
              id="evaluation-results-panel"
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Dictamen del Senior Evaluator</h3>
                  <p className="text-xs text-slate-400">
                    Evaluación deliberada sin sesgo ni condescendencia
                  </p>
                </div>
                <div id="score-badge-container">
                  {getScoreBadge(evaluationResult.score)}
                </div>
              </div>

              {/* Feedback central */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Retroalimentación Técnica
                </h4>
                <div
                  id="evaluation-feedback-text"
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-200 text-sm leading-relaxed"
                >
                  {evaluationResult.feedback}
                </div>
              </div>

              {/* Fortalezas y Puntos Ciegos / Trade-offs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fortalezas */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Fortalezas Identificadas</span>
                  </div>
                  {evaluationResult.strengths && evaluationResult.strengths.length > 0 ? (
                    <ul id="evaluation-strengths-list" className="space-y-1 text-xs text-slate-300">
                      {evaluationResult.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No se destacaron puntos sobresalientes.</p>
                  )}
                </div>

                {/* Puntos ciegos / Trade-offs omitidos */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Puntos Ciegos / Trade-offs Omitidos</span>
                  </div>
                  {evaluationResult.missingTradeoffs && evaluationResult.missingTradeoffs.length > 0 ? (
                    <ul id="evaluation-missing-tradeoffs-list" className="space-y-1 text-xs text-slate-300">
                      {evaluationResult.missingTradeoffs.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Análisis completo sin omisiones evidentes.</p>
                  )}
                </div>
              </div>

              {/* Próximo repaso programado (SRS) */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>
                    Próximo Repaso SRS:{' '}
                    <strong id="next-review-date" className="text-indigo-300 font-mono">
                      {evaluationResult.nextReviewAt
                        ? new Date(evaluationResult.nextReviewAt).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Programado'}
                    </strong>
                  </span>
                </div>
                <div className="font-mono text-slate-400">
                  Etapa SRS: <span className="text-slate-200">{evaluationResult.srsStage ?? 1}</span> | Intervalo:{' '}
                  <span className="text-slate-200">{evaluationResult.intervalDays ?? 1}d</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
