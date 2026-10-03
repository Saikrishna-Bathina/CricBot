import express from 'express';
import { askQuestion, getConversations, getConversationById, deleteConversation } from '../controllers/chatController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', optionalAuth, askQuestion);
router.get('/conversations', optionalAuth, getConversations);
router.get('/conversations/:conversationId', optionalAuth, getConversationById);
router.delete('/conversations/:conversationId', optionalAuth, deleteConversation);

export default router;
