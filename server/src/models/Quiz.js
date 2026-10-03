import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      enum: ['dismissals', 'fielding', 'bowling', 'boundaries', 'no-balls', 'wides', 'umpiring', 'general'],
      default: 'general',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
      index: true,
    },
    questionFormat: {
      type: String,
      enum: ['multiple_choice', 'scenario_based', 'mixed'],
      default: 'multiple_choice',
    },
    applicableContext: {
      format: { type: String, default: 'ALL' },
      issuingOrganisation: { type: String, default: 'MCC' },
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
