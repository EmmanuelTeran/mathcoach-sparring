import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Genera un desafío técnico de active recall según el tema, su tipo y su nivel de progresión.
 *
 * @param {Object} topic
 * @param {string} topic.title - Nombre del tema (ej. 'Node.js Event Loop', 'React Re-renders')
 * @param {string} topic.type - 'theory' o 'practice'
 * @param {string} [topic.level='junior'] - 'junior' | 'mid' | 'senior'
 * @param {string} [topic.category='hard_skill']
 * @returns {Promise<string>} Texto del desafío técnico
 */
export async function generateHardSkillChallenge(topic) {
  const isTheory = topic.type === 'theory';
  const level = topic.level || 'junior';

  let systemInstruction = '';

  if (level === 'junior') {
    systemInstruction = isTheory
      ? `Eres un Tech Lead pedagógico y mentor de ingeniería evaluando a un desarrollador Fullstack Junior.
Tu objetivo es formular un reto de Active Recall conceptual accesible sobre "${topic.title}".
REGLAS ESTRICTAS:
- Enfócate en bases cotidianas, sintaxis, inmutabilidad, depuración de errores comunes y cómo se usa en el trabajo diario.
- NO hagas preguntas sobre bajo nivel, internals de V8, libuv, concurrencia masiva ni optimizaciones prematuras complejas.
- Plantea una pregunta clara sobre el comportamiento de la sintaxis/concepto, por qué se usa y qué error común previene.
- Sé conciso, directo y pedagógico (máximo 2 párrafos).`
      : `Eres un Tech Lead pedagógico y mentor de ingeniería evaluando a un desarrollador Fullstack Junior.
Tu objetivo es plantear un escenario práctico cotidiano y formativo sobre "${topic.title}".
REGLAS ESTRICTAS:
- Enfócate en sintaxis limpia, inmutabilidad, manejo de datos y lógica funcional básica.
- NO plantees problemas de concurrencia masiva, internals de Node/Mongo ni optimizaciones de bajo nivel.
- Plantea un caso de uso común (ej. transformar un array, manejar estado sin mutar, crear una ruta o controlador básico).
- Exige que el candidato escriba o explique la solución con código limpio y legible.
- Sé claro, específico y pedagógico (máximo 2 párrafos).`;
  } else if (level === 'mid') {
    systemInstruction = isTheory
      ? `Eres un Senior Software Engineer evaluando a un desarrollador Fullstack Mid-level.
Tu objetivo es formular un reto de Active Recall sobre patrones, modularización y clean code en "${topic.title}".
REGLAS ESTRICTAS:
- Formula una pregunta sobre modularidad, separación de responsabilidades, ciclo de vida o manejo de asincronía.
- Pide comparar enfoques alternativos comunes o explicar cómo evitar el acoplamiento.
- Sé conciso y profesional (máximo 2 párrafos).`
      : `Eres un Senior Software Engineer evaluando a un desarrollador Fullstack Mid-level.
Tu objetivo es plantear un escenario de refactorización o diseño modular sobre "${topic.title}".
REGLAS ESTRICTAS:
- Plantea un escenario de aplicación real: modularizar un hook/servicio, manejo robusto de errores o diseño de interfaces limpias.
- Exige clean code, modularidad y consideraciones de mantenibilidad.
- Sé directo y profesional (máximo 2 párrafos).`;
  } else {
    // Senior
    systemInstruction = isTheory
      ? `Eres un Staff Software Engineer y entrevistador técnico implacable para roles Fullstack Senior.
Tu objetivo es formular un reto de Active Recall conceptual profundo sobre "${topic.title}".
REGLAS ESTRICTAS:
- NO hagas preguntas de memoria básica, definiciones de diccionario ni sintaxis trivial.
- Formula una pregunta incisiva sobre arquitectura interna, protocolos, concurrencia, gestión de memoria, orden de fases de ejecución o análisis crítico de trade-offs.
- Plantea un dilema técnico que obligue al candidato a justificar el "por qué" y explicar qué sucede bajo el capó.
- Sé conciso, directo y desafiante (máximo 2 párrafos).`
      : `Eres un Staff Software Engineer y entrevistador técnico implacable para roles Fullstack Senior.
Tu objetivo es plantear un escenario de ingeniería realista y desafiante sobre "${topic.title}".
REGLAS ESTRICTAS:
- NO plantees un ejercicio de algoritmos de juguete ni sintaxis de tutorial.
- Plantea un escenario real de producción: cuello de botella de rendimiento, diseño de arquitectura de componentes React, optimización de queries/índices en MongoDB, o gestión de flujos asíncronos y backpressure en Node.js.
- Exige que el candidato plantee o escriba la solución técnica explicando sus trade-offs (latencia vs memoria, legibilidad vs complejidad, consistencia vs disponibilidad).
- Sé directo, específico y desafiante (máximo 2 o 3 párrafos).`;
  }

  const prompt = `Tema: ${topic.title}
Tipo: ${topic.type}
Nivel: ${level}
Genera el desafío técnico ahora:`;

  const client = getClient();
  if (!client) {
    // Modo offline / fallback determinista en ausencia de API Key estratificado por nivel
    if (level === 'junior') {
      return isTheory
        ? `[Desafío Teórico Junior - ${topic.title}]: Explica cómo funciona "${topic.title}", para qué se utiliza en el desarrollo diario y cuál es un error común que cometen los desarrolladores al usarlo. Da un ejemplo conceptual claro.`
        : `[Desafío Práctico Junior - ${topic.title}]: Escribe una solución clara y funcional para un caso de uso común de "${topic.title}". Asegúrate de manejar la sintaxis correctamente y evitar mutaciones directas.`;
    }
    if (level === 'mid') {
      return isTheory
        ? `[Desafío Teórico Mid - ${topic.title}]: Analiza las ventajas y desventajas de los patrones más comunes asociados a "${topic.title}". ¿Cómo impacta en la modularidad y mantenibilidad del código?`
        : `[Desafío Práctico Mid - ${topic.title}]: Diseña una implementación modular y robusta de "${topic.title}" que maneje errores adecuadamente y aplique buenas prácticas de clean code.`;
    }
    // Senior fallback
    return isTheory
      ? `[Desafío Teórico - ${topic.title}]: Explica detalladamente los trade-offs de arquitectura interna, concurrencia y comportamiento bajo alta carga asociados a "${topic.title}". ¿Qué sucede bajo el capó y qué consecuencias tiene en producción tomar la decisión equivocada? Justifica tu razonamiento.`
      : `[Desafío Práctico - ${topic.title}]: En un sistema con alto tráfico que experimenta degradación de rendimiento y consumo excesivo de recursos con "${topic.title}", ¿cómo diseñarías o refactorizarías la solución para resolver el cuello de botella? Especifica código o arquitectura y analiza los trade-offs involucrados.`;
  }

  const response = await client.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.4,
    },
  });

  return (response.text || '').trim();
}

/**
 * Evalúa la solución técnica del usuario con criterio estratificado por nivel de progresión.
 *
 * @param {Object} params
 * @param {Object} params.topic - Objeto del tópico
 * @param {string} params.challenge - Texto del desafío presentado
 * @param {string} params.userSolution - Respuesta o código redactado por el usuario
 * @returns {Promise<{ score: number, feedback: string, missingTradeoffs: string[], strengths: string[] }>}
 */
export async function evaluateHardSkillSolution({ topic, challenge, userSolution }) {
  if (!userSolution || !userSolution.trim()) {
    return {
      score: 1,
      feedback: 'No se proporcionó ninguna solución técnica para evaluar.',
      missingTradeoffs: ['No se presentó análisis ni justificación técnica.'],
      strengths: [],
    };
  }

  const level = topic?.level || 'junior';

  let systemInstruction = '';

  if (level === 'junior') {
    systemInstruction = `Eres un Mentor Técnico y Tech Lead evaluando a un desarrollador Fullstack Junior.
Tu tono es constructivo, formativo, riguroso pero accesible y sin condescendencia.

CRITERIOS DE CALIFICACIÓN (Escala 1 a 5) PARA NIVEL JUNIOR:
- Score 1: Respuesta incorrecta, errores graves de sintaxis o confusión básica de conceptos.
- Score 2: Respuesta incompleta, muta el estado indebidamente o contiene errores lógicos notables en la funcionalidad básica.
- Score 3: Respuesta funcional correcta básica con sintaxis adecuada, aunque omita buenas prácticas menores o casos de borde sencillos.
- Score 4: Respuesta sólida: código limpio o explicación clara, respetando inmutabilidad, convenciones y lógica cotidiana.
- Score 5: Respuesta sobresaliente para nivel Junior: código funcional impecable, explicación concisa y clara, sin errores y sin sobreingeniería.

REGLAS CRÍTICAS DE EVALUACIÓN:
- NO penalices por falta de análisis de arquitectura interna de bajo nivel, internals de V8, libuv ni trade-offs de escalabilidad masiva.
- Evalúa la corrección funcional, sintaxis, legibilidad, inmutabilidad y buenas prácticas cotidianas.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques de markdown adicionales ni texto previo o posterior) con la siguiente estructura exacta:
{
  "score": <número entero entre 1 y 5>,
  "feedback": "<análisis técnico directo y formativo explicando aciertos y oportunidades>",
  "missingTradeoffs": ["<buena práctica o caso de borde no considerado>", "<otro si aplica>"],
  "strengths": ["<fortaleza de sintaxis o lógica identificada>", "<otra si aplica>"]
}`;
  } else if (level === 'mid') {
    systemInstruction = `Eres un Senior Software Engineer evaluando a un aspirante Fullstack Mid-level.
Tu tono es técnico, profesional y enfocado en clean code, modularización y robustez.

CRITERIOS DE CALIFICACIÓN (Escala 1 a 5) PARA NIVEL MID:
- Score 1: Código acoplado, mala gestión de errores o conceptos confusos.
- Score 2: Funciona parcialmente pero tiene deuda técnica evidente, efectos secundarios o mal manejo de asincronía.
- Score 3: Solución funcional correcta con modularidad básica, pero falta robustez o manejo defensivo de errores.
- Score 4: Solución sólida, modular, clean code, manejo correcto de asincronía y contratos de API.
- Score 5: Excelente diseño modular, patrones limpios, desacoplamiento y consideraciones de mantenibilidad.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques de markdown adicionales) con la siguiente estructura exacta:
{
  "score": <número entero entre 1 y 5>,
  "feedback": "<análisis técnico directo y conciso>",
  "missingTradeoffs": ["<aspecto de modularidad o caso de borde>", "<otro si aplica>"],
  "strengths": ["<fortaleza técnica destacable>", "<otra si aplica>"]
}`;
  } else {
    // Senior
    systemInstruction = `Eres un Evaluador Técnico Principal / Staff Engineer evaluando a un aspirante Fullstack Senior.
Tu tono es directo, profesional, riguroso y sin condescendencia.

CRITERIOS DE CALIFICACIÓN (Escala 1 a 5):
- Score 1: Respuesta incorrecta, superficial, confunde conceptos clave o evasiva.
- Score 2: Respuesta con noción vaga pero plagada de imprecisiones técnicas graves o falta total de fundamentación interna.
- Score 3: Respuesta funcional correcta básica, pero sin análisis de trade-offs, sin contemplar casos de borde ni cómo escala.
- Score 4: Respuesta sólida, demuestra entendimiento profundo de la arquitectura interna y menciona trade-offs esenciales con claridad.
- Score 5: Respuesta sobresaliente de nivel Staff/Principal Engineer: justificación precisa del "por qué", análisis cuantitativo/cualitativo de trade-offs, impacto en producción y claridad ejemplar.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques de markdown adicionales ni texto previo o posterior) con la siguiente estructura exacta:
{
  "score": <número entero entre 1 y 5>,
  "feedback": "<análisis técnico directo y conciso explicando aciertos y debilidades>",
  "missingTradeoffs": ["<tradeoff o punto ciego no considerado>", "<otro si aplica>"],
  "strengths": ["<fortaleza técnica destacable identificada>", "<otra si aplica>"]
}`;
  }

  const prompt = `TEMA: ${topic?.title || 'General'}
TIPO: ${topic?.type || 'practice'}
NIVEL: ${level}
DESAFÍO PLANTEADO:
${challenge}

SOLUCIÓN PROPUESTA POR EL CANDIDATO:
${userSolution}

Evalúa la respuesta y devuelve el JSON estricto:`;

  const client = getClient();
  if (!client) {
    // Fallback heurístico offline para entornos sin GEMINI_API_KEY
    const wordCount = userSolution.trim().split(/\s+/).length;

    if (level === 'junior') {
      let score = 3;
      if (wordCount < 8) {
        score = 2;
      } else if (wordCount >= 20) {
        score = 4;
      }
      return {
        score,
        feedback: score >= 4
          ? 'Solución funcional clara que demuestra comprensión de las bases y sintaxis correcta.'
          : 'Respuesta básica adecuada, aunque puedes detallar más el manejo de casos comunes.',
        missingTradeoffs: score < 4 ? ['Considerar casos de borde cotidianos o validación básica'] : [],
        strengths: ['Sintaxis legible y solución directa sin sobreingeniería'],
      };
    }

    if (level === 'mid') {
      const hasModularPatterns = /modular|patrón|hook|servicio|limpio|clean|async|error|mantenib/i.test(userSolution);
      let score = 3;
      if (wordCount < 10) score = 2;
      else if (hasModularPatterns && wordCount >= 30) score = 4;
      return {
        score,
        feedback: hasModularPatterns
          ? 'Solución modular que aplica buenas prácticas de clean code y desacoplamiento.'
          : 'Respuesta funcionalmente correcta pero podría modularizarse mejor y pulir el manejo defensivo.',
        missingTradeoffs: hasModularPatterns ? [] : ['Modularización y manejo defensivo de errores'],
        strengths: ['Comprensión adecuada de la arquitectura del componente/servicio'],
      };
    }

    // Senior offline fallback
    const hasTradeoffs = /trade-off|tradeoff|desventaja|ventaja|latencia|memoria|rendimiento|concurrencia|escalab/i.test(userSolution);

    let score = 3;
    if (wordCount < 15) {
      score = 2;
    } else if (hasTradeoffs && wordCount > 40) {
      score = 4;
    }

    return {
      score,
      feedback: hasTradeoffs
        ? 'Respuesta estructurada que identifica trade-offs clave de la solución propuesta.'
        : 'Solución comprensible pero carece de un análisis profundo de trade-offs e impacto en producción.',
      missingTradeoffs: hasTradeoffs ? [] : ['Análisis de degradación bajo alta carga o límites de memoria'],
      strengths: ['Comprensión inicial de la problemática planteada'],
    };
  }

  const response = await client.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const text = (response.text || '').trim();

  try {
    const parsed = JSON.parse(text);
    return {
      score: Math.max(1, Math.min(5, Math.round(Number(parsed.score) || 3))),
      feedback: String(parsed.feedback || 'Evaluación completada.'),
      missingTradeoffs: Array.isArray(parsed.missingTradeoffs) ? parsed.missingTradeoffs : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    };
  } catch {
    // Si la respuesta no es JSON válido directamente, extraer bloque JSON si viene envuelto
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          score: Math.max(1, Math.min(5, Math.round(Number(parsed.score) || 3))),
          feedback: String(parsed.feedback || 'Evaluación completada.'),
          missingTradeoffs: Array.isArray(parsed.missingTradeoffs) ? parsed.missingTradeoffs : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        };
      } catch {
        // Fallback si falló el parseo
      }
    }

    return {
      score: 3,
      feedback: text || 'Evaluación procesada con formato libre.',
      missingTradeoffs: ['Formato de salida no estructurado'],
      strengths: [],
    };
  }
}

/**
 * Genera una pista pedagógica (Socratic hint) para el usuario.
 * NUNCA revela código directo ni la respuesta. Solo usa analogías y preguntas guía.
 *
 * @param {Object} params
 * @param {Object} params.topic - Objeto del tópico (con title, level)
 * @param {string} params.challenge - Texto del desafío presentado al usuario
 * @returns {Promise<{ analogy: string, guidingQuestions: string[] }>}
 */
export async function generateHint({ topic, challenge }) {
  const levelLabel = topic.level === 'senior' ? 'Senior' : topic.level === 'mid' ? 'Mid-level' : 'Junior';

  const systemInstruction = `Eres un tutor técnico socrático especializado en preparación para entrevistas de ingeniería de software Fullstack.
Tu misión es guiar al candidato de nivel ${levelLabel} sin revelar la respuesta directa ni escribir código funcional.

REGLAS ESTRICTAS:
- NO escribas código funcional, pseudocódigo detallado ni soluciones directas.
- NO respondas la pregunta del desafío directamente.
- Usa UNA analogía del mundo real que conecte el concepto con algo cotidiano.
- Formula entre 2 y 3 preguntas guía que lleven al candidato a descubrir la respuesta por sí mismo.
- El tono debe ser de tutor que acompaña, no de evaluador que juzga.

RESPONDE EXCLUSIVAMENTE con un JSON válido (sin markdown):
{
  "analogy": "<analogía del mundo real clara y memorable>",
  "guidingQuestions": ["<pregunta 1>", "<pregunta 2>", "<pregunta 3 opcional>"]
}`;

  const prompt = `TEMA: ${topic.title}
NIVEL: ${levelLabel}
DESAFÍO AL CANDIDATO:
${challenge}

Genera la pista pedagógica ahora:`;

  const client = getClient();
  if (!client) {
    // Fallback offline: pistas deterministas genéricas por nivel
    const analogies = {
      junior: `Imagina que ${topic.title} es como organizar una cocina: tienes que saber dónde va cada cosa antes de empezar a cocinar.`,
      mid: `Piensa en ${topic.title} como el sistema de tuberías de un edificio: entender el flujo completo te evita problemas cuando hay una fuga.`,
      senior: `${topic.title} es análogo a diseñar una red de distribución eléctrica: las decisiones de arquitectura afectan la resiliencia y el costo de toda la red.`,
    };
    return {
      analogy: analogies[topic.level] || analogies.junior,
      guidingQuestions: [
        `¿Cuál es el comportamiento fundamental de "${topic.title}" cuando el sistema está bajo presión?`,
        `¿Qué trade-off tendrías que aceptar si optimizas para velocidad en lugar de consistencia aquí?`,
        `¿Cómo cambia tu respuesta si el sistema necesita escalar a 10x el tráfico actual?`,
      ],
    };
  }

  const response = await client.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.5,
      responseMimeType: 'application/json',
    },
  });

  const text = (response.text || '').trim();

  try {
    const parsed = JSON.parse(text);
    return {
      analogy: String(parsed.analogy || ''),
      guidingQuestions: Array.isArray(parsed.guidingQuestions) ? parsed.guidingQuestions : [],
    };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          analogy: String(parsed.analogy || ''),
          guidingQuestions: Array.isArray(parsed.guidingQuestions) ? parsed.guidingQuestions : [],
        };
      } catch {
        // ignore
      }
    }
    return {
      analogy: `Reflexiona sobre los fundamentos de "${topic.title}" y cómo se comporta bajo distintas condiciones de carga.`,
      guidingQuestions: [
        '¿Cuál es el comportamiento por defecto y cuándo cambia?',
        '¿Qué trade-offs implica la decisión de diseño más común en este tema?',
      ],
    };
  }
}

/**
 * Evalúa la solución de código del usuario en el Coding Playground usando Gemini.
 * Se invoca solo si todos los tests automatizados pasaron.
 *
 * @param {Object} params
 * @param {Object} params.topic - Objeto del tópico
 * @param {string} params.code - Código implementado por el usuario
 * @param {Object} params.testResults - Resultados de la ejecución de tests
 * @returns {Promise<{ score: number, feedback: string, complexity: { time: string, space: string }, readability: string, naming: string, strengths: string[], improvements: string[] }>}
 */
export async function evaluateCodingSolution({ topic, code, testResults }) {
  const level = topic?.level || 'junior';
  const challenge = topic?.codingChallenge || {};

  let systemInstruction = '';
  if (level === 'junior') {
    systemInstruction = `Eres un Evaluador de Código y Tech Lead pedagógico evaluando a un desarrollador Fullstack Junior.
Tu objetivo es auditar la solución de un reto de programación que YA PASÓ TODOS LOS TEST CASES AUTOMATIZADOS.

CRITERIOS DE EVALUACIÓN JUNIOR:
- Prioriza corrección, legibilidad y nombres descriptivos de variables y funciones.
- REGLAS ESTRICTAS: La complejidad Big-O se reporta de forma informativa y NO penaliza la nota. Prohibido exigir internals de V8, concurrencia o arquitectura avanzada.
- Califica de 1 a 5 según la claridad de la implementación.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin markdown) con esta estructura exacta:
{
  "score": <número entero 1-5>,
  "feedback": "<análisis técnico conciso>",
  "complexity": { "time": "<Big-O tiempo>", "space": "<Big-O espacio>" },
  "readability": "<comentario sobre legibilidad>",
  "naming": "<comentario sobre nombres>",
  "strengths": ["<fortaleza 1>"],
  "improvements": ["<mejora 1>"]
}`;
  } else if (level === 'mid') {
    systemInstruction = `Eres un Evaluador de Código y Senior Software Engineer evaluando a un desarrollador Mid-level.
Tu objetivo es auditar la solución de un reto de programación que YA PASÓ TODOS LOS TEST CASES AUTOMATIZADOS.

CRITERIOS DE EVALUACIÓN MID:
- Prioriza legibilidad, modularidad, funciones puras y no mutación de entradas.
- Complejidad Big-O subóptima resta máximo 1 punto.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin markdown) con esta estructura exacta:
{
  "score": <número entero 1-5>,
  "feedback": "<análisis técnico conciso>",
  "complexity": { "time": "<Big-O tiempo>", "space": "<Big-O espacio>" },
  "readability": "<comentario sobre legibilidad>",
  "naming": "<comentario sobre nombres>",
  "strengths": ["<fortaleza 1>"],
  "improvements": ["<mejora 1>"]
}`;
  } else {
    systemInstruction = `Eres un Evaluador de Código y Staff Software Engineer evaluando a un desarrollador Senior.
Tu objetivo es auditar la solución de un reto de programación que YA PASÓ TODOS LOS TEST CASES AUTOMATIZADOS.

CRITERIOS DE EVALUACIÓN SENIOR:
- Se requiere complejidad Big-O óptima en tiempo y espacio para obtener un score 5.
- Evalúa rigurosamente análisis espacio/tiempo, edge cases y robustez.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin markdown) con esta estructura exacta:
{
  "score": <número entero 1-5>,
  "feedback": "<análisis técnico conciso>",
  "complexity": { "time": "<Big-O tiempo>", "space": "<Big-O espacio>" },
  "readability": "<comentario sobre legibilidad>",
  "naming": "<comentario sobre nombres>",
  "strengths": ["<fortaleza 1>"],
  "improvements": ["<mejora 1>"]
}`;
  }

  const constraintsText = Array.isArray(challenge.constraints) && challenge.constraints.length > 0
    ? challenge.constraints.map((c) => `- ${c}`).join('\n')
    : 'Ninguna';

  const prompt = `TEMA: ${topic?.title || 'Reto de Código'}
NIVEL: ${level}
ENUNCIADO: ${challenge.description || ''}
RESTRICCIONES:
${constraintsText}

RESULTADOS: ${testResults?.passedCount || 0}/${testResults?.totalCount || 0} tests, ${testResults?.executionTimeMs || 0} ms

CÓDIGO:
${code}`;

  const client = getClient();
  if (!client) {
    return {
      score: 4,
      feedback: 'Todos los tests pasaron. Auditoría IA no disponible (modo offline).',
      complexity: { time: 'No determinado (offline)', space: 'No determinado (offline)' },
      readability: '',
      naming: '',
      strengths: ['Solución funcional que supera todos los test cases'],
      improvements: [],
    };
  }

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const text = (response.text || '').trim();
    const cleanText = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanText);

    return {
      score: Math.max(1, Math.min(5, Math.round(Number(parsed.score) || 3))),
      feedback: String(parsed.feedback || 'Solución evaluada correctamente.'),
      complexity: {
        time: String(parsed.complexity?.time || 'No determinado'),
        space: String(parsed.complexity?.space || 'No determinado'),
      },
      readability: String(parsed.readability || ''),
      naming: String(parsed.naming || ''),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
    };
  } catch (err) {
    return {
      score: 4,
      feedback: 'Todos los tests pasaron. Error procesando auditoría IA.',
      complexity: { time: 'No determinado', space: 'No determinado' },
      readability: '',
      naming: '',
      strengths: ['Solución funcional que supera todos los test cases'],
      improvements: [],
    };
  }
}

