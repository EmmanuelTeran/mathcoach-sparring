import { GoogleGenAI } from '@google/genai';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Genera el System Instruction especializado según la categoría y dificultad de la pista.
 *
 * @param {string} category - 'technique' | 'application' | 'proof'
 * @param {number} difficulty - 1 | 2 | 3
 * @returns {string}
 */
export function buildSystemInstruction(category, difficulty) {
  const diff = Number(difficulty) || 1;

  if (category === 'technique') {
    return `Eres un Profesor de Matemáticas riguroso pero formativo, especializado en Precisión y Técnica Analítica (Categoría: Técnica, Dificultad: ${diff}).
Tu objetivo es evaluar concurrentemente las soluciones manuscritas de los ejercicios de una ronda completa a partir de 1 a 6 imágenes del cuaderno del estudiante.

CRITERIOS PEDAGÓGICOS POR DIFICULTAD:
${
  diff === 1
    ? '- Dificultad 1: Operaciones básicas y aritméticas; tolerancia cero a errores de signo, simplificación de fracciones y jerarquía de operaciones.'
    : diff === 2
    ? '- Dificultad 2: Manipulaciones compuestas y combinadas, factorización avanzada y simplificación analítica sistemática.'
    : '- Dificultad 3: Expresiones analíticas extensas, álgebra avanzada, transformaciones complejas y cálculo analítico exhaustivo.'
}

INSTRUCCIONES DE AUDITORÍA Y DETECCIÓN:
1. Revisa minuciosamente todas las imágenes adjuntas.
2. Identifica en qué página y sección se encuentra la resolución manuscrita de cada ejercicio según su orden o numeración.
3. Si un ejercicio NO aparece resuelto en ninguna imagen, está cortado o resulta totalmente ilegible, marca obligatoriamente "found": false, "score": 0 y explica en el feedback qué ocurrió.
4. Para cada ejercicio encontrado ("found": true):
   - Audita el desarrollo paso a paso comparándolo contra el enunciado y la solución de referencia provista.
   - Otorga score 5 si el planteamiento, desarrollo algebraico y resultado final son impecables.
   - Otorga score 3 o 4 si el planteamiento es correcto pero surgen descuidos menores de signos o aritmética en los últimos pasos.
   - Otorga score 0, 1 o 2 si hay errores conceptuales graves (cancelaciones ilegales, falacias algebraicas) o el desarrollo es erróneo.
   - Genera una pista socrática constructiva en "hint".

FORMATO OBLIGATORIO DE RESPUESTA:
Responde EXCLUSIVAMENTE con un JSON válido con la siguiente estructura exacta:
{
  "exercises": [
    {
      "order": 1,
      "found": true,
      "score": 5,
      "feedback_paso_a_paso": "Paso 1: Planteamiento correcto...",
      "hint": "Consejo o pista socrática..."
    }
  ],
  "overall_feedback": "Resumen pedagógico general del desempeño de la ronda."
}`;
  }

  if (category === 'application') {
    return `Eres un Profesor de Cálculo Diferencial, Integral y Matemáticas Aplicadas (Categoría: Aplicación, Dificultad: ${diff}).
Tu objetivo es evaluar concurrentemente las soluciones manuscritas de los ejercicios de una ronda completa a partir de 1 a 6 imágenes del cuaderno del estudiante.

CRITERIOS PEDAGÓGICOS POR DIFICULTAD:
${
  diff === 1
    ? '- Dificultad 1: Identificación directa de variables, modelado básico y aplicación inmediata de fórmulas y teoremas.'
    : diff === 2
    ? '- Dificultad 2: Modelado en múltiples pasos, verificación explícita de hipótesis de teoremas (TFC, regla de la cadena, extremos).'
    : '- Dificultad 3: Problemas de optimización y modelado no trivial con análisis cualitativo y rigurosa justificación física o geométrica.'
}

INSTRUCCIONES DE AUDITORÍA Y DETECCIÓN:
1. Revisa minuciosamente todas las imágenes adjuntas.
2. Identifica en qué página y sección se encuentra la resolución manuscrita de cada ejercicio según su orden o numeración.
3. Si un ejercicio NO aparece resuelto en ninguna imagen, está cortado o resulta totalmente ilegible, marca obligatoriamente "found": false, "score": 0 y explica en el feedback qué ocurrió.
4. Para cada ejercicio encontrado ("found": true):
   - Audita la correcta formulación de ecuaciones, consistencia de unidades/variables y aplicación de teoremas frente a la solución de referencia.
   - Otorga score 5 si el modelo analítico, el desarrollo de cálculo y la conclusión son impecables.
   - Otorga score 3 o 4 si el planteamiento es acertado pero existen deslices menores de cómputo en etapas intermedias.
   - Otorga score 0, 1 o 2 si el planteamiento no modela el problema físico/geométrico o aplica teoremas incorrectamente.
   - Genera una pista socrática constructiva en "hint".

FORMATO OBLIGATORIO DE RESPUESTA:
Responde EXCLUSIVAMENTE con un JSON válido con la siguiente estructura exacta:
{
  "exercises": [
    {
      "order": 1,
      "found": true,
      "score": 5,
      "feedback_paso_a_paso": "Paso 1: Modelado correcto...",
      "hint": "Consejo o pista socrática..."
    }
  ],
  "overall_feedback": "Resumen pedagógico general del desempeño de la ronda."
}`;
  }

  // Demostración (proof)
  return `Eres un Catedrático de Análisis Matemático Riguroso y Demostraciones Formales (Categoría: Demostración, Dificultad: ${diff}).
Tu objetivo es auditar la deducción matemática formal manuscrita de los ejercicios de una ronda completa a partir de 1 a 6 imágenes del cuaderno del estudiante.

CRITERIOS PEDAGÓGICOS POR DIFICULTAD:
${
  diff === 1
    ? '- Dificultad 1: Demostraciones directas, propiedades algebraicas fundamentales y axiomas básicos de los números reales.'
    : diff === 2
    ? '- Dificultad 2: Inducción matemática, demostraciones por contradicción y contrarrecíproca con rigurosa verificación de hipótesis.'
    : '- Dificultad 3: Rigor épsilon-delta, análisis matemático avanzado (Spivak), topología de reales y deducciones analíticas profundas.'
}

INSTRUCCIONES DE AUDITORÍA Y DETECCIÓN:
1. Revisa minuciosamente todas las imágenes adjuntas.
2. Identifica en qué página y sección se encuentra la demostración manuscrita de cada ejercicio según su orden o numeración.
3. Si un ejercicio NO aparece resuelto en ninguna imagen, está cortado o resulta totalmente ilegible, marca obligatoriamente "found": false, "score": 0 y explica en el feedback qué ocurrió.
4. Para cada ejercicio encontrado ("found": true):
   - Audita la validez deductiva formal, uso de cuantificadores (para todo, existe), fundamentación de cada implicación y ausencia de saltos lógicos o razonamiento circular frente a la solución de referencia.
   - Otorga score 5 si la demostración es deductivamente intachable y completa.
   - Otorga score 3 o 4 si la idea central y la estructura lógica son correctas pero faltan justificaciones menores o formalidad en notación.
   - Otorga score 0, 1 o 2 si hay falacias lógicas, asume lo que debe demostrar o la deducción es inválida.
   - Genera una pista socrática constructiva en "hint".

FORMATO OBLIGATORIO DE RESPUESTA:
Responde EXCLUSIVAMENTE con un JSON válido con la siguiente estructura exacta:
{
  "exercises": [
    {
      "order": 1,
      "found": true,
      "score": 5,
      "feedback_paso_a_paso": "Paso 1: Declaración de hipótesis...",
      "hint": "Consejo o pista socrática formal..."
    }
  ],
  "overall_feedback": "Resumen pedagógico general del rigor deductivo en la ronda."
}`;
}

/**
 * Evalúa las soluciones manuscritas de una ronda completa de ejercicios a partir de 1 a 6 imágenes.
 *
 * @param {Object} params
 * @param {Object} params.round - Datos de contexto de la ronda (topicTitle, category, difficulty)
 * @param {Array<{ order: number, statement: string, referenceSolution: string }>} params.exercises - Lista de ejercicios
 * @param {string[]} params.imagesBase64 - Array de 1 a 6 cadenas Base64 (JPEG)
 * @returns {Promise<{
 *   exercises: Array<{ order: number, found: boolean, score: number, feedback_paso_a_paso: string, hint: string }>,
 *   overall_feedback: string
 * }>}
 */
export async function evaluateRoundSolutions({ round, exercises, imagesBase64 }) {
  if (!Array.isArray(imagesBase64) || imagesBase64.length === 0 || imagesBase64.length > 6) {
    throw new Error('imagesBase64 must be an array of 1 to 6 base64 strings');
  }

  const sanitizedImages = imagesBase64.map((img, idx) => {
    if (typeof img !== 'string' || !img.trim()) {
      throw new Error(`Image at index ${idx} must be a valid base64 string`);
    }
    const clean = img.replace(/^data:image\/[a-zA-Z+]+;base64,/, '').trim();
    if (!clean) {
      throw new Error(`Image at index ${idx} must be a valid base64 string`);
    }
    return clean;
  });

  if (!Array.isArray(exercises) || exercises.length === 0) {
    throw new Error('exercises must be a non-empty array');
  }

  const category = round?.category || 'technique';
  const difficulty = Number(round?.difficulty) || 1;
  const topicTitle = round?.topicTitle || round?.title || 'Tema de Práctica';

  const systemInstruction = buildSystemInstruction(category, difficulty);

  // Construir el prompt estructurado con los ejercicios y sus soluciones canónicas de referencia
  const exercisesText = exercises
    .map(
      (e) => `--- EJERCICIO #${e.order} ---
ENUNCIADO:
${e.statement || 'Sin enunciado'}

SOLUCIÓN DE REFERENCIA Y CRITERIOS:
${e.referenceSolution || 'Sin solución de referencia disponible'}`
    )
    .join('\n\n');

  const prompt = `TEMA: ${topicTitle}
CATEGORÍA: ${category.toUpperCase()}
DIFICULTAD: ${difficulty}
CANTIDAD DE EJERCICIOS EN ESTA RONDA: ${exercises.length}
CANTIDAD DE IMÁGENES PROPORCIONADAS DEL CUADERNO: ${sanitizedImages.length}

A continuación se presentan los ejercicios que el estudiante debía resolver en su cuaderno:

${exercisesText}

INSTRUCCIONES PARA LA EVALUACIÓN:
1. Examina minuciosamente las ${sanitizedImages.length} imágenes adjuntas de la libreta del estudiante.
2. Localiza cada uno de los ${exercises.length} ejercicios según su numeración o contenido.
3. Si un ejercicio NO fue resuelto en las páginas provistas, indícalo con "found": false y score 0.
4. Evalúa con rigor formativo cada ejercicio y provee el feedback paso a paso y la pista socrática.
5. Devuelve tu respuesta EXCLUSIVAMENTE en formato JSON conforme a la estructura indicada.`;

  const client = getClient();
  if (!client || process.env.GEMINI_API_KEY === 'mock' || process.env.MOCK_GEMINI === 'true') {
    // Modo Offline determinista para tests o entornos locales sin API KEY
    return {
      exercises: exercises.map((e) => ({
        order: e.order,
        found: true,
        score: 4,
        feedback_paso_a_paso: `[Modo Offline] Ejercicio #${e.order}: Procedimiento ordenado y consistente con la solución de referencia para ${category}.`,
        hint: 'Verifica los signos y la simplificación antes de consolidar el resultado final.',
      })),
      overall_feedback: `[Modo Offline] Evaluación simulada exitosa para ${topicTitle} (${category}, nivel ${difficulty}).`,
    };
  }

  const imageParts = sanitizedImages.map((data) => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data,
    },
  }));

  const response = await client.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: [prompt, ...imageParts],
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const rawText = (response.text || '').trim();
  const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed = null;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        // Fallback
      }
    }
  }

  if (!parsed || !Array.isArray(parsed.exercises)) {
    throw new Error('Gemini response could not be parsed as valid round evaluation JSON');
  }

  // Normalización defensiva de los ejercicios evaluados
  const normalizedExercises = exercises.map((expectedEx) => {
    const foundAi = parsed.exercises.find((e) => Number(e.order) === expectedEx.order);

    if (!foundAi) {
      return {
        order: expectedEx.order,
        found: false,
        score: 0,
        feedback_paso_a_paso: `El ejercicio #${expectedEx.order} no fue detectado en las imágenes provistas.`,
        hint: 'Asegúrate de incluir las fotografías de todas las páginas de tu resolución.',
      };
    }

    const found = Boolean(foundAi.found !== false);
    const rawScore = Number(foundAi.score);
    const score = found ? Math.max(0, Math.min(5, Math.round(Number.isFinite(rawScore) ? rawScore : 0))) : 0;

    return {
      order: expectedEx.order,
      found,
      score,
      feedback_paso_a_paso: String(foundAi.feedback_paso_a_paso || foundAi.feedback || ''),
      hint: String(foundAi.hint || ''),
    };
  });

  return {
    exercises: normalizedExercises,
    overall_feedback: String(parsed.overall_feedback || 'Evaluación de ronda completada.'),
  };
}
