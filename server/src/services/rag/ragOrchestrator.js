import mongoose from 'mongoose';
import { preprocessQuery } from './queryPreprocessor.js';
import { hybridRetriever } from '../retrieval/hybridRetriever.js';
import { llmService } from '../llm/llmService.js';
import { validateCitations } from '../citations/citationValidator.js';
import { pythonRagClient } from './pythonRagClient.js';
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';

export class RAGOrchestrator {
  /**
   * Main entry point for cricket laws question answering.
   */
  async answerQuestion({ query, conversationId = null, userId = null, sessionId = null, context = {} }) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      throw new Error('Query string is required');
    }

    // 1. Preprocess query
    const preprocessed = preprocessQuery(query, context);

    // Feature Flag Check: Python RAG Service
    if (pythonRagClient.isEnabled()) {
      const pyResult = await pythonRagClient.answerQuestion({
        query,
        format: preprocessed.resolvedFormat,
        competition: preprocessed.resolvedCompetition,
      });

      if (pyResult.success && pyResult.data) {
        const pyData = pyResult.data;
        let conv = null;
        if (conversationId) {
          conv = await Conversation.findById(conversationId);
        }
        if (!conv) {
          conv = await Conversation.create({
            userId: userId || null,
            sessionId: sessionId || null,
            title: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
            format: preprocessed.resolvedFormat,
            competition: preprocessed.resolvedCompetition,
          });
        }

        await Message.create({
          conversationId: conv._id,
          role: 'user',
          content: query,
          messageType: 'standard',
          applicableContext: { format: preprocessed.resolvedFormat },
        });

        const formattedContent = `### Ruling:\n${pyData.answer}\n\n${(pyData.limitations && pyData.limitations.length) ? `> **Notice**: ${pyData.limitations.join('; ')}` : ''}`;

        const assistantMsg = await Message.create({
          conversationId: conv._id,
          role: 'assistant',
          content: formattedContent,
          messageType: pyData.status !== 'answered' ? 'unsupported_warning' : 'standard',
          citations: (pyData.citations || [])
            .filter((c) => c && c.chunkId)
            .map((c) => ({
              chunkId: c.chunkId,
              documentId: (c.documentId && mongoose.Types.ObjectId.isValid(c.documentId)) ? c.documentId : null,
              clauseNumber: c.clauseNumber || '',
              lawNumber: c.lawNumber || null,
              lawTitle: c.title || '',
              sourceTitle: c.parentLaw || 'Official Cricket Regulations',
              verbatimExcerpt: c.content || '',
              pageStart: c.printedPage || 1,
              pageEnd: c.printedPage || 1,
            })),

          applicableContext: {
            format: preprocessed.resolvedFormat,
            edition: 'Official Python Service RAG',
            issuingOrganisation: 'MCC/ICC',
          },
        });

        return {
          conversationId: conv._id,
          messageId: assistantMsg._id,
          query,
          answer: {
            directAnswer: pyData.answer,
            applicableLaw: (pyData.citations && pyData.citations[0]) ? `${pyData.citations[0].parentLaw || ''} ${pyData.citations[0].clauseNumber}` : 'Official Regulations',
            explanation: pyData.answer,
            formattedContent,
            isSupported: pyData.status === 'answered',
            limitations: pyData.limitations ? pyData.limitations.join('; ') : '',
          },
          citations: (pyData.citations || []).map((c) => ({
            chunkId: c.chunkId,
            clauseNumber: c.clauseNumber,
            lawTitle: c.title,
            textSnippet: c.content,
            verified: c.verified,
          })),
          applicableContext: assistantMsg.applicableContext,
          evidenceMetadata: (pyData.citations || []).map((c) => ({
            chunkId: c.chunkId,
            clauseNumber: c.clauseNumber,
            lawTitle: c.title,
            score: 1.0,
          })),
        };
      }
    }

    // 2. Hybrid Retrieval
    const retrievalResult = await hybridRetriever.retrieve(preprocessed.normalizedQuery, {
      topK: 5,
      format: preprocessed.resolvedFormat,
      competition: preprocessed.resolvedCompetition,
      includeSuperseded: preprocessed.isHistorical,
    });

    const evidence = retrievalResult.evidence || [];

    // 3. Generate Evidence-Grounded Answer
    const llmAnswer = await llmService.generateAnswer(preprocessed.normalizedQuery, evidence, {
      format: preprocessed.resolvedFormat,
      competition: preprocessed.resolvedCompetition,
    });

    // 4. Citation Validation (verifies chunk IDs map to real DB records)
    const rawCitations = (llmAnswer.citations || []).length > 0
      ? llmAnswer.citations
      : evidence.slice(0, 3).map((e) => ({ chunkId: e.chunkId }));

    const validatedCitations = await validateCitations(rawCitations, evidence);

    // 5. Conversation Persistence
    let conv = null;
    if (conversationId) {
      conv = await Conversation.findById(conversationId);
    }
    if (!conv) {
      conv = await Conversation.create({
        userId: userId || null,
        sessionId: sessionId || null,
        title: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
        format: preprocessed.resolvedFormat,
        competition: preprocessed.resolvedCompetition,
      });
    }

    // Save user message
    await Message.create({
      conversationId: conv._id,
      role: 'user',
      content: query,
      messageType: 'standard',
      applicableContext: {
        format: preprocessed.resolvedFormat,
      },
    });

    // Save assistant message
    const formattedContent = `### Ruling:
${llmAnswer.directAnswer}

### Applicable Regulation:
${llmAnswer.applicableLaw}

### Official Explanation:
${llmAnswer.explanation}

${llmAnswer.application ? `### Application to Situation:\n${llmAnswer.application}\n` : ''}
${(llmAnswer.exceptions && llmAnswer.exceptions.length > 0) ? `### Exceptions:\n${llmAnswer.exceptions.map((e) => `- ${e}`).join('\n')}\n` : ''}
${(llmAnswer.missingFacts && llmAnswer.missingFacts.length > 0) ? `### Missing Facts:\n${llmAnswer.missingFacts.map((f) => `- ${f}`).join('\n')}\n` : ''}
${llmAnswer.limitations ? `> **Notice**: ${llmAnswer.limitations}` : ''}`;

    const assistantMsg = await Message.create({
      conversationId: conv._id,
      role: 'assistant',
      content: formattedContent,
      messageType: !llmAnswer.isSupported ? 'unsupported_warning' : 'standard',
      citations: validatedCitations,
      applicableContext: {
        format: preprocessed.resolvedFormat,
        edition: evidence[0]?.source?.version || 'Official Current',
        issuingOrganisation: evidence[0]?.source?.issuingOrganisation || 'MCC',
      },
    });

    return {
      conversationId: conv._id,
      messageId: assistantMsg._id,
      query,
      answer: {
        directAnswer: llmAnswer.directAnswer,
        applicableLaw: llmAnswer.applicableLaw,
        explanation: llmAnswer.explanation,
        application: llmAnswer.application,
        exceptions: llmAnswer.exceptions || [],
        missingFacts: llmAnswer.missingFacts || [],
        formattedContent,
        isSupported: llmAnswer.isSupported,
        limitations: llmAnswer.limitations,
      },
      citations: validatedCitations,
      applicableContext: assistantMsg.applicableContext,
      evidenceMetadata: evidence.map((e) => ({
        chunkId: e.chunkId,
        lawTitle: e.lawTitle,
        clauseNumber: e.clauseNumber,
        source: e.source,
        score: e.relevanceScore,
      })),
    };
  }
}

export const ragOrchestrator = new RAGOrchestrator();
