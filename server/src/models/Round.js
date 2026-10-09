import mongoose from 'mongoose';

const roundExerciseSnapshotSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    statement: {
      type: String,
      required: true,
    },
    expertMinutes: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const roundResultSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
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
  },
  { _id: false }
);

const roundSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TopicTrack',
      required: true,
      index: true,
    },
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
    exercises: {
      type: [roundExerciseSnapshotSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Una ronda debe contener al menos un ejercicio.',
      },
    },
    totalExpertMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'evaluated'],
      default: 'pending',
      index: true,
    },
    results: {
      type: [roundResultSchema],
      default: [],
    },
    roundScore: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },
    passRate: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },
    promoted: {
      type: Boolean,
      default: false,
    },
    previousDifficulty: {
      type: Number,
      enum: [1, 2, 3],
      default: null,
    },
    newDifficulty: {
      type: Number,
      enum: [1, 2, 3],
      default: null,
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Round = mongoose.models.Round || mongoose.model('Round', roundSchema);
export default Round;
