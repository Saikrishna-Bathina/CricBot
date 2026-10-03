import express from 'express';
import {
  generateQuiz,
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizAttempts,
  getAttemptById,
} from '../controllers/quizController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/quizzes/generate', optionalAuth, generateQuiz);
router.get('/quizzes', getQuizzes);
router.get('/quizzes/:quizId', getQuizById);
router.post('/quizzes/:quizId/submit', optionalAuth, submitQuiz);
router.get('/quizzes/attempts', optionalAuth, getQuizAttempts);
router.get('/quizzes/attempts/:attemptId', optionalAuth, getAttemptById);

export default router;
