import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Upload,
  RotateCcw,
  X,
  FlipHorizontal,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

/**
 * RoundPhotoCapture:
 * Componente modular para capturar y gestionar un lote de 1 a 6 imágenes fotográficas de libreta.
 * Soporta:
 * - Cámara web / smartphone (WebRTC)
 * - Subida de archivos (múltiple o individual)
 * - Galería de miniaturas (#photo-capture-gallery)
 * - Eliminación individual
 * - Agregación continua hasta 6 imágenes
 */
export function RoundPhotoCapture({
  images = [],
  onImagesChange,
  maxImages = 6,
  disabled = false,
}) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

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
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Detectar cámaras disponibles
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

  const startCamera = async (mode = facingMode) => {
    stopStream();
    setCameraError(null);

    if (images.length >= maxImages) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no soporta acceso directo a la cámara. Puedes subir fotos manualmente.');
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
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play?.().catch(() => {});
        }
      }, 50);
    } catch (err) {
      console.warn('Error al acceder a la cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Acceso a la cámara bloqueado. Permite el acceso o sube fotos desde tus archivos.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No se encontró cámara conectada. Sube tus fotos manualmente.');
      } else {
        setCameraError(`No se pudo iniciar la cámara: ${err.message || 'Error desconocido'}`);
      }
      setIsCameraActive(false);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || images.length >= maxImages) return;

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
      const newImages = [...images, dataUrl];
      onImagesChange(newImages);

      // Cerrar la vista de cámara tras la captura para volver a la galería
      stopStream();
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    let loadedCount = 0;
    const readImages = [];

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (dataUrl) {
          readImages.push(dataUrl);
        }
        loadedCount += 1;
        if (loadedCount === filesToProcess.length) {
          onImagesChange((prev) => {
            const currentList = Array.isArray(prev) ? prev : images;
            return [...currentList, ...readImages];
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);
  };

  const canAddMore = images.length < maxImages && !disabled;

  return (
    <div className="w-full space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {/* Input accesible de archivo múltiple */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        id="camera-fallback-file-input"
        data-testid="camera-fallback-file-input"
        className="hidden"
        onChange={handleFileUpload}
        disabled={!canAddMore}
      />

      {cameraError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <p>{cameraError}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-200 underline hover:text-white"
            >
              <Upload className="w-3.5 h-3.5" /> Subir fotos desde el disco
            </button>
          </div>
        </div>
      )}

      {/* VISTA EN VIVO DE CÁMARA */}
      {isCameraActive && (
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Guías de encuadre */}
          <div className="absolute inset-0 pointer-events-none p-6 sm:p-10 flex flex-col justify-between">
            <div className="flex justify-between w-full">
              <div className="w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
              <div className="w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
            </div>
            <div className="border border-white/20 border-dashed rounded-lg flex-1 mx-2 my-2 flex items-center justify-center bg-indigo-950/10 backdrop-blur-[1px]">
              <span className="text-[11px] font-medium tracking-wide uppercase text-white/70 bg-black/50 px-3 py-1 rounded-full border border-white/10">
                Encuadra la página ({images.length + 1} de {maxImages})
              </span>
            </div>
            <div className="flex justify-between w-full">
              <div className="w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
              <div className="w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
            </div>
          </div>

          {/* Controles de cámara flotantes */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={stopStream}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-300 backdrop-blur transition"
            >
              <CameraOff className="w-4 h-4" />
              <span>Cerrar</span>
            </button>

            <button
              type="button"
              id="btn-capture-frame"
              onClick={captureFrame}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/40 active:scale-95 transition"
            >
              <Camera className="w-4 h-4" />
              <span>📸 Tomar Foto</span>
            </button>

            {hasMultipleCameras ? (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-300 backdrop-blur transition"
                title="Voltear cámara"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>
        </div>
      )}

      {/* CONTROLES DE AGREGACIÓN (SI CÁMARA INACTIVA Y HAY CUPO) */}
      {!isCameraActive && canAddMore && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            id="btn-activate-camera"
            onClick={() => startCamera(facingMode)}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-md shadow-indigo-600/25 active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>{images.length === 0 ? 'Activar Cámara' : 'Tomar otra foto con cámara'}</span>
          </button>

          <button
            type="button"
            id="btn-manual-upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>Subir fotos de archivo</span>
          </button>

          <span className="text-xs text-slate-400 ml-auto">
            {images.length} de {maxImages} fotos agregadas
          </span>
        </div>
      )}

      {/* GALERÍA DE MINIATURAS (#photo-capture-gallery) */}
      <div
        id="photo-capture-gallery"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2"
      >
        {images.map((imgSrc, index) => (
          <div
            key={index}
            className="group relative aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-md flex flex-col"
          >
            <img
              src={imgSrc}
              alt={`Página de resolución ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white">
              Pág. {index + 1}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                aria-label={`Eliminar foto ${index + 1}`}
                className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white opacity-80 group-hover:opacity-100 transition shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {/* Placeholder para agregar foto adicional */}
        {canAddMore && !isCameraActive && (
          <button
            type="button"
            id="btn-add-photo"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900 flex flex-col items-center justify-center p-3 text-slate-400 hover:text-indigo-400 transition"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-[11px] font-medium text-center">Añadir foto ({images.length}/{maxImages})</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default RoundPhotoCapture;
