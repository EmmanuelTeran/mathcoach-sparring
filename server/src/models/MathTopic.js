import mongoose from 'mongoose';

const mathTopicSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      enum: ['algebra', 'trigonometria', 'geometria', 'calculo', 'analisis'],
      index: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'CONAMAT',
    },
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const MathTopic = mongoose.models.MathTopic || mongoose.model('MathTopic', mathTopicSchema);
export default MathTopic;
