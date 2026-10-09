import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import '../utils/monacoSetup';
import { runCodeInWorker } from '../utils/codeRunner';
import { Volume2, Play, Send, RotateCcw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export function CodingPlayground() {
  const [level, setLevel] = useState('junior');
  const [challenges, setChallenges] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Execution & Output state
  const [activeConsoleTab, setActiveConsoleTab] = useState('tests'); // 'tests' | 'logs'
  const [runReport, setRunReport] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  const currentTopic = challenges.find((c) => c._id === selectedTopicId);
  const challenge = currentTopic?.codingChallenge;

  useEffect(() => {
    fetchChallenges(level);
  }, [level]);

  const fetchChallenges = async (lvl) => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/practice/coding/challenges?level=${lvl}`);
      if (!res.ok) {
        throw new Error('No se pudieron cargar los retos de código');
      }
      const data = await res.json();
      setChallenges(data);
      if (data.length > 0) {
        setSelectedTopicId(data[0]._id);
        setCode(data[0].codingChallenge?.starterCode || '');
      } else {
        setSelectedTopicId('');
        setCode('');
      }
      setRunReport(null);
      setEvaluation(null);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (newLvl) => {
    setLevel(newLvl);
  };

  const handleSelectChallenge = (e) => {
    const id = e.target.value;
    setSelectedTopicId(id);
    const found = challenges.find((c) => c._id === id);
    if (found) {
      setCode(found.codingChallenge?.starterCode || '');
    }
    setRunReport(null);
    setEvaluation(null);
  };

  const handleResetCode = () => {
    if (challenge) {
      setCode(challenge.starterCode || '');
      setRunReport(null);
      setEvaluation(null);
    }
  };

  const handleSpeakDescription = () => {
    if (!('speechSynthesis' in window) || !challenge?.description) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(challenge.description);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  };

  const executeCode = async () => {
    if (!challenge) return null;
    setRunning(true);
    setActiveConsoleTab('tests');
    try {
      const report = await runCodeInWorker({
        code,
        functionName: challenge.functionName,
        testCases: challenge.testCases,
      });
      setRunReport(report);
      return report;
    } finally {
      setRunning(false);
    }
  };

  const handleRunCode = async () => {
    await executeCode();
  };

  const handleSubmitCode = async () => {
    if (!currentTopic || !challenge) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const report = await executeCode();
      const payloadResults = report && report.results
        ? report.results.map(({ index, status }) => ({ index, status }))
        : [];

      const payload = {
        topicId: currentTopic._id,
        code,
        testResults: {
          passedCount: report ? report.passedCount : 0,
          totalCount: challenge.testCases.length,
          executionTimeMs: report ? report.executionTimeMs : 0,
          results: payloadResults,
        },
      };

      const res = await fetch('http://localhost:5000/api/practice/coding/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error evaluando el código');
      }

      const evalData = await res.json();
      setEvaluation(evalData);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const levelBadgeColors = {
    junior: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    mid: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    senior: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <section id="coding-playground-section" className="w-full flex flex-col gap-6">
      {/* Selector de Nivel y Retos */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div id="coding-level-selector" className="flex items-center gap-2">
          <button
            id="coding-level-junior"
            onClick={() => handleLevelChange('junior')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
              level === 'junior'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Junior
          </button>
          <button
            id="coding-level-mid"
            onClick={() => handleLevelChange('mid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
              level === 'mid'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Mid
          </button>
          <button
            id="coding-level-senior"
            onClick={() => handleLevelChange('senior')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
              level === 'senior'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Senior
          </button>
        </div>

        {challenges.length > 0 && (
          <div className="w-full sm:w-auto min-w-[280px]">
            <select
              id="coding-challenge-selector"
              value={selectedTopicId}
              onChange={handleSelectChallenge}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              {challenges.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} {c.isDue ? '• Repaso Pendiente' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {apiError && (
        <div id="coding-api-error" className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Cargando retos de código...</div>
      ) : challenges.length === 0 ? (
        <div id="coding-empty-state" className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-sm">
          No hay retos de código para este nivel. Ejecuta <code className="text-emerald-400 bg-slate-950 px-2 py-1 rounded">npm run seed</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Panel Izquierdo: Problema */}
          <div id="coding-problem-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  id="coding-problem-level-badge"
                  className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider mb-2 ${
                    levelBadgeColors[currentTopic?.level] || levelBadgeColors.junior
                  }`}
                >
                  NIVEL {currentTopic?.level?.toUpperCase()}
                </span>
                <h3 id="coding-problem-title" className="text-xl font-bold text-white">
                  {currentTopic?.title}
                </h3>
              </div>

              {'speechSynthesis' in window && (
                <button
                  id="btn-coding-audio"
                  onClick={handleSpeakDescription}
                  title="Escuchar enunciado"
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div id="coding-problem-description" className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {challenge?.description}
            </div>

            {challenge?.constraints && challenge.constraints.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Restricciones</h4>
                <ul id="coding-constraints-list" className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {challenge.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ejemplos de Tests Visibles */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Casos de Ejemplo</h4>
              <div id="coding-examples-list" className="space-y-3">
                {challenge?.testCases
                  ?.filter((tc) => !tc.isHidden)
                  .map((tc, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs font-mono">
                      <div>
                        <span className="text-slate-500">Entrada: </span>
                        <span className="text-slate-300">{JSON.stringify(tc.input)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Esperado: </span>
                        <span className="text-emerald-400">{JSON.stringify(tc.expected)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Editor Monaco + Consola */}
          <div className="flex flex-col gap-4 w-full">
            {/* Editor Container */}
            <div id="coding-editor-container" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">solution.js</span>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-reset-code"
                    onClick={handleResetCode}
                    title="Restaurar código inicial"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    id="btn-run-code"
                    onClick={handleRunCode}
                    disabled={running || submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{running ? 'Ejecutando...' : 'Run Code'}</span>
                  </button>
                  <button
                    id="btn-submit-code"
                    onClick={handleSubmitCode}
                    disabled={running || submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Evaluando...' : 'Submit & Evaluate'}</span>
                  </button>
                </div>
              </div>

              <Editor
                height="420px"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                }}
              />
            </div>

            {/* Consola e Inspección de Tests */}
            <div id="coding-console" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  id="console-tab-tests"
                  onClick={() => setActiveConsoleTab('tests')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeConsoleTab === 'tests' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Resultados de Tests
                </button>
                <button
                  id="console-tab-logs"
                  onClick={() => setActiveConsoleTab('logs')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeConsoleTab === 'logs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Logs de Consola
                </button>
              </div>

              {activeConsoleTab === 'tests' ? (
                <div>
                  {!runReport ? (
                    <div className="text-slate-500 text-xs py-4 text-center">Ejecuta tu código para ver los resultados de los tests.</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span id="test-results-summary" className="font-bold text-slate-200">
                          {runReport.passedCount}/{runReport.totalCount} tests pasaron
                        </span>
                        <span id="execution-time" className="text-slate-400">
                          {runReport.executionTimeMs} ms
                        </span>
                      </div>

                      {runReport.error && (
                        <div id="coding-error-banner" className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-mono">
                          {runReport.error.type}: {runReport.error.message}
                        </div>
                      )}

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {runReport.results?.map((r) => (
                          <div
                            key={r.index}
                            id={`test-result-item-${r.index}`}
                            data-status={r.status}
                            className={`p-3 rounded-lg border text-xs font-mono ${
                              r.status === 'PASSED'
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'
                                : 'bg-rose-500/5 border-rose-500/20 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center gap-1.5 font-bold">
                                {r.status === 'PASSED' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400" />
                                )}
                                Test #{r.index + 1} — {r.status}
                              </span>
                              <span className="text-slate-500">{r.executionTimeMs} ms</span>
                            </div>

                            {r.isHidden ? (
                              <div className="text-slate-400 text-xs italic">Test oculto #{r.index + 1} — {r.status}</div>
                            ) : (
                              <div className="space-y-0.5 text-xs">
                                <div>
                                  <span className="text-slate-500">Entrada: </span>
                                  <span>{JSON.stringify(r.input)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Esperado: </span>
                                  <span className="text-emerald-400">{JSON.stringify(r.expected)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Obtenido: </span>
                                  <span className={r.status === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}>
                                    {JSON.stringify(r.actual)}
                                  </span>
                                </div>
                                {r.error && <div className="text-rose-400 font-bold">Error: {r.error}</div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div id="console-logs-output" className="bg-slate-950 p-3 rounded-lg text-xs font-mono min-h-[100px] max-h-48 overflow-y-auto space-y-1">
                  {!runReport || !runReport.logs || runReport.logs.length === 0 ? (
                    <span className="text-slate-600">Sin salida de consola.</span>
                  ) : (
                    runReport.logs.map((l, i) => (
                      <div
                        key={i}
                        className={
                          l.level === 'warn'
                            ? 'text-amber-400'
                            : l.level === 'error'
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }
                      >
                        [{l.level.toUpperCase()}] {l.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panel de Evaluación tras Submit */}
      {evaluation && (
        <div id="coding-evaluation-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Auditoría de Solución</span>
              {!evaluation.aiReviewed && (
                <span id="coding-eval-no-ai" className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full">
                  Auditoría IA omitida: tests fallidos
                </span>
              )}
            </h3>
            <div id="coding-eval-score" className="text-2xl font-black text-emerald-400 font-mono">
              {evaluation.score}/5
            </div>
          </div>

          <p id="coding-eval-feedback" className="text-sm text-slate-300 leading-relaxed">
            {evaluation.feedback}
          </p>

          {evaluation.complexity && (
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500">Complejidad Temporal: </span>
                <span id="coding-eval-complexity-time" className="text-indigo-400 font-bold">{evaluation.complexity.time}</span>
              </div>
              <div>
                <span className="text-slate-500">Complejidad Espacial: </span>
                <span id="coding-eval-complexity-space" className="text-purple-400 font-bold">{evaluation.complexity.space}</span>
              </div>
            </div>
          )}

          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Fortalezas</h4>
              <ul id="coding-eval-strengths" className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.improvements && evaluation.improvements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Puntos a Mejorar</h4>
              <ul id="coding-eval-improvements" className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                {evaluation.improvements.map((imp, i) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-slate-500 font-mono border-t border-slate-800 pt-3">
            Próximo repaso SRS: <span id="coding-next-review-date" className="text-slate-300">{new Date(evaluation.nextReviewAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </section>
  );
}
