import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  AlertTriangle,
  Award,
  RefreshCw,
  User,
  Bot,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useVoiceInteraction } from '../hooks/useVoiceInteraction';

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

export function SoftSkillTrainer({ initialTopic }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopic?._id || '');
  const [selectedLevel, setSelectedLevel] = useState(initialTopic?.level || 'junior');
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [roleData, setRoleData] = useState(null); // { role, avatar, scenario, initialQuestion }
  const [conversation, setConversation] = useState([]); // [{ speaker: 'ai'|'user', text, timestamp }]
  const [textFallbackInput, setTextFallbackInput] = useState('');
  const [processingReply, setProcessingReply] = useState(false);
  const [verdictResult, setVerdictResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [useAudioOutput, setUseAudioOutput] = useState(true);

  const chatBottomRef = useRef(null);

  const {
    isSupported: voiceSupported,
    isListening,
    isSpeaking,
    transcript,
    setTranscript,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    clearTranscript,
  } = useVoiceInteraction({
    onTranscriptComplete: (text) => {
      // Sincronizar con el input de fallback por si el usuario quiere editar antes de enviar
      setTextFallbackInput(text);
    },
  });

  // Cargar temas pendientes para práctica de soft skills filtrados por nivel
  const fetchDueTopics = async (level = selectedLevel) => {
    setLoadingTopics(true);
    setErrorMessage('');
    try {
      const url = `${API_BASE}/topics/due${level ? `?level=${level}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar temas pendientes');
      const data = await res.json();

      // Filtrar sólo temas de soft_skill si existen en el payload
      const softSkills = data.filter((t) => t.category === 'soft_skill' || t.type === 'practice');
      const candidateList = softSkills.length > 0 ? softSkills : data;

      let mergedTopics = [...candidateList];
      if (initialTopic && !candidateList.some((t) => t._id === initialTopic._id)) {
        mergedTopics = [initialTopic, ...candidateList];
      }
      setTopics(mergedTopics);

      if (initialTopic?._id && mergedTopics.some((t) => t._id === initialTopic._id)) {
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

  const handleLevelChange = (newLevel) => {
    setSelectedLevel(newLevel);
    setSessionActive(false);
    setRoleData(null);
    setConversation([]);
    setVerdictResult(null);
    setTextFallbackInput('');
    fetchDueTopics(newLevel);
  };

  useEffect(() => {
    fetchDueTopics(selectedLevel);
  }, []);

  // Scroll automático en el chat al agregar mensajes
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, processingReply]);

  // Si cambia transcript por voz, sincronizar con el input
  useEffect(() => {
    if (transcript) {
      setTextFallbackInput(transcript);
    }
  }, [transcript]);

  // Iniciar Sparring
  const handleStartSparring = async (overrideTopicId) => {
    const topicIdToUse = overrideTopicId || selectedTopicId;
    if (!topicIdToUse) {
      setErrorMessage('Por favor selecciona un escenario o tema.');
      return;
    }

    setLoadingStart(true);
    setErrorMessage('');
    setVerdictResult(null);
    setConversation([]);
    setTextFallbackInput('');
    clearTranscript();
    stopSpeaking();

    try {
      const res = await fetch(`${API_BASE}/practice/soft-skill/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topicIdToUse }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Fallo al iniciar el sparring de consultoría.');
      }

      const data = await res.json();
      setRoleData({
        role: data.role,
        roleDescription: data.roleDescription,
        avatar: data.avatar,
        scenario: data.scenario,
        level: data.level || selectedLevel,
      });

      const initialMessage = {
        speaker: 'ai',
        text: data.initialQuestion,
        timestamp: new Date(),
      };

      setConversation([initialMessage]);
      setSessionActive(true);

      // Reproducir por voz la pregunta inicial si está activado
      if (useAudioOutput) {
        speakText(data.initialQuestion);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error al conectar con el sparring de IA.');
    } finally {
      setLoadingStart(false);
    }
  };

  // Enviar réplica (por voz o texto fallback)
  const handleSendReply = async () => {
    const userText = textFallbackInput.trim() || transcript.trim();
    if (!userText) {
      setErrorMessage('Debes hablar por micrófono o escribir tu defensa antes de enviar.');
      return;
    }

    // Detener escucha si estaba activa
    if (isListening) {
      stopListening();
    }
    stopSpeaking();

    const userMessage = {
      speaker: 'user',
      text: userText,
      timestamp: new Date(),
    };

    const updatedHistory = [...conversation, userMessage];
    setConversation(updatedHistory);
    setTextFallbackInput('');
    clearTranscript();
    setProcessingReply(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE}/practice/soft-skill/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId,
          role: roleData?.role,
          roleDescription: roleData?.roleDescription,
          conversationHistory: conversation, // enviamos el historial antes de este mensaje
          userAudioTranscript: userText,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al procesar la respuesta del cliente.');
      }

      const result = await res.json();

      if (!result.isFinalTurn) {
        // Turno intermedio: respuesta del stakeholder
        const aiReply = {
          speaker: 'ai',
          text: result.reply,
          timestamp: new Date(),
        };
        setConversation((prev) => [...prev, aiReply]);

        if (useAudioOutput) {
          speakText(result.reply);
        }
      } else {
        // Turno final: veredicto completo
        setVerdictResult(result);
        setSessionActive(false);
        fetchDueTopics(); // Refrescar cola
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error al comunicar con el sparring.');
    } finally {
      setProcessingReply(false);
    }
  };

  const activeLevel = roleData?.level || selectedLevel;

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
          Score 3/5 - Nivel {lvlText} Aceptable con Oportunidades
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
        <AlertTriangle className="w-4 h-4" />
        Score {score}/5 - Requiere Más Práctica
      </span>
    );
  };

  const userTurnCount = conversation.filter((m) => m.speaker === 'user').length;
  const turnsRemaining = Math.max(0, 3 - userTurnCount);

  return (
    <section className="w-full max-w-4xl mx-auto my-6 text-left" id="soft-skills-section">
      {/* Barra de Control / Selección de Escenario */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Módulo Soft Skills: Sparring por Voz & Consultoría
              </h2>
              <span
                id="dynamic-level-badge-soft-skills"
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
              Simulador interactivo de 3 turnos: entrena Dailies, Code Reviews, negociación y defensa ante stakeholders según tu nivel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              id="soft-skill-topic-selector"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={sessionActive}
              className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px] disabled:opacity-50"
            >
              {topics.length === 0 ? (
                <option value="">(Sin temas en cola)</option>
              ) : (
                topics.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))
              )}
            </select>

            <button
              id="btn-start-sparring"
              onClick={() => handleStartSparring()}
              disabled={loadingTopics || loadingStart || (sessionActive && !verdictResult)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-purple-500/25 active:scale-95"
            >
              {loadingStart ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{sessionActive ? 'Reiniciar Sparring' : 'Iniciar Sparring'}</span>
            </button>

            <button
              id="btn-refresh-topics"
              onClick={() => fetchDueTopics(selectedLevel)}
              disabled={loadingTopics}
              title="Refrescar cola"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTopics ? 'animate-spin' : ''}`} />
            </button>

            {/* Alternador de audio respuesta */}
            <button
              id="btn-toggle-audio-synthesis"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setUseAudioOutput(!useAudioOutput);
              }}
              title={useAudioOutput ? 'Voz de stakeholder activada' : 'Voz silenciada'}
              className={`p-2 rounded-lg border transition ${
                useAudioOutput
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {useAudioOutput ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Selector de Nivel de Progresión (AC-2) */}
        <div className="mt-4 pt-4 border-t border-slate-800/60">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Nivel de Progresión</p>
          <div id="level-selector-soft-skills" className="flex gap-2">
            {['junior', 'mid', 'senior'].map((lvl) => (
              <button
                key={lvl}
                id={`level-btn-${lvl}-soft-skills`}
                onClick={() => handleLevelChange(lvl)}
                disabled={sessionActive && !verdictResult}
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

        {(errorMessage || voiceError) && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage || voiceError}</span>
          </div>
        )}
      </div>

      {/* Tarjeta de Rol del Cliente / Contexto */}
      {roleData && (
        <div
          id="client-role-banner"
          className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              id="client-avatar"
              className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0"
            >
              {roleData.avatar || '💼'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                  Interlocutor Activo
                </span>
                <span
                  id="client-role-level-badge"
                  className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase border ${
                    activeLevel === 'senior'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : activeLevel === 'mid'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  NIVEL {LEVEL_LABELS[activeLevel]?.toUpperCase() || 'JUNIOR'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Turno {userTurnCount + 1} de 3
                </span>
              </div>
              <h3 id="client-role-name" className="text-base font-bold text-white">
                {roleData.role}
              </h3>
              {roleData.roleDescription && (
                <p id="client-role-description" className="text-xs text-purple-300 font-medium mt-0.5">
                  Rol: {roleData.roleDescription}
                </p>
              )}
              <p id="client-scenario-text" className="text-xs text-slate-400 mt-0.5 max-w-xl">
                {roleData.scenario}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isSpeaking && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hablando...</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Historial de Chat / Sparring Conversacional */}
      {conversation.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Historial de Negociación</span>
            <span>{turnsRemaining > 0 ? `${turnsRemaining} turnos restantes` : 'Fase de veredicto'}</span>
          </div>

          <div
            id="chat-messages-container"
            className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700"
          >
            {conversation.map((msg, idx) => {
              const isAi = msg.speaker === 'ai';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {isAi && (
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm flex-shrink-0">
                      {roleData?.avatar || <Bot className="w-4 h-4 text-purple-400" />}
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isAi
                        ? 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-sm'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                    }`}
                  >
                    <div className="text-[10px] font-mono opacity-60 mb-1">
                      {isAi ? roleData?.role || 'Stakeholder' : 'Tú (Ingeniero)'}
                    </div>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {!isAi && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-sm flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {processingReply && (
              <div className="flex items-center gap-3 text-slate-400 text-xs italic pl-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>El stakeholder está analizando tu postura técnica...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Área de Entrada del Usuario (Micrófono reactivo + Fallback manual) */}
          {sessionActive && !verdictResult && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  <span>Usa el micrófono o redacta en el campo inferior:</span>
                </span>
                {isListening && (
                  <span className="text-emerald-400 font-medium animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Grabando audio... Habla con claridad
                  </span>
                )}
              </div>

              {/* Botón de micrófono y campo de transcripción/texto */}
              <div className="flex items-end gap-3">
                <button
                  id="btn-toggle-mic"
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  disabled={processingReply}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-center flex-shrink-0 shadow-lg ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 text-white animate-pulse shadow-rose-500/30'
                      : 'bg-purple-600 hover:bg-purple-500 border-purple-400 text-white shadow-purple-500/25 active:scale-95'
                  }`}
                  title={isListening ? 'Detener grabación' : 'Iniciar grabación por voz'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <div className="flex-1 relative">
                  <textarea
                    id="user-voice-transcript-input"
                    rows={2}
                    value={textFallbackInput}
                    onChange={(e) => setTextFallbackInput(e.target.value)}
                    placeholder={
                      isListening
                        ? 'Escuchando audio...'
                        : 'Escribe tu argumento de consultoría (ej. ROI, mitigación de riesgos, balance de costos)...'
                    }
                    className="w-full bg-slate-950 text-slate-200 text-sm rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-600 resize-none"
                  />
                  {interimTranscript && (
                    <div className="absolute left-3 bottom-1 text-[11px] text-purple-400 italic pointer-events-none truncate max-w-[90%]">
                      {interimTranscript}
                    </div>
                  )}
                </div>

                <button
                  id="btn-send-reply"
                  onClick={handleSendReply}
                  disabled={processingReply || (!textFallbackInput.trim() && !transcript.trim())}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3.5 rounded-xl transition shadow-lg hover:shadow-indigo-500/25 active:scale-95 flex-shrink-0"
                  title="Enviar respuesta"
                >
                  {processingReply ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              {!voiceSupported && (
                <p className="text-[11px] text-slate-500 italic">
                  * Web Speech API no detectada en este entorno. Puedes interactuar al 100% escribiendo tu defensa en el cuadro de texto.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Panel Final de Veredicto de Consultoría */}
      {verdictResult && (
        <div
          id="soft-skill-verdict-panel"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Veredicto del Evaluador Asertivo</h3>
              </div>
              <p className="text-xs text-slate-400">
                Dictamen integral de negociación, claridad ante stakeholders y defensa técnica
              </p>
            </div>
            <div id="verdict-score-badge">
              {getScoreBadge(verdictResult.score)}
            </div>
          </div>

          {/* Síntesis General */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Retroalimentación General
            </h4>
            <div
              id="verdict-feedback-text"
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-200 text-sm leading-relaxed"
            >
              {verdictResult.feedback}
            </div>
          </div>

          {/* Desglose de las 3 Dimensiones Clave */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Claridad de Negocio */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                Claridad de Negocio
              </span>
              <p id="verdict-business-clarity" className="text-xs text-slate-300 leading-relaxed">
                {verdictResult.businessClarity}
              </p>
            </div>

            {/* Defensa de Trade-Offs */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
                Defensa de Trade-Offs
              </span>
              <p id="verdict-tradeoff-defense" className="text-xs text-slate-300 leading-relaxed">
                {verdictResult.tradeOffDefense}
              </p>
            </div>

            {/* Asertividad */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                Asertividad & Presión
              </span>
              <div className="text-xs text-slate-300">
                Nivel de firmeza:{' '}
                <strong id="verdict-assertiveness-score" className="text-emerald-300 font-mono text-sm">
                  {verdictResult.assertivenessScore ?? 4}/5
                </strong>
              </div>
            </div>
          </div>

          {/* Fortalezas y Omisiones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fortalezas */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
                Fortalezas de Comunicación
              </span>
              {verdictResult.strengths && verdictResult.strengths.length > 0 ? (
                <ul id="verdict-strengths-list" className="space-y-1 text-xs text-slate-300">
                  {verdictResult.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No se destacaron puntos sobresalientes.</p>
              )}
            </div>

            {/* Puntos ciegos */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-2">
                Riesgos u Omisiones
              </span>
              {verdictResult.missingTradeoffs && verdictResult.missingTradeoffs.length > 0 ? (
                <ul id="verdict-missing-tradeoffs-list" className="space-y-1 text-xs text-slate-300">
                  {verdictResult.missingTradeoffs.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">Negociación sin riesgos evidentes.</p>
              )}
            </div>
          </div>

          {/* Próximo repaso SRS */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>
                Próximo Repaso SRS:{' '}
                <strong id="soft-skill-next-review-date" className="text-purple-300 font-mono">
                  {verdictResult.nextReviewAt
                    ? new Date(verdictResult.nextReviewAt).toLocaleDateString('es-ES', {
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
              Etapa SRS: <span className="text-slate-200">{verdictResult.srsStage ?? 1}</span> | Intervalo:{' '}
              <span className="text-slate-200">{verdictResult.intervalDays ?? 1}d</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
