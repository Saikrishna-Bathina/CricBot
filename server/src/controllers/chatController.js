import { ragOrchestrator } from '../services/rag/ragOrchestrator.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { AppError } from '../middleware/errorHandler.js';

export async function askQuestion(req, res, next) {
  try {
    const { question, conversationId, context } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return next(new AppError('A valid question string is required.', 400, 'VALIDATION_ERROR'));
    }

    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;

    const result = await ragOrchestrator.answerQuestion({
      query: question,
      conversationId,
      userId,
      sessionId,
      context: context || {},
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversations(req, res, next) {
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

    const conversations = await Conversation.find(query).sort({ updatedAt: -1 }).limit(20).lean();

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversationById(req, res, next) {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return next(new AppError('Conversation not found', 404, 'NOT_FOUND'));
    }

    // Access control: check ownership for both user-authenticated and session-based guest chats
    if (conversation.userId) {
      if (!req.user || (req.user._id.toString() !== conversation.userId.toString() && req.user.role !== 'admin')) {
        return next(new AppError('Forbidden: Access denied to this conversation', 403, 'FORBIDDEN'));
      }
    } else if (conversation.sessionId) {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId || sessionId !== conversation.sessionId) {
        if (!req.user || req.user.role !== 'admin') {
          return next(new AppError('Forbidden: Access denied to this session conversation', 403, 'FORBIDDEN'));
        }
      }
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return next(new AppError('Conversation not found', 404, 'NOT_FOUND'));
    }

    if (conversation.userId) {
      if (!req.user || (req.user._id.toString() !== conversation.userId.toString() && req.user.role !== 'admin')) {
        return next(new AppError('Forbidden: Access denied to delete this conversation', 403, 'FORBIDDEN'));
      }
    } else if (conversation.sessionId) {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId || sessionId !== conversation.sessionId) {
        if (!req.user || req.user.role !== 'admin') {
          return next(new AppError('Forbidden: Access denied to delete this session conversation', 403, 'FORBIDDEN'));
        }
      }
    }

    await Message.deleteMany({ conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({
      success: true,
      message: 'Conversation and messages deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
