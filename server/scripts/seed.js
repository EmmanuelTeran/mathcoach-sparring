import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from '../src/db.js';
import { MathTopic } from '../src/models/MathTopic.js';
import { Exercise } from '../src/models/Exercise.js';
import { ensureTracksForTopic } from '../src/services/trackService.js';
import { curatedTopics } from '../seed-data/index.js';

// Cargar variables de entorno si se invoca directamente por CLI
dotenv.config();

/**
 * Función programática e idempotente de siembra de base de datos.
 *
 * @param {object} options
 * @param {boolean} [options.log=false] - Imprimir detalles a la consola
 * @returns {Promise<{ topicsProcessed: number, tracksProcessed: number, exercisesProcessed: number }>}
 */
export async function seedDatabase(options = { log: false }) {
  const { log } = options;
  let topicsCount = 0;
  let tracksCount = 0;
  let exercisesCount = 0;

  for (const topicData of curatedTopics) {
    // 1. Upsert atómico por slug en MathTopic
    const topic = await MathTopic.findOneAndUpdate(
      { slug: topicData.slug },
      {
        $set: {
          slug: topicData.slug,
          ...topicData.metadata,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
    topicsCount++;

    // 2. Inicialización idempotente de las 3 pistas (TopicTrack)
    const tracks = await ensureTracksForTopic(topic._id);
    tracksCount += tracks.length;

    // 3. Upsert atómico por externalKey en Exercise
    for (const exData of topicData.exercises) {
      await Exercise.findOneAndUpdate(
        { externalKey: exData.externalKey },
        {
          $set: {
            topicId: topic._id,
            category: exData.category,
            difficulty: exData.difficulty,
            order: exData.order,
            statement: exData.statement,
            referenceSolution: exData.referenceSolution,
            expertMinutes: exData.expertMinutes,
            source: exData.source || topicData.metadata.source || 'CONAMAT',
          },
          $setOnInsert: {
            timesServed: 0,
            lastServedAt: null,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
      exercisesCount++;
    }

    if (log) {
      console.log(
        `✓ Tema procesado: "${topic.title}" (${topic.slug}) | Pistas: ${tracks.length} | Ejercicios: ${topicData.exercises.length}`
      );
    }
  }

  return {
    topicsProcessed: topicsCount,
    tracksProcessed: tracksCount,
    exercisesProcessed: exercisesCount,
  };
}

// Ejecución directa vía CLI: `node scripts/seed.js`
const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMainModule) {
  (async () => {
    try {
      console.log('--- Iniciando siembra de catálogo (seed) ---');
      await connectDB();
      const summary = await seedDatabase({ log: true });
      console.log('-------------------------------------------');
      console.log('✓ Siembra completada exitosamente:');
      console.log(`  - Temas procesados:      ${summary.topicsProcessed}`);
      console.log(`  - Pistas aseguradas:     ${summary.tracksProcessed}`);
      console.log(`  - Ejercicios procesados: ${summary.exercisesProcessed}`);
      console.log('-------------------------------------------');
      await disconnectDB();
      process.exit(0);
    } catch (error) {
      console.error('Error durante la ejecución del seed:', error);
      try {
        await disconnectDB();
      } catch (_) {}
      process.exit(1);
    }
  })();
}

export default seedDatabase;
