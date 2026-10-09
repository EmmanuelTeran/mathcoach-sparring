import mongoose from 'mongoose';

const topicTrackSchema = new mongoose.Schema(
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
      default: 1,
      enum: [1, 2, 3],
    },
    repetition: {
      type: Number,
      default: 0,
      min: 0,
    },
    interval: {
      type: Number,
      default: 0,
      min: 0,
    },
    efactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    dueDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastRoundScore: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },
    roundsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Cada tema tiene exactamente una pista por categoría (3 pistas por tema)
topicTrackSchema.index({ topicId: 1, category: 1 }, { unique: true });

export const TopicTrack = mongoose.models.TopicTrack || mongoose.model('TopicTrack', topicTrackSchema);
export default TopicTrack;
