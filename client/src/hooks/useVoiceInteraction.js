import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para interacción por voz (Speech-to-Text nativo y Text-to-Speech)
 * con fallback accesible y detección de compatibilidad de navegador.
 */
export function useVoiceInteraction({ onTranscriptComplete } = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Chequear disponibilidad en window
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event) => {
          let currentInterim = '';
          let finalResult = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalResult += piece;
            } else {
              currentInterim += piece;
            }
          }

          if (finalResult) {
            setTranscript((prev) => {
              const updated = prev ? `${prev} ${finalResult}` : finalResult;
              if (onTranscriptComplete) onTranscriptComplete(updated);
              return updated;
            });
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error);
          setIsListening(false);
          // Errores comunes: 'no-speech', 'audio-capture', 'not-allowed'
          if (event.error === 'not-allowed') {
            setError('Permiso de micrófono denegado. Puedes usar el modo texto.');
          } else if (event.error === 'no-speech') {
            setError('No se detectó audio. Intenta hablar más claro o usa texto.');
          } else {
            setError(`Error de audio: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.error('Error instantiating SpeechRecognition:', err);
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [onTranscriptComplete]);

  // Iniciar escucha del micrófono
  const startListening = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) {
      setError('Reconocimiento de voz no disponible en este entorno.');
      return;
    }

    // Detener cualquier síntesis de voz en curso antes de escuchar
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
    }
  }, []);

  // Detener escucha
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Could not stop speech recognition:', err);
      }
    }
    setIsListening(false);
  }, []);

  // Sintetizar voz para reproducir la réplica del stakeholder
  const speakText = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  }, []);

  // Cancelar síntesis
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsSpeaking(false);
  }, []);

  // Limpiar transcripción actual
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    isSpeaking,
    transcript,
    setTranscript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    clearTranscript,
  };
}
