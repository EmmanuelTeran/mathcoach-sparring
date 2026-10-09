import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Roles arquetípicos de sparring para consultoría técnica e interacciones de equipo estratificados por nivel
 */
export const SPARRING_ROLES_BY_LEVEL = {
  junior: [
    {
      roleId: "senior_peer_mentor",
      roleName: "Compañero Senior de Equipo",
      roleDescription:
        "Tu compañero Senior en una sesión de 1:1 o revisión de código",
      avatar: "🧑‍💻",
      attitude:
        "Accesible, pedagógico y constructivo, pero exige claridad, que expliques qué investigaste antes de pedir ayuda y que no tomes el feedback de forma personal.",
    },
    {
      roleId: "accessible_scrum_pm",
      roleName: "Scrum Master / PM de Equipo",
      roleDescription: "Scrum Master / PM en el Daily Standup matutino",
      avatar: "📋",
      attitude:
        "Pragmático y empático; necesita una actualización concisa estructurada en qué hiciste, qué harás hoy y qué te bloquea, sin rodeos.",
    },
    {
      roleId: "code_reviewer_peer",
      roleName: "Revisor de Pull Request",
      roleDescription: "Compañero revisando tu Pull Request en GitHub",
      avatar: "🔍",
      attitude:
        "Pregunta con amabilidad por qué elegiste cierta solución y sugiere mejoras de legibilidad y buenas prácticas.",
    },
  ],
  mid: [
    {
      roleId: "pragmatic_tech_lead",
      roleName: "Tech Lead Pragmático",
      roleDescription:
        "Tech Lead priorizando deuda técnica y entregables del sprint",
      avatar: "🛡️",
      attitude:
        "Busca equilibrio entre calidad de código y velocidad de entrega. Pregunta si una refactorización realmente justifica el esfuerzo del sprint.",
    },
    {
      roleId: "tight_deadlines_pm",
      roleName: "Product Manager con Fechas Ajustadas",
      roleDescription:
        "Product Manager negociando alcance para cumplir la fecha de release",
      avatar: "💼",
      attitude:
        "Preocupado por las fechas de lanzamiento, pide negociar el alcance de los tickets para no retrasar el release del cliente.",
    },
    {
      roleId: "qa_lead",
      roleName: "Líder de QA / Calidad",
      roleDescription:
        "Líder de QA revisando cobertura de pruebas y edge cases",
      avatar: "🧪",
      attitude:
        "Exige saber cómo probar los edge cases del ticket y cómo evitar regresiones en staging.",
    },
  ],
  senior: [
    {
      roleId: "skeptical_cto",
      roleName: "CTO Escéptico",
      roleDescription: "CTO de la empresa en revisión de arquitectura y costos",
      avatar: "👔",
      attitude:
        "Exige justificaciones profundas de arquitectura, resiliencia ante caídas masivas y control de costos en infraestructura cloud.",
    },
    {
      roleId: "demanding_enterprise_client",
      roleName: "Director de Negocio / Cliente Corporativo",
      roleDescription: "Director Corporativo evaluando ROI y plazos de entrega",
      avatar: "🏢",
      attitude:
        "Enfocado en ventas y métricas financieras; cuestiona el gasto en infraestructura técnica y exige garantías de SLA.",
    },
    {
      roleId: "security_auditor",
      roleName: "Auditor de Seguridad y Cumplimiento",
      roleDescription:
        "Auditor de Seguridad evaluando riesgos críticos y gobernanza",
      avatar: "🔒",
      attitude:
        "Desconfía de dependencias externas, exige cifrado estricto y planes de mitigación ante desastres.",
    },
  ],
};

// Exportamos también como arreglo aplanado para compatibilidad
export const SPARRING_ROLES = [
  ...SPARRING_ROLES_BY_LEVEL.junior,
  ...SPARRING_ROLES_BY_LEVEL.mid,
  ...SPARRING_ROLES_BY_LEVEL.senior,
];

/**
 * Inicia el escenario de consultoría o interacción de equipo para un topic dado según su nivel.
 *
 * @param {Object} topic - Mongoose topic doc o datos del tema (con title, type, level)
 * @returns {Promise<{ role: string, roleDescription: string, avatar: string, scenario: string, initialQuestion: string }>}
 */
export async function startSoftSkillSparring(topic) {
  const level = topic?.level || "junior";
  const rolesForLevel =
    SPARRING_ROLES_BY_LEVEL[level] || SPARRING_ROLES_BY_LEVEL.junior;
  const selectedRole =
    rolesForLevel[Math.floor(Math.random() * rolesForLevel.length)];

  let systemInstruction = "";

  if (level === "junior") {
    systemInstruction = `Eres un actor de rol simulando a un colega o líder cercano en una interacción cotidiana de equipo de desarrollo de software.
Tu personaje actual: "${selectedRole.roleName}" (${selectedRole.attitude}).
El rol exacto es: "${selectedRole.roleDescription}".
El tema o escenario en discusión es: "${topic.title}".

OBJETIVO:
Plantea una situación cotidiana de equipo de nivel Junior relacionada con "${topic.title}".
Por ejemplo:
- En una Daily Standup: pedir al desarrollador junior un resumen claro de qué hizo, qué hará hoy y qué lo bloquea.
- Al pedir ayuda a un senior: preguntar qué hipótesis investigó o qué error vio antes de trabarse.
- En un Code Review o PR: preguntar con amabilidad por qué implementó esa solución y cómo justificarla.
- En una demo a PM: preguntar qué valor aporta el ticket terminado sin tecnicismos innecesarios.

REGLAS ESTRICTAS:
- Mantén un tono constructivo, accesible y formativo pero que exige orden y claridad.
- NO exijas visión estratégica de negocio, métricas financieras de ROI ni costos masivos de cloud.
- Devuelve la respuesta en formato JSON estricto con:
{
  "scenario": "<breve descripción del contexto cotidiano de equipo>",
  "initialQuestion": "<tu pregunta o planteamiento para abrir la conversación>"
}`;
  } else if (level === "mid") {
    systemInstruction = `Eres un actor de rol simulando a un stakeholder o líder técnico en un sprint de desarrollo.
Tu personaje actual: "${selectedRole.roleName}" (${selectedRole.attitude}).
El rol exacto es: "${selectedRole.roleDescription}".
El tema técnico en discusión es: "${topic.title}".

OBJETIVO:
Plantea una negociación o duda realista de sprint relacionada con "${topic.title}".
Por ejemplo:
- Cuestionar el tiempo estimado de una refactorización frente a entregar features.
- Negociar el alcance de un ticket para cumplir con el deadline.
- Preguntar cómo garantizar que no se rompan contratos existentes o APIs en staging.

REGLAS ESTRICTAS:
- Mantén un tono profesional, pragmático y enfocado en la entrega con calidad y clean code.
- Devuelve la respuesta en formato JSON estricto con:
{
  "scenario": "<breve descripción del contexto del sprint>",
  "initialQuestion": "<tu pregunta o planteamiento desafiante>"
}`;
  } else {
    // Senior
    systemInstruction = `Eres un actor de rol simulando a un stakeholder ejecutivo o cliente corporativo en una consultoría técnica de software.
Tu personaje actual: "${selectedRole.roleName}" (${selectedRole.attitude}).
El rol exacto es: "${selectedRole.roleDescription}".
El tema técnico en discusión es: "${topic.title}".

OBJETIVO:
Plantea un dilema crítico de negocio, arquitectura, costos o resiliencia relacionado con "${topic.title}".
Por ejemplo:
- Exigir una fecha de entrega imposible salteándose pruebas o mitigación de fallos.
- Exigir usar una base de datos o arquitectura inadecuada por ser más barata o "porque la leí en internet".
- Presionar para ignorar la latencia o la consistencia eventual para salir ya a producción.

REGLAS ESTRICTAS:
- Mantén el personaje en todo momento con tono incisivo, escéptico y desafiante de nivel C-Level / Director.
- Devuelve la respuesta en formato JSON estricto con:
{
  "scenario": "<breve descripción del contexto del conflicto>",
  "initialQuestion": "<tu pregunta o reclamo directo y desafiante>"
}`;
  }

  const prompt = `Tema: ${topic.title}
Tipo: ${topic.type}
Nivel: ${level}
Rol asumido: ${selectedRole.roleName} (${selectedRole.roleDescription})

Genera el escenario inicial y tu primera pregunta:`;

  const client = getClient();
  if (!client) {
    if (level === "junior") {
      return {
        role: selectedRole.roleName,
        roleDescription: selectedRole.roleDescription,
        avatar: selectedRole.avatar,
        scenario: `En la interacción cotidiana de equipo sobre "${topic.title}", tu interlocutor necesita claridad sobre tu avance o enfoque.`,
        initialQuestion: `Hola! Respecto a "${topic.title}", ¿podrías darme un resumen claro de tu estado, qué investigaste y en qué punto necesitas alineación o ayuda?`,
      };
    }
    if (level === "mid") {
      return {
        role: selectedRole.roleName,
        roleDescription: selectedRole.roleDescription,
        avatar: selectedRole.avatar,
        scenario: `El equipo está revisando la implementación de "${topic.title}" con plazos ajustados de sprint.`,
        initialQuestion: `Tenemos fechas muy justas para "${topic.title}". ¿Cómo justificas este enfoque técnico y qué garantías tenemos de que no retrasará la entrega?`,
      };
    }
    // Senior fallback
    return {
      role: selectedRole.roleName,
      roleDescription: selectedRole.roleDescription,
      avatar: selectedRole.avatar,
      scenario: `El cliente necesita lanzar la funcionalidad asociada a "${topic.title}" esta misma semana y cuestiona la arquitectura propuesta por considerarla excesivamente cara y lenta de implementar.`,
      initialQuestion: `No entiendo por qué planteas tanta infraestructura para "${topic.title}". ¿Por qué no usamos la solución más barata e inmediata y salimos a producción mañana sin tantas complicaciones?`,
    };
  }

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      role: selectedRole.roleName,
      roleDescription: selectedRole.roleDescription,
      avatar: selectedRole.avatar,
      scenario: parsed.scenario || `Interacción sobre ${topic.title}`,
      initialQuestion:
        parsed.initialQuestion ||
        (level === "junior"
          ? `Hola! Cuéntame cuál es el avance y tus dudas sobre ${topic.title}.`
          : `¿Por qué debemos invertir tanto tiempo y dinero en ${topic.title} cuando podríamos lanzar una solución rápida?`),
    };
  } catch (error) {
    console.error("Error starting soft skill sparring with Gemini:", error);
    return {
      role: selectedRole.roleName,
      roleDescription: selectedRole.roleDescription,
      avatar: selectedRole.avatar,
      scenario: `Revisión técnica de ${topic.title} con ${selectedRole.roleName}.`,
      initialQuestion:
        level === "junior"
          ? `¿Podrías explicarme tu razonamiento para abordar ${topic.title}?`
          : `¿Qué garantías de negocio y estabilidad me das para convencerme de no recortar el alcance de ${topic.title}?`,
    };
  }
}

/**
 * Procesa la respuesta del usuario en el sparring (turno intermedio o veredicto final) adaptado al nivel del tema.
 *
 * @param {Object} params
 * @param {Object} params.topic - Tópico evaluado
 * @param {Array<{ speaker: string, text: string }>} params.conversationHistory - Historial de mensajes
 * @param {string} params.userAudioTranscript - Transcripción del mensaje del usuario
 * @param {string} [params.role] - Rol activo del stakeholder
 * @param {string} [params.roleDescription] - Descripción del rol
 * @returns {Promise<{ isFinalTurn: boolean, reply?: string, role?: string, roleDescription?: string, evaluation?: { score: number, feedback: string, businessClarity: string, tradeOffDefense: string, assertivenessScore: number, missingTradeoffs: string[], strengths: string[] } }>}
 */
export async function replySoftSkillSparring({
  topic,
  conversationHistory = [],
  userAudioTranscript,
  role = "Stakeholder del Cliente",
  roleDescription,
}) {
  const level = topic?.level || "junior";
  const userTurnsCount =
    conversationHistory.filter((m) => m.speaker === "user").length + 1;
  const isFinalTurn = userTurnsCount >= 3;

  const client = getClient();

  if (!isFinalTurn) {
    let systemInstruction = "";
    if (level === "junior") {
      systemInstruction = `Eres un compañero de equipo Senior o Scrum Master accesible pero riguroso ("${role}").
Estás interactuando con un Desarrollador Junior que te explica su avance, duda o decisión sobre "${topic?.title || "la tarea"}".
Tu objetivo es ayudarlo a estructurar su respuesta: pídele que sea específico, pregúntale qué hipótesis probó, o qué pasos seguirá a continuación.
REGLAS:
- Responde en 2 a 3 oraciones concisas y constructivas en primera persona.
- NO exijas métricas financieras de ROI empresarial ni proyecciones de costos cloud de gran escala.
- Pide claridad sobre el 'qué', 'por qué' y 'siguiente paso'.`;
    } else if (level === "mid") {
      systemInstruction = `Eres un Tech Lead pragmático o Product Manager ("${role}") conversando sobre "${topic?.title || "la tarea"}".
Estás dialogando con un Desarrollador Mid-level.
Tu objetivo es cuestionar el balance entre tiempo de desarrollo, calidad de código y cumplimiento del sprint.
REGLAS:
- Responde en 2 a 3 oraciones concisas en primera persona manteniendo tu rol.`;
    } else {
      // Senior
      systemInstruction = `Eres un stakeholder escéptico ("${role}") discutiendo la decisión técnica de "${topic?.title || "Arquitectura"}".
Estás interactuando con un Ingeniero de Software que intenta convencerte.
Tu objetivo es cuestionar su respuesta previa con escepticismo técnico o financiero ("¿Y si falla?", "¿Por qué no otra alternativa más económica?", "¿Cómo justificas los tiempos ante la dirección?").
REGLAS:
- Responde en 2 a 4 oraciones concisas en primera persona manteniendo tu rol.
- Sé incisivo, busca huecos en su razonamiento o presiona sobre los trade-offs que no haya justificado con métricas o impacto de negocio.`;
    }

    const formattedHistory = conversationHistory
      .map((m) => `${m.speaker === "user" ? "Ingeniero" : role}: ${m.text}`)
      .join("\n");

    const prompt = `Nivel de la práctica: ${level}
Historial de la conversación:
${formattedHistory}
Ingeniero (última respuesta por voz): ${userAudioTranscript}

Responde como ${role} con una contrapregunta adecuada al nivel:`;

    if (!client) {
      let reply = "";
      if (level === "junior") {
        reply = `Te escucho, pero cuéntame: ¿qué alternativas probaste antes o cómo planeas verificar que esta solución resuelve el bloqueo sin generar efectos secundarios?`;
      } else if (level === "mid") {
        reply = `Entiendo la justificación técnica, pero el sprint cierra pronto. ¿Cómo podemos acotar el alcance de esta solución para asegurar la entrega sin acumular deuda técnica inmanejable?`;
      } else {
        reply = `Entiendo lo que dices sobre la arquitectura, pero sigues sin aclararme qué pasa si la demanda se triplica el próximo mes. ¿Qué garantías de costo y disponibilidad real me das frente a una solución más simple?`;
      }
      return {
        isFinalTurn: false,
        role,
        roleDescription,
        reply,
      };
    }

    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return {
      isFinalTurn: false,
      role,
      roleDescription,
      reply: (response.text || "").trim(),
    };
  }

  // Turno final (3er turno de usuario): Evaluación formal y veredicto estratificado
  let systemInstruction = "";

  if (level === "junior") {
    systemInstruction = `Eres un Evaluador Pedagógico y Mentor de Ingeniería de Software.
Acabas de presenciar una conversación de interacción cotidiana de equipo entre un Desarrollador Junior y su interlocutor ("${role}") sobre "${topic?.title || "la tarea"}".

EVALÚA AL DESARROLLADOR EN ESTAS 3 DIMENSIONES (ADAPTADAS A NIVEL JUNIOR):
1. Estructura y Claridad (Structure & Clarity): ¿Explicó con orden su situación (qué hizo, por qué o cuál es la duda) de forma clara y sin divagar?
2. Capacidad de Síntesis (Conciseness): ¿Fue al punto sin abrumar con detalles innecesarios y comunicó lo esencial?
3. Proactividad y Disposición al Feedback (Proactivity): ¿Demostró haber investigado o intentado algo previamente y muestra apertura a colaborar?

REGLAS ESTRICTAS:
- NO exijas métricas financieras, ROI empresarial ni visión estratégica de Staff/Principal Engineer.
- Evalúa la claridad comunicativa, el orden y la actitud constructiva de equipo.

CRITERIOS DE SCORE GLOBAL (1 a 5):
- 1: Comunicación desordenada, no sabe explicar qué necesita o actitud defensiva ante el feedback.
- 2: Explicación confusa, no queda claro el bloqueo o no intentó nada antes de pedir ayuda.
- 3: Explicación aceptable y comprensible, pero le faltó un poco de estructura o concreción en los siguientes pasos.
- 4: Buena comunicación: explicó contexto, lo que intentó y formuló su punto o duda con claridad y profesionalismo.
- 5: Excelente para Junior: estructuración impecable (qué, por qué, qué sigue), conciso, proactivo y con actitud colaborativa ejemplar.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO con esta estructura exacta:
{
  "score": <número entero de 1 a 5>,
  "feedback": "<síntesis pedagógica del desempeño comunicativo>",
  "businessClarity": "<evaluación de la claridad y síntesis al comunicar>",
  "tradeOffDefense": "<evaluación de cómo estructuró su razonamiento o dudas>",
  "assertivenessScore": <número entero de 1 a 5>,
  "missingTradeoffs": ["<aspecto de comunicación o contexto que faltó precisar>"],
  "strengths": ["<fortaleza identificada en su comunicación>"]
}`;
  } else if (level === "mid") {
    systemInstruction = `Eres un Evaluador Senior de Habilidades de Comunicación y Negociación Técnica.
Acabas de presenciar un diálogo entre un Ingeniero Mid y su interlocutor ("${role}") sobre "${topic?.title || "la tarea"}".

EVALÚA EN ESTAS 3 DIMENSIONES:
1. Claridad de Alcance y Tiempos: ¿Explicó el impacto en los plazos y el sprint con realismo?
2. Defensa de Deuda Técnica y Calidad: ¿Supo justificar la necesidad de clean code y modularidad sin perder el foco en la entrega?
3. Negociación y Asertividad: ¿Negoció compromisos razonables sin doblegarse ni ser intransigente?

CRITERIOS DE SCORE GLOBAL (1 a 5):
- 1: Se doblegó ante la presión sin justificar o fue confrontativo.
- 2: Explicación poco clara del balance de tiempos y deuda técnica.
- 3: Explicación aceptable pero faltó acotar el alcance o proponer alternativas viables.
- 4: Buena defensa: propuso soluciones intermedias realistas y justificó tiempos.
- 5: Excelente negociación de sprint: comunicación clara, acuerdos pragmáticos y balance óptimo de calidad.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO con la misma estructura exacta.`;
  } else {
    // Senior
    systemInstruction = `Eres un Evaluador Senior de Habilidades de Consultoría Técnica, Comunicación y Liderazgo de Ingeniería.
Acabas de presenciar un sparring de consultoría técnica entre un Ingeniero y un Stakeholder ("${role}") sobre "${topic?.title || "Arquitectura"}".

EVALÚA AL INGENIERO EN ESTAS 3 DIMENSIONES:
1. Claridad de Negocio (Business Clarity): ¿Explicó el impacto en ROI, costos, riesgos o usuarios finales sin caer en jerga incomprensible?
2. Defensa de Trade-Offs (Trade-Off Defense): ¿Justificó con honestidad qué se sacrifica (latencia, costo, tiempo, complejidad) y por qué vale la pena?
3. Asertividad y Manejo de Presión (Assertiveness): ¿Mantuvo la postura técnica con empatía profesional sin someterse a caprichos riesgosos ni ser confrontativo grosero?

CRITERIOS DE SCORE GLOBAL (1 a 5):
- 1: Se doblegó ante el cliente aceptando deuda técnica crítica sin alertar, o fue agresivo/evasivo.
- 2: Explicación puramente técnica abstracta; no conectó con las preocupaciones de negocio del cliente.
- 3: Respuesta decente con argumentos válidos, pero débil en trade-offs o justificación cuantitativa.
- 4: Buena defensa: equilibró necesidades de negocio, explicó riesgos con solvencia y fue asertivo.
- 5: Excelente consultoría Staff/Principal: liderazgo claro, empatía de negocio impecable, trade-offs transparentes y propuesta de solución viable.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO con esta estructura exacta:
{
  "score": <número entero de 1 a 5>,
  "feedback": "<síntesis general del desempeño en consultoría>",
  "businessClarity": "<evaluación específica de cómo tradujo la técnica a valor de negocio>",
  "tradeOffDefense": "<evaluación de la defensa y balance de compromisos técnicos>",
  "assertivenessScore": <número entero de 1 a 5>,
  "missingTradeoffs": ["<tradeoff o riesgo que no mencionó>", "<otro si aplica>"],
  "strengths": ["<punto fuerte de su argumentación>", "<otro si aplica>"]
}`;
  }

  const allHistory = [
    ...conversationHistory,
    { speaker: "user", text: userAudioTranscript },
  ];

  const conversationText = allHistory
    .map((m) => `${m.speaker === "user" ? "Ingeniero" : role}: ${m.text}`)
    .join("\n");

  const prompt = `NIVEL: ${level}
Conversación completa mantenida:
${conversationText}

Emite el veredicto en formato JSON estricto:`;

  if (!client) {
    if (level === "junior") {
      return {
        isFinalTurn: true,
        role,
        roleDescription,
        evaluation: {
          score: 4,
          feedback:
            "Excelente comunicación en la interacción cotidiana de equipo. Estructuraste tu mensaje con orden, claridad y mostraste una actitud proactiva y colaborativa.",
          businessClarity:
            "Mensaje sintetizado y claro, fácil de entender para tu equipo sin rodeos innecesarios.",
          tradeOffDefense:
            "Explicaste adecuadamente el contexto y tus dudas demostrando análisis previo.",
          assertivenessScore: 4,
          missingTradeoffs: [
            "Podrías anticipar el siguiente paso concreto al terminar tu intervención.",
          ],
          strengths: [
            "Actitud colaborativa y orden al comunicar el estado de tu tarea.",
          ],
        },
      };
    }
    if (level === "mid") {
      return {
        isFinalTurn: true,
        role,
        roleDescription,
        evaluation: {
          score: 4,
          feedback:
            "Buena negociación de sprint. Equilibraste la necesidad de mantener el código limpio con los compromisos de entrega del equipo.",
          businessClarity:
            "Explicación realista del tiempo requerido y el impacto en el sprint.",
          tradeOffDefense:
            "Defendiste adecuadamente el balance entre refactorización y avance de features.",
          assertivenessScore: 4,
          missingTradeoffs: [
            "Se pudo proponer una fase 2 para la refactorización más compleja.",
          ],
          strengths: ["Negociación constructiva y enfoque pragmático."],
        },
      };
    }
    // Senior fallback
    return {
      isFinalTurn: true,
      role,
      roleDescription,
      evaluation: {
        score: 4,
        feedback:
          "Defendiste la posición técnica con calma y asertividad. Tradujiste conceptos complejos en beneficios claros de estabilidad y control de costos para el cliente.",
        businessClarity:
          "Excelente traducción de métricas técnicas a impacto directo en el negocio.",
        tradeOffDefense:
          "Se argumentó correctamente la relación entre tiempo de desarrollo y resiliencia.",
        assertivenessScore: 4,
        missingTradeoffs: [
          "No se cuantificó el impacto exacto en dólares o SLAs",
        ],
        strengths: [
          "Firmeza ante la presión de fechas sin ser confrontativo",
          "Lenguaje comprensible",
        ],
      },
    };
  }

  const response = await client.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const text = (response.text || "").trim();

  try {
    const parsed = JSON.parse(text);
    return {
      isFinalTurn: true,
      role,
      roleDescription,
      evaluation: {
        score: Math.max(1, Math.min(5, Math.round(Number(parsed.score) || 3))),
        feedback: String(
          parsed.feedback || "Evaluación de sparring completada.",
        ),
        businessClarity: String(
          parsed.businessClarity || "Nivel de claridad adecuado.",
        ),
        tradeOffDefense: String(
          parsed.tradeOffDefense || "Defensa de compromisos evaluada.",
        ),
        assertivenessScore: Math.max(
          1,
          Math.min(5, Math.round(Number(parsed.assertivenessScore) || 3)),
        ),
        missingTradeoffs: Array.isArray(parsed.missingTradeoffs)
          ? parsed.missingTradeoffs
          : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      },
    };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          isFinalTurn: true,
          role,
          roleDescription,
          evaluation: {
            score: Math.max(
              1,
              Math.min(5, Math.round(Number(parsed.score) || 3)),
            ),
            feedback: String(
              parsed.feedback || "Evaluación de sparring completada.",
            ),
            businessClarity: String(
              parsed.businessClarity || "Nivel de claridad adecuado.",
            ),
            tradeOffDefense: String(
              parsed.tradeOffDefense || "Defensa de compromisos evaluada.",
            ),
            assertivenessScore: Math.max(
              1,
              Math.min(5, Math.round(Number(parsed.assertivenessScore) || 3)),
            ),
            missingTradeoffs: Array.isArray(parsed.missingTradeoffs)
              ? parsed.missingTradeoffs
              : [],
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          },
        };
      } catch {
        // Fallback
      }
    }

    return {
      isFinalTurn: true,
      role,
      roleDescription,
      evaluation: {
        score: 3,
        feedback: text || "Veredicto generado.",
        businessClarity: "Comunicación funcional con áreas de oportunidad.",
        tradeOffDefense: "Mención de compromisos aceptable.",
        assertivenessScore: 3,
        missingTradeoffs: [],
        strengths: [],
      },
    };
  }
}
