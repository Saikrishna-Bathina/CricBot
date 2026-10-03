import { quizService } from '../services/quizzes/quizService.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { AppError } from '../middleware/errorHandler.js';

export async function generateQuiz(req, res, next) {
  try {
    const { topic, difficulty, questionCount, questionFormat, format } = req.body;
    const userId = req.user ? req.user._id : null;

    const quiz = await quizService.generateQuiz({
      topic: topic || 'general',
      difficulty: difficulty || 'intermediate',
      questionCount: questionCount ? parseInt(questionCount, 10) : 3,
      questionFormat: questionFormat || 'multiple_choice',
      format: format || 'ALL',
      userId,
    });

    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (err) {
    next(err);
  }
}

export async function getQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find({ status: 'published' })
      .select('title topic difficulty questionFormat createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (err) {
    next(err);
  }
}

export async function getQuizById(req, res, next) {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).populate({
      path: 'questions',
      select: '-correctAnswer', // Security requirement: Never return correctAnswer prior to submission
    }).lean();

    if (!quiz) {
      return next(new AppError('Quiz not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitQuiz(req, res, next) {
  try {
    const { quizId } = req.params;
    const { responses } = req.body;
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;

    if (!Array.isArray(responses)) {
      return next(new AppError('Responses array is required.', 400, 'VALIDATION_ERROR'));
    }

    const result = await quizService.submitQuizAttempt(quizId, {
      responses,
      userId,
      sessionId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getQuizAttempts(req, res, next) {
  try {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;

    const query = {};
    if (userId) {
      query.userId = userId;
    } else if (sessionId) {
      query.sessionId = sessionId;
    } else {
      return res.status(200).json({ success: true, data: [] });
    }

    const attempts = await QuizAttempt.find(query)
      .populate('quizId', 'title topic difficulty')
      .sort({ submittedAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAttemptById(req, res, next) {
  try {
    const { attemptId } = req.params;
    const attempt = await quizService.getAttempt(attemptId);

    // Access control check
    if (attempt.userId && (!req.user || (req.user._id.toString() !== attempt.userId.toString() && req.user.role !== 'admin'))) {
      return next(new AppError('Forbidden: Access denied to this attempt', 403, 'FORBIDDEN'));
    }

    res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (err) {
    next(err);
  }
}
