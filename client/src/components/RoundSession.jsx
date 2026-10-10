import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Send,
  Camera,
  ArrowLeft,
  RefreshCw,
  Award,
} from 'lucide-react';
import { MathStatement } from './MathStatement';
import { RoundPhotoCapture } from './RoundPhotoCapture';
import { RoundResults } from './RoundResults';
import { CATEGORIES } from '../constants/categories';

/**
 * Estados de la Máquina de Estados de RoundSession:
 * - LOADING: Petición a POST /api/rounds
 * - PRACTICING: Visualización de ejercicios con MathStatement (#round-header, cronómetro)
 * - CAPTURING: Captura de 1 a 6 fotos de la libreta (#btn-submit-round)
 * - EVALUATING: Enviando a POST /api/rounds/:id/evaluate con indicador de análisis
 * - RECOVERY_422: Manejo de ejercicios no encontrados (#alert-missing-exercises)
 * - RESULTS: Vista detallada de resultados y progresión con RoundResults
 * - ERROR: Fallo de red, catálogo vacío u otro error irrecuperable
 */
export function RoundSession({
  topicId,
  category = 'technique',
  onFinishSession,
  onGoToDashboard,
}) {
  const [state, setState] = useState('LOADING'); // 'LOADING' | 'PRACTICING' | 'CAPTURING' | 'EVALUATING' | 'RECOVERY_422' | 'RESULTS' | 'ERROR'
  const [roundData, setRoundData] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [missingExercises, setMissingExercises] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef(null);

  // Iniciar/Detener cronómetro
  useEffect(() => {
    if (state === 'PRACTICING') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state]);

  // Instanciar o recuperar la ronda con POST /api/rounds
  const fetchOrCreateRound = async () => {
    setState('LOADING');
    setErrorMessage(null);
    setMissingExercises([]);
    setCapturedImages([]);
    setEvaluationResult(null);
    setElapsedSeconds(0);

    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topicId || '651a2b3c4d5e6f7a8b9c0d1e',
          category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status} al obtener la ronda.`);
      }

      const data = await response.json();
      setRoundData(data);
      setState('PRACTICING');
    } catch (err) {
      console.error('Error fetching round:', err);
      setErrorMessage(err.message || 'Error al conectar con el servidor.');
      setState('ERROR');
    }
  };

  useEffect(() => {
    fetchOrCreateRound();
  }, [topicId, category]);

  // Formato MM:SS para cronómetro informativo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Enviar fotos a evaluar
  const handleSubmitEvaluation = async () => {
    if (!capturedImages.length || !roundData?.roundId) return;

    setState('EVALUATING');
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/rounds/${roundData.roundId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: capturedImages }),
      });

      if (response.status === 422) {
        const err422 = await response.json();
        setMissingExercises(err422.missing || []);
        setState('RECOVERY_422');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status} durante la evaluación.`);
      }

      const result = await response.json();
      setEvaluationResult(result);
      setState('RESULTS');
      if (onFinishSession) {
        onFinishSession(result);
      }
    } catch (err) {
      console.error('Error evaluating round:', err);
      setErrorMessage(err.message || 'Error al procesar la evaluación con IA.');
      setState('CAPTURING'); // Conserva las fotos y permite reintento
    }
  };

  // Renderizado por estados
  if (state === 'LOADING') {
    return (
      <div id="round-loading-state" className="w-full flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm font-medium">Preparando ronda personalizada de ejercicios...</p>
      </div>
    );
  }

  if (state === 'ERROR') {
    return (
      <div id="round-error-state" className="w-full max-w-xl mx-auto p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-slate-200 text-center space-y-4 my-8">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">No se pudo iniciar la ronda</h3>
        <p className="text-xs text-rose-300">{errorMessage}</p>
        <div className="flex justify-center gap-3 pt-2">
          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Volver al Panel
            </button>
          )}
          <button
            onClick={fetchOrCreateRound}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (state === 'RESULTS' && evaluationResult) {
    return (
      <RoundResults
        round={roundData}
        evaluation={evaluationResult}
        onRestart={fetchOrCreateRound}
        onGoToDashboard={onGoToDashboard}
      />
    );
  }

  const categoryLabel = CATEGORIES[roundData.category] || roundData.category || 'Técnica';
  const expertTime = roundData.totalExpertMinutes || 15;

  return (
    <div id="round-session-container" className="w-full max-w-3xl mx-auto space-y-6">
      {/* 1. ENCABEZADO DE LA RONDA (#round-header) */}
      <header
        id="round-header"
        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Ronda de Práctica • {categoryLabel}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Dificultad {roundData.difficulty}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {roundData.topic?.title || 'Tema de Práctica'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Un experto lo resuelve en ~{expertTime} min ({roundData.exercises?.length || 0} ejercicios)
          </p>
        </div>

        {/* Cronómetro informativo opcional (#round-timer) */}
        <div
          id="round-timer"
          className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono font-medium shadow-inner"
        >
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Tiempo transcurrido: {formatTime(elapsedSeconds)}</span>
        </div>
      </header>

      {/* MENSAJES DE ERROR GENERALES */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 2. MODO DE RESOLUCIÓN (PRACTICING) */}
      {state === 'PRACTICING' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {roundData.exercises?.map((exercise) => (
              <article
                key={exercise.order}
                id={`round-exercise-${exercise.order}`}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">
                      {exercise.order}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      Ejercicio #{exercise.order}
                    </h4>
                  </div>
                  {exercise.expertMinutes && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      ~{exercise.expertMinutes} min
                    </span>
                  )}
                </div>

                <MathStatement statement={exercise.statement} />
              </article>
            ))}
          </div>

          {/* BOTÓN PARA FINALIZAR RESOLUCIÓN Y PASAR A CAPTURA (#btn-finish-round) */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              id="btn-finish-round"
              onClick={() => setState('CAPTURING')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition transform active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>Ya terminé, capturar</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MODO DE CAPTURA / RECOVERY_422 / EVALUATING */}
      {(state === 'CAPTURING' || state === 'RECOVERY_422' || state === 'EVALUATING') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">
                Auditoría Multimodal
              </span>
              <h3 className="text-lg font-bold text-white">
                Captura fotográfica de tu libreta (1 a 6 fotos)
              </h3>
            </div>
            {state !== 'EVALUATING' && (
              <button
                type="button"
                onClick={() => setState('PRACTICING')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a ver ejercicios</span>
              </button>
            )}
          </div>

          {/* ALERTA 422: EJERCICIOS FALTANTES (#alert-missing-exercises) */}
          {state === 'RECOVERY_422' && missingExercises.length > 0 && (
            <div
              id="alert-missing-exercises"
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm space-y-2 animate-fadeIn"
            >
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>La IA no encontró el procedimiento de los siguientes ejercicios:</span>
              </div>
              <p className="text-xs text-amber-200/90 pl-7">
                Ejercicios faltantes:{' '}
                <strong className="text-white underline">
                  {missingExercises.map((num) => `#${num}`).join(', ')}
                </strong>
                . Tus fotos anteriores siguen guardadas. Por favor agrega una foto más clara o la hoja donde resolviste esos problemas y vuelve a presionar &quot;Enviar a evaluar&quot;.
              </p>
            </div>
          )}

          {/* INDICADOR DE ANÁLISIS EN EVALUATING */}
          {state === 'EVALUATING' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin shadow-lg shadow-indigo-500/20" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  Evaluando tus deducciones matemáticas con Gemini 1.5 Pro...
                </h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Analizando rigor algebraico, pasos intermedios y progreso en cada ejercicio de la ronda.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* COMPONENTE MODULAR DE CAPTURA 1..6 FOTOS */}
              <RoundPhotoCapture
                images={capturedImages}
                onImagesChange={setCapturedImages}
                maxImages={6}
                disabled={state === 'EVALUATING'}
              />

              {/* BOTÓN DE ENVÍO (#btn-submit-round) */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  {capturedImages.length === 0
                    ? 'Captura al menos 1 fotografía para enviar'
                    : `${capturedImages.length} foto(s) lista(s) para auditar`}
                </span>

                <button
                  type="button"
                  id="btn-submit-round"
                  onClick={handleSubmitEvaluation}
                  disabled={capturedImages.length === 0 || capturedImages.length > 6 || state === 'EVALUATING'}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 disabled:shadow-none transition transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar a evaluar</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RoundSession;
