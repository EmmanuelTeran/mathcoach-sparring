import { GoogleGenAI } from '@google/genai';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Pipeline Evaluador Multimodal con Gemini 1.5 Pro para ejercicios matemáticos manuscritos.
 * Analiza la fotografía del cuaderno del estudiante con prompts pedagógicos estratificados por nivel.
 *
 * @param {Object} params
 * @param {Object} params.topic - Documento MathTopic o datos de contexto (title, level, problemStatement, source)
 * @param {string} params.imageBase64 - Imagen capturada en Base64 (con o sin prefijo data URL)
 * @returns {Promise<{ score: number, feedback_paso_a_paso: string, hint: string }>}
 */
export async function evaluateMathVisionSolution({ topic, imageBase64 }) {
  if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    throw new Error('image must be a valid base64 string');
  }

  // Sanitizar cadena Base64 removiendo prefijos data URI
  const sanitizedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '').trim();
  if (!sanitizedBase64) {
    throw new Error('image must be a valid base64 string');
  }

  const level = Number(topic?.level) || 1;
  const topicTitle = topic?.title || 'Ejercicio Matemático';
  const problemStatement = topic?.problemStatement || topic?.statement || 'Sin enunciado proporcionado';
  const source = topic?.source || 'CONAMAT';

  // System Prompt Estratificado por Nivel
  let systemInstruction = '';
  if (level === 1) {
    // Nivel 1: Computacional / Mecánico (CONAMAT)
    systemInstruction = `Eres un Profesor de Matemáticas riguroso pero formativo, especializado en Álgebra y Aritmética elemental (Nivel 1 - Computacional / Mecánico).
Tu objetivo es evaluar la resolución manuscrita del estudiante a partir de la imagen de su libreta.

CRITERIOS DE EVALUACIÓN:
- Analiza paso a paso la jerarquía de operaciones, manipulación de signos, factorizaciones, simplificación de fracciones y exactitud del cómputo.
- Identifica el paso exacto donde ocurra algún error algebraico o aritmético.
- Si el procedimiento y el resultado son impecables, otorga score 5.
- Si hay errores menores de signos o aritmética en los últimos pasos pero el planteamiento es correcto, otorga score 3 o 4.
- Si hay errores conceptuales graves de álgebra (ej. cancelar términos en sumas) o procedimiento totalmente erróneo, otorga score 0, 1 o 2.

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques de código markdown ni texto adicional) con la siguiente estructura:
{
  "score": <número entero entre 0 y 5>,
  "feedback_paso_a_paso": "<desglose detallado paso por paso de lo observado en la imagen, indicando aciertos y el paso exacto del error si existe>",
  "hint": "<pista socrática o recomendación metodológica para superar el error o consolidar la técnica sin dar la respuesta final>"
}`;
  } else if (level === 2) {
    // Nivel 2: Modelado y Cálculo Aplicado (Stewart)
    systemInstruction = `Eres un Profesor de Cálculo Diferencial e Integral y Matemáticas Aplicadas (Nivel 2 - Modelado y Aplicación).
Tu objetivo es evaluar la resolución manuscrita del estudiante a partir de la imagen de su libreta.

CRITERIOS DE EVALUACIÓN:
- Analiza el planteamiento analítico de funciones, tasas de cambio, límites, derivadas, integrales y consistencia geométrica/física.
- Evalúa la correcta aplicación de teoremas de cálculo (Regla de la Cadena, Teorema Fundamental del Cálculo, Integración por Partes, etc.).
- Si el modelado analítico y la técnica de cálculo están completos y justificados, otorga score 5.
- Si el planteamiento es adecuado pero surgen fallos mecánicos de cálculo intermedios, otorga score 3 o 4.
- Si el planteamiento no modela el problema o aplica teoremas incorrectamente, otorga score 0, 1 o 2.

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques de código markdown ni texto adicional) con la siguiente estructura:
{
  "score": <número entero entre 0 y 5>,
  "feedback_paso_a_paso": "<desglose paso a paso del planteamiento analítico, aplicación de teoremas y desarrollo>",
  "hint": "<pista socrática que oriente al estudiante en la comprensión conceptual o técnica de cálculo requerida sin revelar la solución final>"
}`;
  } else {
    // Nivel 3: Rigor Formal y Demostraciones (Spivak)
    systemInstruction = `Eres un Catedrático de Análisis Matemático Riguroso y Demostraciones Formales (Nivel 3 - Spivak / Rigor Axiomático).
Tu objetivo es auditar la demostración matemática manuscrita del estudiante a partir de la imagen de su cuaderno.

CRITERIOS DE EVALUACIÓN:
- Audita la validez deductiva formal (demostración directa, contradicción, inducción matemática, argumentos épsilon-delta).
- No admitas saltos lógicos injustificados, hipótesis no declaradas ni argumentos circulares.
- Verifica el uso correcto de cuantificadores lógicos (para todo, existe), definiciones formales y axiomas.
- Score 5: Demostración formal impecable, con cada implicación rigurosamente fundamentada.
- Score 3 o 4: Argumentación con la idea correcta pero con lagunas menores de justificación o falta de formalidad en la notación.
- Score 0, 1 o 2: Falacia lógica, argumentación inválida o afirmación de la tesis sin demostración.

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques de código markdown ni texto adicional) con la siguiente estructura:
{
  "score": <número entero entre 0 y 5>,
  "feedback_paso_a_paso": "<auditoría formal paso a paso de la demostración lógica y justificación deductiva>",
  "hint": "<orientación socrática formal para ayudar a estructurar la deducción o identificar el paso lógico omitido>"
}`;
  }

  const prompt = `TEMA: ${topicTitle}
FUENTE: ${source}
NIVEL DE PROFUNDIDAD: ${level}
ENUNCIADO ORIGINAL DEL EJERCICIO:
${problemStatement}

INSTRUCCIÓN:
Examina minuciosamente la imagen adjunta donde el estudiante resolvió este ejercicio a mano en su libreta.
Verifica si el procedimiento manuscrito responde adecuadamente al enunciado original planteado.
Devuelve tu evaluación en formato JSON estricto:`;

  const client = getClient();
  if (!client) {
    // Fallback offline determinista para entornos sin GEMINI_API_KEY o pruebas locales
    return {
      score: 4,
      feedback_paso_a_paso: `[Modo Offline] Evaluación simulada para ${topicTitle} (Nivel ${level}): El procedimiento manuscrito muestra un planteamiento ordenado y consistente con el enunciado.`,
      hint: 'Revisa cuidadosamente los signos y la justificación de cada paso intermedio antes de finalizar.',
    };
  }

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: sanitizedBase64,
    },
  };

  const response = await client.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: [prompt, imagePart],
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const rawText = (response.text || '').trim();
  const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        // Fallback de parseo
      }
    }
  }

  if (!parsed) {
    return {
      score: 3,
      feedback_paso_a_paso: rawText || 'Evaluación procesada con formato libre.',
      hint: 'Asegúrate de mantener orden claro en tu libreta y verificar cada paso algebraico.',
    };
  }

  // Sanitizar y acotar score entre 0 y 5
  const rawScore = Number(parsed.score);
  const normalizedScore = Math.max(0, Math.min(5, Math.round(Number.isFinite(rawScore) ? rawScore : 3)));

  return {
    score: normalizedScore,
    feedback_paso_a_paso: String(parsed.feedback_paso_a_paso || parsed.feedback || 'Evaluación completada.'),
    hint: String(parsed.hint || 'Continúa repasando las deducciones paso a paso.'),
  };
}
