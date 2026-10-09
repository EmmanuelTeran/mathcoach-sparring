import mongoose from 'mongoose';

const reviewHistorySchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
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

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: [mongoose.Schema.Types.Mixed], default: [] },
    expected: {
      type: mongoose.Schema.Types.Mixed,
      validate: { validator: (v) => v !== undefined, message: 'expected is required' },
    },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false, minimize: false }
);

const codingChallengeSchema = new mongoose.Schema(
  {
    functionName: {
      type: String,
      required: true,
      trim: true,
      match: /^[A-Za-z_$][\w$]*$/,
    },
    description: { type: String, required: true },
    starterCode: { type: String, required: true },
    testCases: {
      type: [testCaseSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1,
        message: 'codingChallenge requires at least one test case',
      },
    },
    constraints: { type: [String], default: [] },
  },
  { _id: false }
);

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['hard_skill', 'soft_skill'],
    },
    type: {
      type: String,
      required: true,
      enum: ['theory', 'practice'],
    },
    srsStage: {
      type: Number,
      default: 0,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    intervalDays: {
      type: Number,
      default: 0,
    },
    nextReviewAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    level: {
      type: String,
      enum: ['junior', 'mid', 'senior'],
      default: 'junior',
    },
    codingChallenge: { type: codingChallengeSchema, required: false, default: undefined },
    history: [reviewHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para optimizar la consulta de temas pendientes
topicSchema.index({ nextReviewAt: 1, srsStage: 1 });

export const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

