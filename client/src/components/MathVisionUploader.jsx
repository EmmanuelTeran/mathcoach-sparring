import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  RotateCcw,
  Calendar,
  X,
  FlipHorizontal,
} from 'lucide-react';

/**
 * Estados del componente MathVisionUploader:
 * - IDLE: Sin stream, botón para activar cámara o subir archivo
 * - STREAMING: Vista previa en vivo con guías de encuadre y botón de captura
 * - PREVIEW: Fotograma congelado o imagen cargada, listo para evaluar o repetir
 * - ANALYZING: Petición en curso al backend con feedback inmersivo
 * - RESULT: Evaluación completada con desglose, hints y actualización SRS
 * - ERROR: Fallo de red, timeout o permisos
 */
export function MathVisionUploader({
  topic = {},
  onEvaluationComplete,
  onCancel,
}) {
  const [state, setState] = useState('IDLE'); // 'IDLE' | 'STREAMING' | 'PREVIEW' | 'ANALYZING' | 'RESULT' | 'ERROR'
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [errorMessage, setErrorMessage] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Detener todos los tracks del stream activo
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      stopStream();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopStream]);

  // Verificar si hay múltiples cámaras disponibles
  useEffect(() => {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {
          setHasMultipleCameras(false);
        });
    }
  }, []);

  // Iniciar la captura de cámara con constraints
  const startCamera = async (mode = facingMode) => {
    stopStream();
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage(
        'Tu navegador o dispositivo no soporta acceso directo a la cámara. Puedes subir una foto de tu cuaderno manualmente.'
      );
      setState('IDLE');
      return;
    }

    const constraints = {
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setState('STREAMING');

      // Asignar al elemento video tras renderizar
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play?.().catch(() => {});
        }
      }, 50);
    } catch (err) {
      console.warn('Error al acceder a la cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Acceso a la cámara bloqueado. Puedes permitirlo en los ajustes del navegador o subir una foto directamente.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage(
          'No se encontró ningún dispositivo de cámara conectado. Puedes subir una foto manualmente.'
        );
      } else {
        setErrorMessage(
          `No se pudo iniciar la cámara (${err.message || 'Error desconocido'}). Por favor, sube una foto de tu ejercicio.`
        );
      }
      setState('IDLE');
    }
  };

  // Alternar entre cámara trasera y delantera
  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capturar fotograma en Canvas invisible y exportar a JPEG Base64
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopStream();
      setState('PREVIEW');
    }
  };

  // Repetir foto y regresar a stream
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Cancelar y volver a IDLE
  const handleCloseCamera = () => {
    stopStream();
    setCapturedImage(null);
    setState('IDLE');
    if (onCancel) onCancel();
  };

  // Procesar archivo manual (fallback o subida por input)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setCapturedImage(dataUrl);
      stopStream();
      setState('PREVIEW');
    };
    reader.readAsDataURL(file);
  };

  // Disparar evaluación con IA hacia el backend
  const handleEvaluate = async () => {
    if (!capturedImage) return;

    setState('ANALYZING');
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 segundos timeout

    const payload = {
      problemId: topic._id || topic.id || '651a2b3c4d5e6f7a8b9c0d1e',
      image: capturedImage,
      metadata: {
        level: topic.level ?? 1,
        source: topic.source || 'CONAMAT',
        capturedAt: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch('/api/evaluate-math', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`El servidor respondió con código ${response.status}`);
      }

      const result = await response.json();
      setEvaluationResult(result);
      setState('RESULT');

      if (onEvaluationComplete) {
        onEvaluationComplete(result);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error al evaluar math vision:', err);
      if (err.name === 'AbortError') {
        setErrorMessage('La evaluación superó el tiempo límite (35s). Verifica tu conexión y reintenta.');
      } else {
        setErrorMessage(
          'Error al evaluar con la IA. No pudimos procesar la imagen del ejercicio. Puedes reintentar.'
        );
      }
      setState('PREVIEW'); // Mantiene la foto capturada para permitir reintento
    }
  };

  // Reiniciar flujo para otro problema
  const handleReset = () => {
    stopStream();
    setCapturedImage(null);
    setEvaluationResult(null);
    setErrorMessage(null);
    setState('IDLE');
  };

  // Badge pedagógico según el puntaje (0 a 5)
  const renderScoreBadge = (score = 0) => {
    let colorClasses = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    let label = 'Error conceptual / Fallo total';

    if (score >= 4) {
      colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      label = 'Resolución sólida / Rigor matemático completo';
    } else if (score >= 2) {
      colorClasses = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      label = 'Procedimiento en progreso con fallos algebraicos';
    }

    return (
      <div
        className={`px-4 py-2 rounded-xl border flex items-center justify-between gap-3 ${colorClasses}`}
        id="evaluation-score-badge"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <span className="text-xl font-black font-mono tracking-tight">{score} / 5</span>
      </div>
    );
  };

  return (
    <div
      id="math-vision-uploader-container"
      className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Input de archivo accesible para fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        data-testid="camera-fallback-file-input"
        id="camera-fallback-file-input"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* HEADER DEL COMPONENTE */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">
            Active Recall Multimodal
          </span>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Captura de Cuaderno Físico
            {topic.title && (
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {topic.title}
              </span>
            )}
          </h3>
        </div>
        {state !== 'IDLE' && state !== 'ANALYZING' && (
          <button
            onClick={handleCloseCamera}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title="Cerrar uploader"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* MENSAJES DE ERROR / ADVERTENCIA */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <p>{errorMessage}</p>
            {state === 'IDLE' && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-200 underline hover:text-white"
              >
                <Upload className="w-3.5 h-3.5" /> Subir foto desde el disco
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. ESTADO IDLE */}
      {state === 'IDLE' && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
            <Camera className="w-8 h-8" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1">
            Resuelve el ejercicio a mano en tu libreta
          </h4>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            Apunta la cámara de tu smartphone o webcam al procedimiento escrito. Gemini 1.5 Pro evaluará tu deducción matemática paso a paso.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
            <button
              id="btn-activate-camera"
              onClick={() => startCamera(facingMode)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Activar Cámara</span>
            </button>

            <button
              id="btn-manual-upload"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition-all border border-slate-700"
            >
              <Upload className="w-4 h-4" />
              <span>Subir foto manualmente</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ESTADO STREAMING (EN VIVO CON GUÍAS DE ENCUADRE) */}
      {state === 'STREAMING' && (
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* OVERLAY DE ENCUADRE ESTILO ESCÁNER */}
            <div className="absolute inset-0 pointer-events-none p-6 sm:p-10 flex flex-col justify-between">
              {/* Esquinas superiores */}
              <div className="flex justify-between w-full">
                <div className="w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg shadow-sm" />
                <div className="w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg shadow-sm" />
              </div>

              {/* Retícula sutil central */}
              <div className="border border-white/20 border-dashed rounded-lg flex-1 mx-2 my-2 flex items-center justify-center bg-indigo-950/10 backdrop-blur-[1px]">
                <span className="text-[11px] font-medium tracking-wide uppercase text-white/50 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  Encuadra el procedimiento del cuaderno
                </span>
              </div>

              {/* Esquinas inferiores */}
              <div className="flex justify-between w-full">
                <div className="w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg shadow-sm" />
                <div className="w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg shadow-sm" />
              </div>
            </div>

            {/* Banner de consejos de captura */}
            <div className="absolute bottom-2 inset-x-4 pointer-events-none text-center">
              <span className="text-[11px] font-medium text-slate-300 bg-slate-900/85 backdrop-blur px-3 py-1 rounded-full border border-slate-700/80 shadow">
                💡 Asegúrate de contar con buena iluminación y que el procedimiento sea legible
              </span>
            </div>
          </div>

          {/* CONTROLES OPERATIVOS EN VIVO */}
          <div className="flex items-center justify-between w-full mt-4 px-2">
            <button
              onClick={handleCloseCamera}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            >
              <CameraOff className="w-4 h-4" />
              <span>Cerrar Cámara</span>
            </button>

            <button
              id="btn-capture-frame"
              onClick={captureFrame}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 transform active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>📸 Tomar Foto / Capturar</span>
            </button>

            {hasMultipleCameras ? (
              <button
                onClick={toggleCameraFacingMode}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                title="Cambiar entre cámara trasera y delantera"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>Voltear</span>
              </button>
            ) : (
              <div className="w-16" />
            )}
          </div>
        </div>
      )}

      {/* 3. ESTADO PREVIEW & ANALYZING (FOTOGRAMA CONGELADO) */}
      {(state === 'PREVIEW' || state === 'ANALYZING') && capturedImage && (
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-black rounded-xl overflow-hidden border border-slate-800 shadow-md">
            <img
              src={capturedImage}
              alt="Ejercicio manuscrito capturado"
              className="w-full h-full object-contain bg-slate-950"
            />

            {/* EFECTO VISUAL DE ESCANEO DURANTE EL ANÁLISIS */}
            {state === 'ANALYZING' && (
              <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin mb-4 shadow-lg shadow-indigo-500/20" />
                <span className="text-base font-bold text-white mb-2">
                  El profesor de IA está evaluando tus deducciones matemáticas...
                </span>
                <p className="text-xs text-indigo-200/80 max-w-sm">
                  Examinando rigor algebraico, pasos de despeje y verificando errores de signos.
                </p>
                {/* Línea animada de escáner */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent top-0 animate-pulse" />
              </div>
            )}
          </div>

          {/* ACCIONES DE PREVISUALIZACIÓN */}
          {state === 'PREVIEW' && (
            <div className="flex items-center justify-center gap-4 w-full mt-5">
              <button
                id="btn-retake-photo"
                onClick={handleRetake}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>🔄 Repetir Foto</span>
              </button>

              <button
                id="btn-evaluate-math"
                onClick={handleEvaluate}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>🚀 Evaluar con IA</span>
              </button>
            </div>
          )}

          {/* BOTÓN DE REINTENTO ANTE ERROR */}
          {errorMessage && state === 'PREVIEW' && (
            <div className="mt-4">
              <button
                onClick={handleEvaluate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reintentar Envío
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. ESTADO RESULT: EVALUACIÓN PEDAGÓGICA Y SRS */}
      {state === 'RESULT' && evaluationResult && (
        <div id="evaluation-results-panel" className="space-y-4 animate-fadeIn">
          {/* BADGE DE PUNTAJE */}
          {renderScoreBadge(evaluationResult.score)}

          {/* DESGLOSE PASO A PASO */}
          {evaluationResult.feedback_paso_a_paso && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h5 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Desglose Paso a Paso
              </h5>
              <p
                id="evaluation-feedback-text"
                className="text-sm text-slate-200 leading-relaxed whitespace-pre-line"
              >
                {evaluationResult.feedback_paso_a_paso}
              </p>
            </div>
          )}

          {/* PISTA SOCRÁTICA */}
          {evaluationResult.hint && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs uppercase font-bold text-amber-300 tracking-wider mb-1">
                  Pista Socrática para el Próximo Intento
                </h5>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {evaluationResult.hint}
                </p>
              </div>
            </div>
          )}

          {/* TARJETA SRS INTERVALO */}
          {evaluationResult.srs && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>
                  Reprogramado para repaso en {evaluationResult.srs.interval} días
                </span>
              </div>
              <span className="font-mono text-[11px] text-indigo-300/80">
                Factor E: {evaluationResult.srs.efactor?.toFixed?.(2) ?? evaluationResult.srs.efactor}
              </span>
            </div>
          )}

          {/* ACCIÓN DE CONTINUAR */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-md shadow-indigo-600/25"
            >
              <span>Practicar Otro Problema</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MathVisionUploader;
