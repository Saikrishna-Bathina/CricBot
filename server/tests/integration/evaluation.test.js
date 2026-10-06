import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { hybridRetriever } from '../../src/services/retrieval/hybridRetriever.js';
import { EVALUATION_DATASET } from '../../src/services/rag/evaluationDataset.js';

describe('Curated RAG Evaluation & Retrieval Accuracy Benchmark', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should achieve high Recall@5 and MRR across curated cricket evaluation questions', async () => {
    let hitsAtK = 0;
    let sumReciprocalRank = 0;
    const testCases = EVALUATION_DATASET.filter((tc) => !tc.shouldAbstain);

    for (const testCase of testCases) {
      const result = await hybridRetriever.retrieve(testCase.query, {
        topK: 5,
        format: testCase.applicableFormat || 'ALL',
      });

      const evidence = result.evidence || [];
      let rank = -1;

      for (let i = 0; i < evidence.length; i++) {
        const item = evidence[i];
        const matchesLaw = testCase.expectedLaw ? item.lawNumber === testCase.expectedLaw : true;
        const matchesClause = testCase.expectedClause
          ? (item.clauseNumber && item.clauseNumber.startsWith(testCase.expectedClause))
          : false;

        if (matchesLaw && (matchesClause || !testCase.expectedClause)) {
          rank = i + 1;
          break;
        }
      }

      if (rank > 0) {
        hitsAtK++;
        sumReciprocalRank += 1.0 / rank;
      }
    }

    const recallAt5 = hitsAtK / testCases.length;
    const mrr = sumReciprocalRank / testCases.length;

    console.log(`[RAG Benchmark] Evaluation Queries Tested: ${testCases.length}`);
    console.log(`[RAG Benchmark] Retrieval Recall@5: ${(recallAt5 * 100).toFixed(1)}%`);
    console.log(`[RAG Benchmark] Mean Reciprocal Rank (MRR): ${mrr.toFixed(3)}`);

    expect(recallAt5).toBeGreaterThanOrEqual(0.85);
    expect(mrr).toBeGreaterThanOrEqual(0.70);
  }, 60000);
});
