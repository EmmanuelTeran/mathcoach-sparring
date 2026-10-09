import mongoose from 'mongoose';

const reviewHistorySchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    feedback_paso_a_paso: {
      type: String,
      default: '',
    },
    hint: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
    // Compatibilidad con registros previos de historial
    userInput: {
      type: String,
      default: '',
    },
    aiFeedback: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const mathTopicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'CONAMAT',
    },
    type: {
      type: String,
      default: 'practice',
    },
    category: {
      type: String,
      default: 'hard_skill',
    },
    level: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: 1,
      validate: {
        validator: function (v) {
          return [1, 2, 3, '1', '2', '3', 'junior', 'mid', 'senior'].includes(v);
        },
        message: props => `${props.value} no es un nivel válido`,
      },
    },
    problemStatement: {
      type: String,
      default: 'Ejercicio general de evaluación',
      trim: true,
    },

    // ==========================================
    // Motor de Spaced Repetition (SRS SM-2)
    // ==========================================
    repetition: {
      type: Number,
      default: 0,
      alias: 'srsStage',
    },
    interval: {
      type: Number,
      default: 0,
      alias: 'intervalDays',
    },
    efactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
      alias: 'easeFactor',
    },
    dueDate: {
      type: Date,
      default: Date.now,
      index: true,
      alias: 'nextReviewAt',
    },

    history: [reviewHistorySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice compuesto para optimizar la consulta de temas y ejercicios pendientes
mathTopicSchema.index({ dueDate: 1, repetition: 1 });

export const MathTopic = mongoose.models.MathTopic || mongoose.model('MathTopic', mathTopicSchema);
export const Topic = MathTopic;
export default MathTopic;
