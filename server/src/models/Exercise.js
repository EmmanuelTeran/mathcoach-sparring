import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MathTopic',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['technique', 'application', 'proof'],
    },
    difficulty: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },
    order: {
      type: Number,
      required: true, // Complejidad creciente dentro de la categoría y dificultad
    },
    statement: {
      type: String,
      required: true,
      trim: true, // Markdown + notación LaTeX ($...$ / $$...$$)
    },
    referenceSolution: {
      type: String,
      default: '',
      trim: true, // Solución técnica / criterios para el evaluador IA
    },
    expertMinutes: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return typeof v === 'number' && v > 0;
        },
        message: 'expertMinutes debe ser un número mayor a 0',
      },
    },
    source: {
      type: String,
      trim: true,
      default: 'CONAMAT',
    },
    timesServed: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastServedAt: {
      type: Date,
      default: null,
    },
    externalKey: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Clave única determinista para seed idempotente (ej. 'alg-frac-tech-d1-01')
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para selección y ordenamiento óptimo de rondas
exerciseSchema.index({ topicId: 1, category: 1, difficulty: 1, order: 1 });

export const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);
export default Exercise;
