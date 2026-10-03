import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'scenario_based'],
      default: 'multiple_choice',
    },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    // Hidden from client prior to submission
    correctAnswer: {
      type: String,
      required: true,
      select: false,
    },
    explanation: {
      type: String,
      required: true,
    },
    citationChunkIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentChunk',
      },
    ],
    lawReference: {
      lawNumber: { type: Number, default: null },
      clauseNumber: { type: String, default: '' },
      sourceTitle: { type: String, default: '' },
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
  },
  {
    timestamps: true,
  }
);

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
export default QuizQuestion;
