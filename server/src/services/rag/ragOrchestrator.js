import { preprocessQuery } from './queryPreprocessor.js';
import { hybridRetriever } from '../retrieval/hybridRetriever.js';
import { llmService } from '../llm/llmService.js';
import { validateCitations } from '../citations/citationValidator.js';
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
