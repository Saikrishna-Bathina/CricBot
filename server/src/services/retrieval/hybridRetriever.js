import DocumentChunk from '../../models/DocumentChunk.js';
import Document from '../../models/Document.js';
import { embeddingService } from '../embeddings/embeddingService.js';
import { env } from '../../config/env.js';

/**
 * Calculates cosine similarity between two numeric vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Extracts explicit law numbers and clause references from a query.
 * e.g., "What does Law 28 say about helmets?" -> lawNumber: 28
 * "According to 41.16 can the bowler run out the non-striker?" -> clause: "41.16"
 */
export function extractQueryEntities(query) {
  const lawMatch = query.match(/(?:law\s*(\d{1,2})|rule\s*(\d{1,2}))/i);
  const clauseMatch = query.match(/\b(\d{1,2}\.\d+(?:\.\d+)?)\b/);
  
  let format = 'ALL';
  if (/\b(?:t20|t20i|twenty20)\b/i.test(query)) format = 'T20I';
  else if (/\b(?:odi|one\s*day)\b/i.test(query)) format = 'ODI';
  else if (/\b(?:test|first\s*class)\b/i.test(query)) format = 'TEST';

  let isHistorical = false;
  if (/\b(?:historical|prior\s*to|before\s*2022|old\s*rule|previous\s*code|2017)\b/i.test(query)) {
    isHistorical = true;
  }

  return {
    lawNumber: lawMatch ? parseInt(lawMatch[1] || lawMatch[2], 10) : null,
    clauseNumber: clauseMatch ? clauseMatch[1] : null,
    format,
    isHistorical,
  };
}

export class HybridRetriever {
  constructor() {
    this.vectorIndexName = env.VECTOR_INDEX_NAME;
  }

  /**
   * Main retrieval method combining vector search, exact match, and metadata filters.
   */
  async retrieve(query, options = {}) {
    const {
      topK = 5,
      format = null,
      competition = null,
      issuingOrganisation = null,
      includeSuperseded = false,
    } = options;

    const entities = extractQueryEntities(query);
    const targetFormat = format || entities.format;
    const allowSuperseded = includeSuperseded || entities.isHistorical;

    // 1. Resolve eligible document IDs
    const docQuery = {};
    if (!allowSuperseded) {
      docQuery.status = 'published';
    } else {
      docQuery.status = { $in: ['published', 'superseded'] };
    }

    if (issuingOrganisation) {
      docQuery.issuingOrganisation = issuingOrganisation;
    }

    if (targetFormat && targetFormat !== 'ALL') {
      docQuery.applicableFormats = { $in: [targetFormat, 'ALL'] };
    }

    const eligibleDocs = await Document.find(docQuery).select('_id title issuingOrganisation version status sourceUrl').lean();
    if (eligibleDocs.length === 0) {
      return {
        query,
        evidence: [],
        extractedEntities: entities,
        message: 'No published documents match the requested applicability criteria.',
      };
    }

    const eligibleDocIds = eligibleDocs.map((d) => d._id);
    const docMap = new Map(eligibleDocs.map((d) => [d._id.toString(), d]));

    // 2. Generate embedding for semantic retrieval
    const queryVector = await embeddingService.getEmbedding(query);

    // 3. Perform Vector Retrieval
    let vectorResults = [];
    try {
      // Attempt MongoDB Atlas $vectorSearch aggregation
      vectorResults = await DocumentChunk.aggregate([
        {
          $vectorSearch: {
            index: this.vectorIndexName,
            path: 'embedding',
            queryVector,
            numCandidates: topK * 10,
            limit: topK * 3,
            filter: {
              documentId: { $in: eligibleDocIds },
            },
          },
        },
        {
          $project: {
            _id: 1,
            documentId: 1,
            chunkIndex: 1,
            text: 1,
            lawNumber: 1,
            lawTitle: 1,
            clauseNumber: 1,
            pageStart: 1,
            pageEnd: 1,
            sectionHeading: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);
    } catch (atlasErr) {
      vectorResults = [];
    }

    // If Atlas Vector Search returned 0 items or is not yet configured, use in-memory cosine similarity fallback
    if (!vectorResults || vectorResults.length === 0) {
      const candidateChunks = await DocumentChunk.find({
        documentId: { $in: eligibleDocIds },
      }).select('+embedding').lean();

      vectorResults = candidateChunks.map((chunk) => {
        const score = cosineSimilarity(queryVector, chunk.embedding);
        const { embedding, ...cleanChunk } = chunk;
        return {
          ...cleanChunk,
          score,
        };
      });

      vectorResults.sort((a, b) => b.score - a.score);
      vectorResults = vectorResults.slice(0, topK * 3);
    }

    // 4. Perform Lexical / Exact Match Retrieval
    const lexicalFilter = {
      documentId: { $in: eligibleDocIds },
      $or: [],
    };

    if (entities.clauseNumber) {
      lexicalFilter.$or.push({ clauseNumber: new RegExp(`^${entities.clauseNumber}`) });
    }
    if (entities.lawNumber) {
      lexicalFilter.$or.push({ lawNumber: entities.lawNumber });
    }

    // Cricket domain multi-word phrases
    const phrases = [
      'run out', 'no ball', 'wide ball', 'timed out', 'obstructing the field',
      'leg before wicket', 'hit wicket', 'dead ball', 'non-striker', 'free hit',
      'stop clock', 'penalty runs', 'protective equipment'
    ];
    const matchedPhrases = phrases.filter((p) => query.toLowerCase().includes(p));

    matchedPhrases.forEach((phrase) => {
      lexicalFilter.$or.push({
        text: { $regex: phrase.replace('-', '[- ]'), $options: 'i' },
      });
    });

    // Keyword tokens from query (replace punctuation with space so hyphens don't merge words)
    const stopWords = new Set(['what', 'when', 'where', 'which', 'that', 'this', 'with', 'from', 'have', 'been', 'does', 'ball', 'batter', 'match', 'play']);
    const rawTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/-/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));

    if (rawTokens.length > 0) {
      // Search for chunks matching any of the significant query tokens
      rawTokens.forEach((token) => {
        lexicalFilter.$or.push({
          text: { $regex: `\\b${token}`, $options: 'i' },
        });
      });
    }

    let lexicalResults = [];
    if (lexicalFilter.$or.length > 0) {
      lexicalResults = await DocumentChunk.find(lexicalFilter).limit(topK * 4).lean();
    }

    // 5. Score Fusion & Deduplication
    const mergedMap = new Map();

    // Ingest vector scores
    vectorResults.forEach((item) => {
      const id = item._id.toString();
      mergedMap.set(id, {
        chunk: item,
        vectorScore: item.score || 0,
        lexicalScore: 0,
        boostScore: 0,
      });
    });

    // Ingest and calculate lexical frequency scores
    lexicalResults.forEach((item) => {
      const id = item._id.toString();
      const textLower = (item.text || '').toLowerCase();
      
      // Calculate token density
      let matchCount = 0;
      rawTokens.forEach((tok) => {
        if (textLower.includes(tok)) matchCount += 1;
      });
      matchedPhrases.forEach((phrase) => {
        if (textLower.includes(phrase)) matchCount += 3;
      });

      const densityScore = rawTokens.length > 0 ? (matchCount / (rawTokens.length + 1)) : 0.5;

      if (!mergedMap.has(id)) {
        mergedMap.set(id, {
          chunk: item,
          vectorScore: 0,
          lexicalScore: Math.min(densityScore, 1.0),
          boostScore: 0,
        });
      } else {
        mergedMap.get(id).lexicalScore = Math.min(densityScore, 1.0);
      }
    });

    // Apply Domain Authority & Exact Match Boosts
    const highSpecificityTerms = [
      'helmet', 'obstructing', 'timed out', 'non-striker', 'saliva',
      'beamer', 'stop clock', 'free hit', 'super over', 'substitute',
      'follow-on', 'declaration', 'lbw', 'leg before'
    ];
    const queryLower = query.toLowerCase();

    for (const [id, entry] of mergedMap.entries()) {
      const c = entry.chunk;
      const textLower = (c.text || '').toLowerCase();

      // High-specificity cricket domain term boost
      highSpecificityTerms.forEach((term) => {
        if (queryLower.includes(term) && textLower.includes(term)) {
          entry.boostScore += 1.2;
        }
      });

      // Exact clause match boost
      if (entities.clauseNumber && c.clauseNumber && c.clauseNumber.startsWith(entities.clauseNumber)) {
        entry.boostScore += 1.5;
      }
      // Exact law number match boost
      if (entities.lawNumber && c.lawNumber === entities.lawNumber) {
        entry.boostScore += 1.0;
      }
      // If format was requested and chunk matches format
      if (targetFormat && c.applicableFormats && c.applicableFormats.includes(targetFormat)) {
        entry.boostScore += 0.3;
      }

      // Calculate combined score
      entry.finalScore = (entry.vectorScore * 0.40) + (entry.lexicalScore * 0.25) + (entry.boostScore * 0.35);
    }

    // Sort by final combined score
    const sortedEntries = Array.from(mergedMap.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topK);

    // Format evidence chunks with parent document metadata
    const evidence = sortedEntries.map(({ chunk, finalScore }) => {
      const parentDoc = docMap.get(chunk.documentId.toString()) || {};
      return {
        chunkId: chunk._id.toString(),
        documentId: chunk.documentId.toString(),
        lawNumber: chunk.lawNumber,
        lawTitle: chunk.lawTitle,
        clauseNumber: chunk.clauseNumber,
        sectionHeading: chunk.sectionHeading,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        text: chunk.text,
        relevanceScore: parseFloat(finalScore.toFixed(4)),
        source: {
          title: parentDoc.title || 'Official Cricket Rulebook',
          issuingOrganisation: parentDoc.issuingOrganisation || chunk.issuingOrganisation || 'MCC',
          version: parentDoc.version || chunk.documentVersion,
          sourceUrl: parentDoc.sourceUrl || '',
          status: parentDoc.status,
        },
      };
    });

    return {
      query,
      extractedEntities: entities,
      evidence,
      totalEvidenceCount: evidence.length,
    };
  }
}

export const hybridRetriever = new HybridRetriever();
