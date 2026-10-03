import Quiz from '../../models/Quiz.js';
import QuizQuestion from '../../models/QuizQuestion.js';
import QuizAttempt from '../../models/QuizAttempt.js';
import DocumentChunk from '../../models/DocumentChunk.js';
import { validateCitations } from '../citations/citationValidator.js';

export class QuizService {
  /**
   * Generates a quiz from approved database rule chunks.
   */
  async generateQuiz({
    topic = 'general',
    difficulty = 'intermediate',
    questionCount = 3,
    questionFormat = 'multiple_choice',
    format = 'ALL',
    userId = null,
  }) {
    // 1. Fetch eligible published chunks for the requested topic
    const chunkQuery = {};
    if (topic === 'fielding') chunkQuery.lawNumber = 28;
    else if (topic === 'boundaries') chunkQuery.lawNumber = 19;
    else if (topic === 'no-balls') chunkQuery.lawNumber = 21;
    else if (topic === 'wides') chunkQuery.lawNumber = 22;
    else if (topic === 'dismissals') chunkQuery.lawNumber = { $in: [30, 31, 32, 34, 35, 36, 37, 38, 39] };

    // Find existing questions matching criteria first
    let questions = await QuizQuestion.find({
      reviewStatus: 'approved',
      difficulty,
    })
      .populate('citationChunkIds')
      .limit(questionCount)
      .lean();

    // If fewer than requested questions exist, get all available approved questions
    if (questions.length < questionCount) {
      questions = await QuizQuestion.find({ reviewStatus: 'approved' })
        .populate('citationChunkIds')
        .limit(questionCount)
        .lean();
    }

    if (questions.length === 0) {
      throw new Error('No approved quiz questions available in database for this criteria.');
    }

    // Create a new Quiz instance
    const quiz = await Quiz.create({
      title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Laws Proficiency Quiz (${difficulty})`,
      topic,
      difficulty,
      questionFormat,
      applicableContext: { format, issuingOrganisation: 'MCC' },
      questions: questions.map((q) => q._id),
      status: 'published',
      createdBy: userId || null,
    });

    // Return quiz questions to client WITHOUT correctAnswer
    const clientQuestions = questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      difficulty: q.difficulty,
      lawReference: q.lawReference,
    }));

    return {
      quizId: quiz._id,
      title: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questionCount: clientQuestions.length,
      questions: clientQuestions,
    };
  }

  /**
   * Evaluates quiz submission on the server, calculates score, and saves attempt.
   */
  async submitQuizAttempt(quizId, { responses = [], userId = null, sessionId = null }) {
    if (!Array.isArray(responses) || responses.length === 0) {
      throw new Error('Responses array is required');
    }

    const quiz = await Quiz.findById(quizId).populate({
      path: 'questions',
      select: '+correctAnswer',
      populate: { path: 'citationChunkIds' },
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    let correctCount = 0;
    const evaluatedResponses = [];

    for (const q of quiz.questions) {
      const userResp = responses.find((r) => r.questionId.toString() === q._id.toString());
      const selected = userResp?.selectedOption || '';
      const isCorrect = selected.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();

      if (isCorrect) correctCount++;

      // Validate citations
      const citations = await validateCitations(
        (q.citationChunkIds || []).map((c) => ({ chunkId: c._id || c })),
        q.citationChunkIds
      );

      evaluatedResponses.push({
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        selectedOption: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        lawReference: q.lawReference,
        citations,
      });
    }

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const attempt = await QuizAttempt.create({
      quizId: quiz._id,
      userId: userId || null,
      sessionId: sessionId || null,
      responses: evaluatedResponses.map((r) => ({
        questionId: r.questionId,
        selectedOption: r.selectedOption,
        isCorrect: r.isCorrect,
        correctAnswer: r.correctAnswer,
        explanation: r.explanation,
      })),
      score: correctCount,
      totalQuestions,
      percentage,
      submittedAt: new Date(),
    });

    return {
      attemptId: attempt._id,
      quizId: quiz._id,
      score: correctCount,
      totalQuestions,
      percentage,
      passed: percentage >= 70,
      results: evaluatedResponses,
    };
  }

  /**
   * Retrieves past quiz attempt by ID.
   */
  async getAttempt(attemptId) {
    const attempt = await QuizAttempt.findById(attemptId).populate('quizId').lean();
    if (!attempt) {
      throw new Error('Quiz attempt record not found');
    }
    return attempt;
  }
}

export const quizService = new QuizService();
